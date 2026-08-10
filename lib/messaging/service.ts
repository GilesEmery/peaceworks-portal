import "server-only";

import { createAdminSupabaseClient, isAdminEmail } from "../admin/authorization";
import {
  memberErrorResponse,
  requireMemberFromRequest,
  type MemberAuthResult,
} from "../member/authorization";

export type ConversationType =
  | "direct"
  | "group"
  | "circle"
  | "announcement"
  | "admin_support";
export type ConversationParticipant = {
  profileId: string;
  displayName: string;
  participantRole: "owner" | "moderator" | "member";
};
export type Message = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; displayName: string } | null;
};
export type ConversationSummary = {
  id: string;
  conversationType: ConversationType;
  title: string;
  circle: { id: string; name: string } | null;
  participantSummary: string;
  latestMessagePreview: string;
  latestMessageAt: string | null;
  unread: boolean;
  archived: boolean;
  repliesEnabled: boolean;
};
export type ConversationDetail = ConversationSummary & {
  participants: ConversationParticipant[];
  messages: Message[];
};
export type EligibleMessagingRecipient = {
  id: string;
  displayName: string;
  relationship: "admin" | "circle_member" | "circle_coach" | "direct_member" | "direct_coach";
  circleIds: string[];
};
export type MessagingPermissions = {
  isAdmin: boolean;
  isCoach: boolean;
  isCircleMember: boolean;
  canCreateGroups: boolean;
  canContactSupport: true;
};
export type CreateConversationPayload = {
  conversationType: "direct" | "group" | "circle" | "admin_support";
  title: string;
  initialMessage: string;
  requestId: string;
  circleId?: string;
  circleDiscussion?: boolean;
  recipientIds?: string[];
};
export type SendMessagePayload = { body: string };
export type ArchiveConversationPayload = { archived: boolean };
export type DeleteConversationForMePayload = { confirmed: boolean };
export type CommunicationPortalDeliveryResult = {
  conversationId: string;
  created: boolean;
};
export type UnreadCountResponse = { ok: true; unreadCount: number };

type MessagingContext = {
  auth: Extract<MemberAuthResult, { ok: true }>;
  profileId: string;
  isAdmin: boolean;
  isCoach: boolean;
  memberCircleIds: Set<string>;
  coachedCircleIds: Set<string>;
  directMemberIds: Set<string>;
  directCoachIds: Set<string>;
};

const conversationSelect =
  "id,conversation_type,title,circle_id,support_profile_id,created_by,source_communication_id,is_announcement,replies_enabled,status,visible_from,visible_until,created_at,updated_at";
const maxMessageLength = 10000;

export async function requireMessagingContext(request: Request) {
  const auth = await requireMemberFromRequest(request);
  if (!auth.ok) return auth;

  try {
    return { ok: true as const, context: await loadMessagingContext(auth) };
  } catch (error) {
    console.error("Messaging authorization failed", error);
    return {
      ok: false as const,
      status: 503 as const,
      code: "messaging_authorization_failed",
      message: "Messaging access could not be verified.",
    };
  }
}

export function messagingErrorResponse(
  result: Exclude<Awaited<ReturnType<typeof requireMessagingContext>>, { ok: true }>
) {
  return memberErrorResponse(result);
}

export async function getMessagingInbox(
  context: MessagingContext,
  archived = false
): Promise<{ ok: true; conversations: ConversationSummary[]; permissions: MessagingPermissions }> {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("conversation_participants")
    .select(
      `participant_role,last_read_at,archived_at,deleted_at,left_at,conversation:conversations!inner(${conversationSelect})`
    )
    .eq("profile_id", context.profileId)
    .is("left_at", null)
    .is("deleted_at", null);
  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  const { data, error } = await query;
  if (error) throw new Error(`Inbox could not be loaded: ${error.message}`);

  const now = new Date().toISOString();
  const rows = (data || []).filter((row) =>
    isConversationCurrentlyVisible(relation(row.conversation), now)
  );
  const conversationIds = rows.map((row) => String(relation(row.conversation).id));
  const details = await loadConversationPresentation(conversationIds);
  const conversations = rows
    .map((row) => {
      const conversation = relation(row.conversation);
      return mapSummary(
        conversation,
        details.get(String(conversation.id)),
        row.last_read_at,
        Boolean(row.archived_at)
      );
    })
    .sort(compareSummaries);

  return { ok: true, conversations, permissions: permissions(context) };
}

export async function getUnreadCount(
  context: MessagingContext
): Promise<UnreadCountResponse> {
  const inbox = await getMessagingInbox(context);
  return {
    ok: true,
    unreadCount: inbox.conversations.filter((conversation) => conversation.unread).length,
  };
}

export async function getEligibleRecipients(context: MessagingContext) {
  const supabase = createAdminSupabaseClient();
  const eligible = await eligibleRecipientMap(context);
  const ids = Array.from(eligible.keys());
  const { data, error } = ids.length
    ? await supabase
        .from("profiles")
        .select("id,first_name,last_name")
        .in("id", ids)
        .eq("account_status", "active")
    : { data: [], error: null };
  if (error) throw new Error(`Recipients could not be loaded: ${error.message}`);

  const recipients: EligibleMessagingRecipient[] = (data || [])
    .map((profile) => {
      const metadata = eligible.get(profile.id);
      if (!metadata) return null;
      return {
        id: profile.id,
        displayName: displayName(profile.first_name, profile.last_name),
        relationship: metadata.relationship,
        circleIds: Array.from(metadata.circleIds),
      };
    })
    .filter((item): item is EligibleMessagingRecipient => Boolean(item))
    .sort((first, second) => first.displayName.localeCompare(second.displayName));

  const circleIds = Array.from(
    new Set([...context.memberCircleIds, ...context.coachedCircleIds])
  );
  const { data: circles, error: circleError } = circleIds.length
    ? await supabase
        .from("circles")
        .select("id,name")
        .in("id", circleIds)
        .eq("status", "active")
    : { data: [], error: null };
  if (circleError) throw new Error(`Messaging Circles could not be loaded: ${circleError.message}`);

  return {
    ok: true as const,
    recipients,
    circles: circles || [],
    permissions: permissions(context),
    regularMemberOnly: !context.isAdmin && !context.isCoach && context.memberCircleIds.size === 0,
  };
}

export async function createConversation(
  context: MessagingContext,
  payload: CreateConversationPayload
): Promise<{ ok: true; conversation: ConversationDetail }> {
  const body = cleanMessageBody(payload.initialMessage);
  if (!body) throw actionError(400, "Message body is required.");
  const requestId = cleanCreationKey(payload.requestId);
  if (!["direct", "group", "circle", "admin_support"].includes(payload.conversationType)) {
    throw actionError(400, "Choose a valid conversation type.");
  }
  const regularMember =
    !context.isAdmin && !context.isCoach && context.memberCircleIds.size === 0;
  if (regularMember && payload.conversationType !== "admin_support") {
    throw actionError(403, "Contact PeaceWorks is the only available conversation.");
  }

  if (payload.conversationType === "admin_support") {
    const title = cleanRequiredTitle(payload.title);
    const id = await createSupportConversation(context, title, requestId);
    await addMessage(context, id, body, requestId);
    return { ok: true, conversation: await requireConversationDetail(context, id) };
  }

  if (payload.conversationType === "circle") {
    const circleId = payload.circleId || "";
    if (
      !context.isAdmin &&
      !context.memberCircleIds.has(circleId) &&
      !context.coachedCircleIds.has(circleId)
    ) {
      throw actionError(403, "This Circle is not available.");
    }
    const id = await getOrCreateCircleConversation(context, circleId);
    await addMessage(context, id, body, requestId);
    return { ok: true, conversation: await requireConversationDetail(context, id) };
  }

  if (payload.conversationType === "group" && payload.circleDiscussion) {
    const circleId = payload.circleId || "";
    if (
      !context.isAdmin &&
      !context.memberCircleIds.has(circleId) &&
      !context.coachedCircleIds.has(circleId)
    ) {
      throw actionError(403, "This Circle is not available.");
    }
    const title = cleanRequiredTitle(payload.title);
    const id = await createConversationRow(
      context,
      {
        conversation_type: "group",
        title,
        circle_id: circleId,
        created_by: context.profileId,
      },
      requestId
    );
    await syncCircleParticipants(id, circleId, context.profileId);
    await addMessage(context, id, body, requestId);
    return { ok: true, conversation: await requireConversationDetail(context, id) };
  }

  const recipientIds = Array.from(
    new Set((payload.recipientIds || []).filter((id) => id && id !== context.profileId))
  );
  if (recipientIds.length === 0) throw actionError(400, "Choose at least one recipient.");
  if (payload.conversationType === "direct" && recipientIds.length !== 1) {
    throw actionError(400, "Direct conversations require one recipient.");
  }
  const eligible = await eligibleRecipientMap(context);
  if (!context.isAdmin && recipientIds.some((id) => !eligible.has(id))) {
    throw actionError(403, "One or more recipients are not available.");
  }
  await requireActiveProfiles(recipientIds);

  const title = cleanRequiredTitle(payload.title);
  const id = await createConversationRow(
    context,
    {
      conversation_type: payload.conversationType,
      title,
      created_by: context.profileId,
    },
    requestId
  );
  await insertParticipants(id, [context.profileId, ...recipientIds], context.profileId);
  await addMessage(context, id, body, requestId);
  return { ok: true, conversation: await requireConversationDetail(context, id) };
}

export async function getConversationDetail(
  context: MessagingContext,
  conversationId: string
) {
  return { ok: true as const, conversation: await requireConversationDetail(context, conversationId) };
}

export async function sendMessage(
  context: MessagingContext,
  conversationId: string,
  payload: SendMessagePayload
) {
  const body = cleanMessageBody(payload.body);
  if (!body) throw actionError(400, "Message body is required.");
  await addMessage(context, conversationId, body);
  return { ok: true as const, conversation: await requireConversationDetail(context, conversationId) };
}

export async function markConversationRead(context: MessagingContext, conversationId: string) {
  await requireActiveParticipant(context, conversationId);
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("profile_id", context.profileId);
  if (error) throw new Error(`Conversation could not be marked read: ${error.message}`);
  return { ok: true as const };
}

export async function setConversationArchived(
  context: MessagingContext,
  conversationId: string,
  archived: boolean
) {
  await requireActiveParticipant(context, conversationId);
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("conversation_participants")
    .update({
      archived_at: archived ? new Date().toISOString() : null,
      ...(archived ? {} : { deleted_at: null }),
    })
    .eq("conversation_id", conversationId)
    .eq("profile_id", context.profileId);
  if (error) throw new Error(`Conversation archive could not be updated: ${error.message}`);
  return { ok: true as const };
}

export async function deleteConversationForMe(
  context: MessagingContext,
  conversationId: string,
  confirmed: boolean
) {
  if (!confirmed) throw actionError(400, "Removal confirmation is required.");
  await requireActiveParticipant(context, conversationId);
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("conversation_participants")
    .update({ deleted_at: new Date().toISOString(), archived_at: null })
    .eq("conversation_id", conversationId)
    .eq("profile_id", context.profileId);
  if (error) throw new Error(`Conversation could not be removed: ${error.message}`);
  return { ok: true as const };
}

export async function deliverCommunicationToPortal(
  communicationId: string,
  adminProfileId: string
): Promise<CommunicationPortalDeliveryResult | null> {
  const supabase = createAdminSupabaseClient();
  const [{ data: communication, error }, { data: channels, error: channelError }] =
    await Promise.all([
      supabase
        .from("communications")
        .select(
          "id,title,subject,summary,body_content,audience_scope,author_name,visible_author_name,status,visible_from,visible_until"
        )
        .eq("id", communicationId)
        .single(),
      supabase
        .from("communication_channels")
        .select("channel")
        .eq("communication_id", communicationId),
    ]);
  if (error || channelError) {
    throw new Error(error?.message || channelError?.message || "Communication could not be delivered.");
  }
  if (!(channels || []).some((row) => row.channel === "my_dashboard")) return null;
  if (communication.status !== "published") return null;

  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("source_communication_id", communicationId)
    .maybeSingle();
  if (existingError) throw new Error(`Portal delivery lookup failed: ${existingError.message}`);
  if (existing) {
    await markSiteChannelActive(communicationId);
    return { conversationId: existing.id, created: false };
  }

  const participantIds = await resolveCommunicationAudienceProfileIds(communicationId, communication.audience_scope);
  const activeIds = Array.from(new Set([adminProfileId, ...participantIds]));
  const contentBody = cleanMessageBody(
    communication.body_content || communication.summary || communication.subject || communication.title
  );
  const authorName = cleanTitle(communication.author_name || communication.visible_author_name || "");
  const body = authorName ? `By ${authorName}\n\n${contentBody}` : contentBody;
  if (!body) throw new Error("A site message requires message content.");

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      conversation_type: "announcement",
      title: cleanTitle(communication.title),
      created_by: adminProfileId,
      source_communication_id: communicationId,
      is_announcement: true,
      replies_enabled: false,
      visible_from: communication.visible_from,
      visible_until: communication.visible_until,
    })
    .select("id")
    .single();
  if (conversationError) {
    if (conversationError.code === "23505") {
      const { data } = await supabase
        .from("conversations")
        .select("id")
        .eq("source_communication_id", communicationId)
        .single();
      if (!data) throw new Error("Portal delivery conflict could not be resolved.");
      await markSiteChannelActive(communicationId);
      return { conversationId: data.id, created: false };
    }
    throw new Error(`Portal conversation could not be created: ${conversationError.message}`);
  }
  await insertParticipants(conversation.id, activeIds, adminProfileId);
  const context = await loadMessagingContextFromProfile(adminProfileId, true);
  await addMessage(context, conversation.id, body);
  await markSiteChannelActive(communicationId);
  return { conversationId: conversation.id, created: true };
}

export function messagingActionResponse(error: unknown) {
  const status =
    error && typeof error === "object" && "status" in error
      ? Number((error as { status: number }).status)
      : 500;
  return Response.json(
    {
      ok: false,
      message: error instanceof Error ? error.message : "Messaging request failed.",
    },
    { status: [400, 403, 404, 409].includes(status) ? status : 500 }
  );
}

async function loadMessagingContext(
  auth: Extract<MemberAuthResult, { ok: true }>
): Promise<MessagingContext> {
  return loadMessagingContextFromProfile(auth.user.id, isAdminEmail(auth.email), auth);
}

async function loadMessagingContextFromProfile(
  profileId: string,
  adminOverride = false,
  auth?: Extract<MemberAuthResult, { ok: true }>
): Promise<MessagingContext> {
  const supabase = createAdminSupabaseClient();
  const [roles, memberships, coached, directMembers, directCoaches] = await Promise.all([
    loadRoleNames(profileId),
    supabase
      .from("circle_memberships")
      .select("circle_id,circle:circles!inner(status)")
      .eq("profile_id", profileId)
      .eq("status", "active")
      .eq("circle.status", "active")
      .is("ended_at", null),
    supabase
      .from("circle_coaches")
      .select("circle_id,circle:circles!inner(status)")
      .eq("coach_id", profileId)
      .eq("status", "active")
      .eq("circle.status", "active")
      .is("ended_at", null),
    supabase
      .from("coach_assignments")
      .select("member_id")
      .eq("coach_id", profileId)
      .eq("status", "active")
      .is("ended_at", null),
    supabase
      .from("coach_assignments")
      .select("coach_id")
      .eq("member_id", profileId)
      .eq("status", "active")
      .is("ended_at", null),
  ]);
  const error =
    memberships.error || coached.error || directMembers.error || directCoaches.error;
  if (error) throw new Error(error.message);
  return {
    auth: auth || ({ ok: true, user: { id: profileId }, email: "" } as never),
    profileId,
    isAdmin: adminOverride || roles.includes("admin"),
    isCoach: roles.includes("coach"),
    memberCircleIds: new Set((memberships.data || []).map((row) => row.circle_id)),
    coachedCircleIds: new Set((coached.data || []).map((row) => row.circle_id)),
    directMemberIds: new Set((directMembers.data || []).map((row) => row.member_id)),
    directCoachIds: new Set((directCoaches.data || []).map((row) => row.coach_id)),
  };
}

async function eligibleRecipientMap(context: MessagingContext) {
  const supabase = createAdminSupabaseClient();
  const result = new Map<
    string,
    { relationship: EligibleMessagingRecipient["relationship"]; circleIds: Set<string> }
  >();
  if (context.isAdmin) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("account_status", "active")
      .neq("id", context.profileId);
    if (error) throw new Error(error.message);
    (data || []).forEach((row) =>
      result.set(row.id, { relationship: "circle_member", circleIds: new Set() })
    );
    return result;
  }

  const circleIds = Array.from(
    new Set([...context.memberCircleIds, ...context.coachedCircleIds])
  );
  const [memberships, coaches, admins] = await Promise.all([
    circleIds.length
      ? supabase
          .from("circle_memberships")
          .select("circle_id,profile_id")
          .in("circle_id", circleIds)
          .eq("status", "active")
          .is("ended_at", null)
      : Promise.resolve({ data: [], error: null }),
    circleIds.length
      ? supabase
          .from("circle_coaches")
          .select("circle_id,coach_id")
          .in("circle_id", circleIds)
          .eq("status", "active")
          .is("ended_at", null)
      : Promise.resolve({ data: [], error: null }),
    loadAdminProfileIds(),
  ]);
  if (memberships.error || coaches.error) {
    throw new Error(memberships.error?.message || coaches.error?.message);
  }
  (memberships.data || []).forEach((row) =>
    addEligible(result, row.profile_id, "circle_member", row.circle_id, context.profileId)
  );
  (coaches.data || []).forEach((row) =>
    addEligible(result, row.coach_id, "circle_coach", row.circle_id, context.profileId)
  );
  context.directMemberIds.forEach((id) =>
    addEligible(result, id, "direct_member", null, context.profileId)
  );
  context.directCoachIds.forEach((id) =>
    addEligible(result, id, "direct_coach", null, context.profileId)
  );
  admins.forEach((id) => addEligible(result, id, "admin", null, context.profileId));
  return result;
}

function addEligible(
  map: Awaited<ReturnType<typeof eligibleRecipientMap>>,
  id: string,
  relationship: EligibleMessagingRecipient["relationship"],
  circleId: string | null,
  currentId: string
) {
  if (id === currentId) return;
  const current = map.get(id) || { relationship, circleIds: new Set<string>() };
  if (circleId) current.circleIds.add(circleId);
  map.set(id, current);
}

async function requireConversationDetail(context: MessagingContext, conversationId: string) {
  const participant = await requireActiveParticipant(context, conversationId);
  const supabase = createAdminSupabaseClient();
  const [{ data: conversation, error }, presentation] = await Promise.all([
    supabase.from("conversations").select(conversationSelect).eq("id", conversationId).single(),
    loadConversationPresentation([conversationId]),
  ]);
  if (error) throw actionError(404, "Conversation not found.");
  if (!isConversationCurrentlyVisible(conversation, new Date().toISOString())) {
    throw actionError(404, "Conversation not found.");
  }
  const detail = presentation.get(conversationId);
  const { data: messageRows, error: messageError } = await supabase
    .from("messages")
    .select("id,body,created_at,sender_profile_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (messageError) throw new Error(`Messages could not be loaded: ${messageError.message}`);
  const authorIds = Array.from(
    new Set((messageRows || []).map((row) => row.sender_profile_id).filter(Boolean))
  ) as string[];
  const names = await profileNameMap(authorIds);
  return {
    ...mapSummary(conversation, detail, participant.last_read_at, Boolean(participant.archived_at)),
    participants: detail?.participants || [],
    messages: (messageRows || []).map((row) => ({
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      sender: row.sender_profile_id
        ? { id: row.sender_profile_id, displayName: names.get(row.sender_profile_id) || "PeaceWorks" }
        : null,
    })),
  } satisfies ConversationDetail;
}

async function requireActiveParticipant(context: MessagingContext, conversationId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id,last_read_at,archived_at,deleted_at,left_at")
    .eq("conversation_id", conversationId)
    .eq("profile_id", context.profileId)
    .is("left_at", null)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(`Conversation access failed: ${error.message}`);
  if (!data) throw actionError(404, "Conversation not found.");
  return data;
}

async function addMessage(
  context: MessagingContext,
  conversationId: string,
  body: string,
  creationKey?: string
) {
  await requireActiveParticipant(context, conversationId);
  const supabase = createAdminSupabaseClient();
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("replies_enabled,created_by")
    .eq("id", conversationId)
    .single();
  if (conversationError) throw actionError(404, "Conversation not found.");
  if (!conversation.replies_enabled && conversation.created_by !== context.profileId && !context.isAdmin) {
    throw actionError(403, "Replies are disabled for this conversation.");
  }
  const now = new Date().toISOString();
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_profile_id: context.profileId,
    creation_key: creationKey || null,
    body,
  });
  if (error && error.code !== "23505") {
    throw new Error(`Message could not be sent: ${error.message}`);
  }
  const { error: restoreError } = await supabase
    .from("conversation_participants")
    .update({ archived_at: null, deleted_at: null })
    .eq("conversation_id", conversationId)
    .is("left_at", null)
    .neq("profile_id", context.profileId);
  if (restoreError) throw new Error(`Recipient inbox could not be restored: ${restoreError.message}`);
  await Promise.all([
    supabase.from("conversations").update({ updated_at: now }).eq("id", conversationId),
    supabase
      .from("conversation_participants")
      .update({ last_read_at: now, archived_at: null, deleted_at: null })
      .eq("conversation_id", conversationId)
      .eq("profile_id", context.profileId),
  ]);
}

async function getOrCreateCircleConversation(context: MessagingContext, circleId: string) {
  const supabase = createAdminSupabaseClient();
  const { data: circle, error: circleError } = await supabase
    .from("circles")
    .select("id,name")
    .eq("id", circleId)
    .eq("status", "active")
    .maybeSingle();
  if (circleError || !circle) throw actionError(404, "Circle not found.");
  const lookup = await supabase
    .from("conversations")
    .select("id")
    .eq("conversation_type", "circle")
    .eq("circle_id", circleId)
    .eq("status", "active")
    .maybeSingle();
  let conversation = lookup.data;
  if (lookup.error) throw new Error(lookup.error.message);
  if (!conversation) {
    const created = await supabase
      .from("conversations")
      .insert({
        conversation_type: "circle",
        title: circle.name,
        circle_id: circleId,
        created_by: context.profileId,
      })
      .select("id")
      .single();
    if (created.error && created.error.code !== "23505") throw new Error(created.error.message);
    conversation =
      created.data ||
      (
        await supabase
          .from("conversations")
          .select("id")
          .eq("conversation_type", "circle")
          .eq("circle_id", circleId)
          .eq("status", "active")
          .single()
      ).data;
  }
  if (!conversation) throw new Error("Circle conversation could not be resolved.");
  await syncCircleParticipants(conversation.id, circleId, context.profileId);
  return conversation.id;
}

async function syncCircleParticipants(conversationId: string, circleId: string, ownerId: string) {
  const supabase = createAdminSupabaseClient();
  const [members, coaches] = await Promise.all([
    supabase
      .from("circle_memberships")
      .select("profile_id")
      .eq("circle_id", circleId)
      .eq("status", "active")
      .is("ended_at", null),
    supabase
      .from("circle_coaches")
      .select("coach_id")
      .eq("circle_id", circleId)
      .eq("status", "active")
      .is("ended_at", null),
  ]);
  if (members.error || coaches.error) throw new Error(members.error?.message || coaches.error?.message);
  const activeIds = Array.from(
    new Set([...(members.data || []).map((row) => row.profile_id), ...(coaches.data || []).map((row) => row.coach_id)])
  );
  await insertParticipants(conversationId, activeIds, ownerId);
  const { error } = await supabase
    .from("conversation_participants")
    .update({ left_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .is("left_at", null)
    .not("profile_id", "in", `(${activeIds.join(",")})`);
  if (error && activeIds.length) throw new Error(error.message);
}

async function createSupportConversation(
  context: MessagingContext,
  title: string,
  requestId: string
) {
  const id = await createConversationRow(
    context,
    {
      conversation_type: "admin_support",
      title,
      support_profile_id: context.profileId,
      created_by: context.profileId,
    },
    requestId
  );
  const admins = await loadAdminProfileIds();
  await insertParticipants(id, [context.profileId, ...admins], context.profileId);
  return id;
}

async function createConversationRow(
  context: MessagingContext,
  values: Record<string, unknown>,
  requestId: string
) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({ ...values, creation_key: requestId })
    .select("id")
    .single();
  if (!error && data) return data.id;
  if (error?.code !== "23505") {
    throw new Error(`Conversation could not be created: ${error?.message || "Unknown error"}`);
  }
  const { data: existing, error: lookupError } = await supabase
    .from("conversations")
    .select("id")
    .eq("created_by", context.profileId)
    .eq("creation_key", requestId)
    .single();
  if (lookupError || !existing) {
    throw new Error("Conversation retry could not be resolved.");
  }
  return existing.id;
}

async function insertParticipants(conversationId: string, profileIds: string[], ownerId: string) {
  const supabase = createAdminSupabaseClient();
  const uniqueIds = Array.from(new Set(profileIds));
  if (!uniqueIds.length) throw new Error("Conversation requires participants.");
  const { error } = await supabase.from("conversation_participants").upsert(
    uniqueIds.map((profileId) => ({
      conversation_id: conversationId,
      profile_id: profileId,
      participant_role: profileId === ownerId ? "owner" : "member",
      left_at: null,
    })),
    { onConflict: "conversation_id,profile_id" }
  );
  if (error) throw new Error(`Conversation participants could not be saved: ${error.message}`);
}

export async function resolveCommunicationAudienceProfileIds(
  communicationId: string,
  audienceScope: string
) {
  const supabase = createAdminSupabaseClient();
  const { data: targets, error } = await supabase
    .from("communication_audience_targets")
    .select("audience_type,circle_id,profile_id")
    .eq("communication_id", communicationId);
  if (error) throw new Error(error.message);
  const targetRows = targets || [];
  if (audienceScope === "all_members") return activeProfileIds();
  if (audienceScope === "all_circle_members") return activeCircleRelationshipProfileIds(false);
  if (audienceScope === "all_coaches") return activeRoleProfileIds("coach");
  if (audienceScope === "admins") return loadAdminProfileIds();
  const profileIds = targetRows.map((row) => row.profile_id).filter(Boolean) as string[];
  const circleIds = targetRows.map((row) => row.circle_id).filter(Boolean) as string[];
  if (profileIds.length) {
    await requireActiveProfiles(profileIds);
    return profileIds;
  }
  if (circleIds.length) return activeCircleProfileIds(circleIds);
  return [];
}

async function markSiteChannelActive(communicationId: string) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("communication_channels")
    .update({ channel_status: "active", updated_at: new Date().toISOString() })
    .eq("communication_id", communicationId)
    .eq("channel", "my_dashboard");
  if (error) throw new Error(`Site-message channel status could not be updated: ${error.message}`);
}

async function activeProfileIds() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("id").eq("account_status", "active");
  if (error) throw new Error(error.message);
  return (data || []).map((row) => row.id);
}

async function activeCircleRelationshipProfileIds(includeCoaches: boolean) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("circle_memberships")
    .select("profile_id,circle:circles!inner(status)")
    .eq("status", "active")
    .eq("circle.status", "active")
    .is("ended_at", null);
  if (error) throw new Error(error.message);
  if (!includeCoaches) return Array.from(new Set((data || []).map((row) => row.profile_id)));
  return activeProfileIds();
}

async function activeCircleProfileIds(circleIds: string[]) {
  const supabase = createAdminSupabaseClient();
  const { data: activeCircles, error: activeCircleError } = await supabase
    .from("circles")
    .select("id")
    .in("id", circleIds)
    .eq("status", "active");
  if (activeCircleError) throw new Error(activeCircleError.message);
  const activeCircleIds = (activeCircles || []).map((row) => row.id);
  if (!activeCircleIds.length) return [];
  const [members, coaches] = await Promise.all([
    supabase
      .from("circle_memberships")
      .select("profile_id")
      .in("circle_id", activeCircleIds)
      .eq("status", "active")
      .is("ended_at", null),
    supabase
      .from("circle_coaches")
      .select("coach_id")
      .in("circle_id", activeCircleIds)
      .eq("status", "active")
      .is("ended_at", null),
  ]);
  if (members.error || coaches.error) throw new Error(members.error?.message || coaches.error?.message);
  return Array.from(
    new Set([...(members.data || []).map((row) => row.profile_id), ...(coaches.data || []).map((row) => row.coach_id)])
  );
}

async function requireActiveProfiles(ids: string[]) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .in("id", ids)
    .eq("account_status", "active");
  if (error) throw new Error(error.message);
  if ((data || []).length !== new Set(ids).size) throw actionError(403, "One or more recipients are inactive.");
}

async function activeRoleProfileIds(roleName: string) {
  const supabase = createAdminSupabaseClient();
  const { data: role, error } = await supabase.from("roles").select("id").eq("name", roleName).maybeSingle();
  if (error || !role) return [];
  const { data, error: assignmentError } = await supabase
    .from("profile_roles")
    .select("profile_id,profile:profiles!inner(id,account_status)")
    .eq("role_id", role.id)
    .eq("profile.account_status", "active");
  if (assignmentError) throw new Error(assignmentError.message);
  return (data || []).map((row) => row.profile_id);
}

async function loadAdminProfileIds() {
  return activeRoleProfileIds("admin");
}

async function loadRoleNames(profileId: string) {
  const supabase = createAdminSupabaseClient();
  const { data: assignments, error } = await supabase
    .from("profile_roles")
    .select("role_id")
    .eq("profile_id", profileId);
  if (error) throw new Error(error.message);
  const ids = (assignments || []).map((row) => row.role_id);
  if (!ids.length) return [];
  const { data, error: rolesError } = await supabase.from("roles").select("name").in("id", ids);
  if (rolesError) throw new Error(rolesError.message);
  return (data || []).map((row) => row.name);
}

async function loadConversationPresentation(conversationIds: string[]) {
  const result = new Map<
    string,
    { participants: ConversationParticipant[]; circleName: string; latest: Message | null }
  >();
  if (!conversationIds.length) return result;
  const supabase = createAdminSupabaseClient();
  const [participants, messages, conversations] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("conversation_id,profile_id,participant_role")
      .in("conversation_id", conversationIds)
      .is("left_at", null),
    supabase
      .from("messages")
      .select("id,conversation_id,sender_profile_id,body,created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
    supabase.from("conversations").select("id,circle_id").in("id", conversationIds),
  ]);
  if (participants.error || messages.error || conversations.error) {
    throw new Error(participants.error?.message || messages.error?.message || conversations.error?.message);
  }
  const profileIds = Array.from(new Set((participants.data || []).map((row) => row.profile_id)));
  const names = await profileNameMap(profileIds);
  const circleIds = Array.from(
    new Set((conversations.data || []).map((row) => row.circle_id).filter(Boolean))
  ) as string[];
  const { data: circles, error: circleError } = circleIds.length
    ? await supabase.from("circles").select("id,name").in("id", circleIds)
    : { data: [], error: null };
  if (circleError) throw new Error(circleError.message);
  const circleNames = new Map((circles || []).map((row) => [row.id, row.name || ""]));
  conversationIds.forEach((id) => {
    const conversation = (conversations.data || []).find((row) => row.id === id);
    const participantRows = (participants.data || []).filter((row) => row.conversation_id === id);
    const latestRow = (messages.data || []).find((row) => row.conversation_id === id);
    result.set(id, {
      participants: participantRows.map((row) => ({
        profileId: row.profile_id,
        displayName: names.get(row.profile_id) || "PeaceWorks Member",
        participantRole: row.participant_role as ConversationParticipant["participantRole"],
      })),
      circleName: conversation?.circle_id ? circleNames.get(conversation.circle_id) || "" : "",
      latest: latestRow
        ? {
            id: latestRow.id,
            body: latestRow.body,
            createdAt: latestRow.created_at,
            sender: latestRow.sender_profile_id
              ? {
                  id: latestRow.sender_profile_id,
                  displayName: names.get(latestRow.sender_profile_id) || "PeaceWorks",
                }
              : null,
          }
        : null,
    });
  });
  return result;
}

async function profileNameMap(ids: string[]) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = ids.length
    ? await supabase.from("profiles").select("id,first_name,last_name").in("id", ids)
    : { data: [], error: null };
  if (error) throw new Error(error.message);
  return new Map((data || []).map((row) => [row.id, displayName(row.first_name, row.last_name)]));
}

function mapSummary(
  conversation: Record<string, unknown>,
  presentation:
    | { participants: ConversationParticipant[]; circleName: string; latest: Message | null }
    | undefined,
  lastReadAt: string | null,
  archived: boolean
): ConversationSummary {
  const latest = presentation?.latest || null;
  const type = conversation.conversation_type as ConversationType;
  const participantNames = (presentation?.participants || []).map((item) => item.displayName);
  return {
    id: String(conversation.id),
    conversationType: type,
    title:
      String(conversation.title || "") ||
      (type === "admin_support"
        ? "Contact PeaceWorks"
        : participantNames.slice(0, 3).join(", ") || "Conversation"),
    circle: conversation.circle_id
      ? { id: String(conversation.circle_id), name: presentation?.circleName || "Circle" }
      : null,
    participantSummary: participantNames.slice(0, 4).join(", "),
    latestMessagePreview: latest ? preview(latest.body) : "No messages yet.",
    latestMessageAt: latest?.createdAt || null,
    unread: Boolean(latest && (!lastReadAt || latest.createdAt > lastReadAt)),
    archived,
    repliesEnabled: Boolean(conversation.replies_enabled),
  };
}

function permissions(context: MessagingContext): MessagingPermissions {
  return {
    isAdmin: context.isAdmin,
    isCoach: context.isCoach,
    isCircleMember: context.memberCircleIds.size > 0,
    canCreateGroups:
      context.isAdmin || context.isCoach || context.memberCircleIds.size > 0,
    canContactSupport: true,
  };
}

function relation(value: unknown): Record<string, unknown> {
  return (Array.isArray(value) ? value[0] : value || {}) as Record<string, unknown>;
}

function compareSummaries(first: ConversationSummary, second: ConversationSummary) {
  return (
    Number(second.unread) - Number(first.unread) ||
    String(second.latestMessageAt || "").localeCompare(String(first.latestMessageAt || "")) ||
    first.title.localeCompare(second.title) ||
    first.id.localeCompare(second.id)
  );
}

function isConversationCurrentlyVisible(
  conversation: Record<string, unknown>,
  now: string
) {
  const visibleFrom =
    typeof conversation.visible_from === "string" ? conversation.visible_from : null;
  const visibleUntil =
    typeof conversation.visible_until === "string" ? conversation.visible_until : null;
  if (visibleFrom && visibleFrom > now) return false;
  if (visibleUntil && visibleUntil < now) return false;
  return true;
}

function cleanMessageBody(value: unknown) {
  const body = typeof value === "string" ? value.trim() : "";
  if (body.length > maxMessageLength) throw actionError(400, "Messages may be up to 10,000 characters.");
  return body;
}

function cleanTitle(value: unknown) {
  const title = typeof value === "string" ? value.trim() : "";
  if (title.length > 150) throw actionError(400, "Topics may be up to 150 characters.");
  return title;
}

function cleanRequiredTitle(value: unknown) {
  const title = cleanTitle(value);
  if (!title) throw actionError(400, "A topic is required.");
  return title;
}

function cleanCreationKey(value: unknown) {
  const key = typeof value === "string" ? value.trim() : "";
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(key)) {
    throw actionError(400, "A valid message request identifier is required.");
  }
  return key;
}

function preview(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim();
  return normalized.length > 140 ? `${normalized.slice(0, 137)}...` : normalized;
}

function displayName(firstName: string | null, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "PeaceWorks Member";
}

function actionError(status: 400 | 403 | 404 | 409, message: string) {
  return Object.assign(new Error(message), { status });
}
