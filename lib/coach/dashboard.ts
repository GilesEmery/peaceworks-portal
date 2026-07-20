import { createClient, type User } from "@supabase/supabase-js";

import {
  buildAdminAnalytics,
  buildResultFromAssessmentRow,
  type AdminAssessmentRecord,
} from "../admin/assessmentAnalytics";
import {
  fetchAdminAssessmentById,
  fetchAdminAssessmentData,
} from "../admin/assessmentQueries";
import {
  createAdminSupabaseClient,
  isAdminEmail,
  type AdminAssessmentRow,
} from "../admin/authorization";
import {
  fetchAdminUsersData,
  type AdminManagedProfile,
  type AdminUsersPayload,
} from "../admin/userManagement";
import { fetchCoachMonthlyQuestionReflections } from "../member/monthlyQuestionReflections";
import type { CoachMonthlyQuestionReflection } from "../monthlyQuestionReflections";
import type { PeaceAssessmentResult } from "../peaceAssessmentScoring";

export type CoachAuthResult =
  | {
      ok: true;
      user: User;
      email: string;
      isAdmin: boolean;
      isCoach: boolean;
    }
  | {
      ok: false;
      status: 401 | 403 | 503;
      code: string;
      message: string;
    };

type CoachActionFailure = {
  ok: false;
  status: number;
  code: string;
  message: string;
  details?: string;
  hint?: string;
};

export type CoachPersonSummary = {
  id: string;
  name: string;
  email: string;
};

export type CoachCircleSummary = {
  id: string;
  name: string;
  description: string;
  status: string;
  memberCount: number;
  coaches: CoachPersonSummary[];
  assessedCount: number;
  growthStatusCount: number;
};

export type CoachMemberSearchItem = {
  id: string;
  name: string;
  email: string;
  circleIds: string[];
  circleNames: string[];
};

export type CoachOverviewPayload = {
  ok: true;
  currentCoach: CoachPersonSummary;
  isAdmin: boolean;
  metrics: {
    circlesCoached: number;
    uniqueActiveMembers: number;
    membersWithCompletedAssessments: number;
    membersWithGrowthStatus: number;
    upcomingFollowUps: number;
    followUpsOverdue: number;
    followUpsDueSoon: number;
    followUpsScheduledLater: number;
    membersWithoutFollowUp: number;
  };
  ratios: {
    assessmentCompletion: CoachRatio;
    growthDocumentation: CoachRatio;
    followUpScheduling: CoachRatio;
  };
  circles: CoachCircleSummary[];
  memberSearchIndex: CoachMemberSearchItem[];
};

export type CoachRatio = {
  numerator: number;
  denominator: number;
};

export type CoachCirclePayload = {
  ok: true;
  circle: CoachCircleSummary;
  members: CoachCircleMemberCard[];
  notes: CoachCircleNote[];
  workspace: {
    assessments: CoachRatio;
    progress: CoachRatio;
    notesMessage: string;
    monthlyQuestionsMessage: string;
    resourcesMessage: string;
  };
};

export type CoachCircleMemberCard = {
  id: string;
  name: string;
  initials: string;
  email: string;
  latestAssessment: AdminAssessmentRecord | null;
  assessmentStatus: string;
  processStage: string;
  nextStep: string;
  nextFollowUpAt: string | null;
  followUpStatus: CoachFollowUpStatus;
  followUpDisplayStatus: CoachFollowUpDisplayStatus;
  assignedCoaches: CoachPersonSummary[];
};

export type CoachFollowUpDisplayStatus =
  | "overdue"
  | "due_soon"
  | "scheduled"
  | "completed"
  | "deferred"
  | "none";

export type CoachMemberPayload = {
  ok: true;
  profile: {
    id: string;
    name: string;
    initials: string;
    email: string;
    organization: string;
    jobTitle: string;
    timezone: string;
  };
  relevantCircles: CoachCircleSummary[];
  assignedCoaches: CoachPersonSummary[];
  assessments: AdminAssessmentRecord[];
  growthStatus: CoachGrowthStatus | null;
  notes: CoachProfileNote[];
  notesMessage: string;
  monthlyQuestionReflections: CoachMonthlyQuestionReflection[];
  activity: Array<{
    key: string;
    label: string;
    date: string | null;
    detail: string;
  }>;
};

export type CoachGrowthStatus = {
  processStage: string;
  engagementStatus: string;
  currentFocus: string;
  nextStep: string;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  followUpStatus: CoachFollowUpStatus;
  followUpCompletedAt: string | null;
  growthSummary: string;
  supportNeeds: string;
  updatedBy: string | null;
  updatedByName: string;
  updatedAt: string | null;
};

export type CoachFollowUpStatus =
  | "none"
  | "planned"
  | "due"
  | "completed"
  | "deferred";

export type CoachNoteAuthor = {
  id: string;
  name: string;
  email: string;
};

export type CoachCircleNote = {
  id: string;
  circleId: string;
  author: CoachNoteAuthor;
  noteType: CoachCircleNoteType;
  body: string;
  visibility: CoachCircleNoteVisibility;
  audienceType: CoachCircleNoteAudienceType;
  recipients: CoachPersonSummary[];
  links: CoachCircleNoteLink[];
  meetingDate: string | null;
  followUpAt: string | null;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  canEdit: boolean;
  canDelete: boolean;
};

export type CoachCircleNoteLink = {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
};

export type CoachProfileNote = {
  id: string;
  profileId: string;
  author: CoachNoteAuthor;
  noteType: CoachProfileNoteType;
  body: string;
  visibility: CoachProfileNoteVisibility;
  createdAt: string | null;
  updatedAt: string | null;
  canEdit: boolean;
  canDelete: boolean;
};

export type CoachCircleNoteType =
  | "general"
  | "meeting_recap"
  | "group_dynamics"
  | "facilitation"
  | "follow_up"
  | "care"
  | "prayer"
  | "administrative";

export type CoachProfileNoteType =
  | "general"
  | "coaching"
  | "growth"
  | "follow_up"
  | "care"
  | "assessment"
  | "prayer";

export type CoachCircleNoteVisibility = "coaches" | "admins";
export type CoachCircleNoteAudienceType =
  | "internal"
  | "all_circle_members"
  | "selected_members";
export type CoachProfileNoteVisibility =
  | "admins"
  | "assigned_coaches"
  | "circle_coaches";

export type CoachCircleNoteInput = {
  noteType: string;
  body: string;
  visibility: string;
  audienceType: string;
  recipientIds: string[];
  links?: Array<{
    id?: string;
    label?: string;
    url?: string;
    sortOrder?: number;
  }>;
  meetingDate: string;
  followUpAt: string;
};

export type CoachProfileNoteInput = {
  noteType: string;
  body: string;
  visibility: string;
};

export type CoachGrowthStatusInput = {
  processStage: string;
  engagementStatus: string;
  currentFocus: string;
  nextStep: string;
  lastContactAt: string;
  nextFollowUpAt: string;
  followUpStatus: string;
  followUpCompletedAt: string;
  growthSummary: string;
  supportNeeds: string;
};

type GrowthStatusRow = {
  profile_id: string;
  process_stage: string | null;
  engagement_status: string | null;
  current_focus: string | null;
  next_step: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  follow_up_status?: string | null;
  follow_up_completed_at?: string | null;
  growth_summary: string | null;
  support_needs: string | null;
  updated_by?: string | null;
  updated_at: string | null;
};

type CircleNoteRow = {
  id: string;
  circle_id: string;
  author_id: string | null;
  note_type: string | null;
  body: string | null;
  visibility: string | null;
  audience_type?: string | null;
  meeting_date: string | null;
  follow_up_at: string | null;
  published_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CircleNoteRecipientRow = {
  circle_note_id: string;
  profile_id: string;
};

type CircleNoteLinkRow = {
  id: string;
  circle_note_id: string;
  label: string | null;
  url: string;
  sort_order: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProfileNoteRow = {
  id: string;
  profile_id: string;
  author_id: string | null;
  note_type: string | null;
  body: string | null;
  visibility?: string | null;
  is_private?: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

const circleNoteTypes: CoachCircleNoteType[] = [
  "general",
  "meeting_recap",
  "group_dynamics",
  "facilitation",
  "follow_up",
  "care",
  "prayer",
  "administrative",
];

const profileNoteTypes: CoachProfileNoteType[] = [
  "general",
  "coaching",
  "growth",
  "follow_up",
  "care",
  "assessment",
  "prayer",
];

const processStageOptions = [
  "new",
  "assessment_completed",
  "onboarding",
  "active_circle",
  "active_coaching",
  "paused",
  "completed",
];

const engagementStatusOptions = [
  "unknown",
  "beginning",
  "engaged",
  "growing",
  "needs_attention",
  "paused",
  "completed",
];

const followUpStatusOptions: CoachFollowUpStatus[] = [
  "none",
  "planned",
  "due",
  "completed",
  "deferred",
];

const maxNoteLength = 10000;
const maxCircleNoteLinks = 10;
const maxCircleNoteLinkLabelLength = 140;
const maxCircleNoteLinkUrlLength = 2048;

type CoachContext = {
  auth: Extract<CoachAuthResult, { ok: true }>;
  usersPayload: AdminUsersPayload;
  records: AdminAssessmentRecord[];
  growthStatuses: Map<string, CoachGrowthStatus>;
  authorizedCircles: CoachCircleSummary[];
  authorizedCircleIds: Set<string>;
  circleCoachMemberIds: Set<string>;
  authorizedMemberIds: Set<string>;
};

export async function requireCoachFromRequest(
  request: Request
): Promise<CoachAuthResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return {
      ok: false,
      status: 503,
      code: "auth_not_configured",
      message: "Authentication is not configured.",
    };
  }

  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      code: "auth_required",
      message: "Authentication is required.",
    };
  }

  const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  const email = user?.email?.trim().toLowerCase();

  if (error || !user || !email) {
    return {
      ok: false,
      status: 401,
      code: "auth_required",
      message: "Authentication is required.",
    };
  }

  const profileStatus = await getCoachProfileStatus(user.id);

  if (!profileStatus.ok) return profileStatus;

  const isAdmin = isAdminEmail(email);
  const isCoach = await hasRole(user.id, "coach").catch((error) => {
    console.error("Coach authorization role lookup failed", error);
    return null;
  });

  if (isCoach === null) {
    return {
      ok: false,
      status: 503,
      code: "role_lookup_failed",
      message: "Coach authorization could not be verified.",
    };
  }

  if (!isAdmin && !isCoach) {
    return {
      ok: false,
      status: 403,
      code: "coach_access_required",
      message: "Coach access is required.",
    };
  }

  return {
    ok: true,
    user,
    email,
    isAdmin,
    isCoach,
  };
}

export function coachErrorResponse(auth: Exclude<CoachAuthResult, { ok: true }>) {
  return Response.json(
    {
      ok: false,
      error: auth.code,
      code: auth.code,
      message: auth.message,
    },
    { status: auth.status }
  );
}

export async function fetchCoachOverview(
  auth: Extract<CoachAuthResult, { ok: true }>
): Promise<CoachOverviewPayload> {
  const context = await loadCoachContext(auth);
  const memberIds = Array.from(context.authorizedMemberIds);
  const membersWithCompletedAssessments = memberIds.filter((memberId) =>
    context.records.some((record) => record.userId === memberId)
  ).length;
  const membersWithGrowthStatus = memberIds.filter((memberId) =>
    context.growthStatuses.has(memberId)
  ).length;
  const followUpBuckets = getFollowUpBuckets(memberIds, context.growthStatuses);

  return {
    ok: true,
    currentCoach: toPersonSummary(
      getUserById(auth.user.id, context.usersPayload),
      auth.email
    ),
    isAdmin: auth.isAdmin,
    metrics: {
      circlesCoached: context.authorizedCircles.length,
      uniqueActiveMembers: memberIds.length,
      membersWithCompletedAssessments,
      membersWithGrowthStatus,
      upcomingFollowUps:
        followUpBuckets.dueSoon.length + followUpBuckets.scheduledLater.length,
      followUpsOverdue: followUpBuckets.overdue.length,
      followUpsDueSoon: followUpBuckets.dueSoon.length,
      followUpsScheduledLater: followUpBuckets.scheduledLater.length,
      membersWithoutFollowUp: followUpBuckets.none.length,
    },
    ratios: {
      assessmentCompletion: {
        numerator: membersWithCompletedAssessments,
        denominator: memberIds.length,
      },
      growthDocumentation: {
        numerator: membersWithGrowthStatus,
        denominator: memberIds.length,
      },
      followUpScheduling: {
        numerator:
          followUpBuckets.dueSoon.length + followUpBuckets.scheduledLater.length,
        denominator: memberIds.length,
      },
    },
    circles: context.authorizedCircles,
    memberSearchIndex: buildMemberSearchIndex(context),
  };
}

export async function fetchCoachCircle(
  auth: Extract<CoachAuthResult, { ok: true }>,
  circleId: string
): Promise<CoachCirclePayload | null> {
  const context = await loadCoachContext(auth);

  if (!context.authorizedCircleIds.has(circleId)) return null;

  const sourceCircle = context.usersPayload.circles.find(
    (circle) => circle.id === circleId
  );
  const circle = context.authorizedCircles.find((item) => item.id === circleId);

  if (!sourceCircle || !circle) return null;

  const activeMembers = sourceCircle.memberIds
    .map((memberId) => getUserById(memberId, context.usersPayload))
    .filter(isActiveProfile)
    .sort((a, b) => formatUserName(a).localeCompare(formatUserName(b)));
  const members = activeMembers.map((member) =>
    buildCircleMemberCard(member, context)
  );
  const notes = await fetchCircleNotesForAuth(auth, circleId, context);
  const assessedCount = members.filter((member) => member.latestAssessment).length;
  const growthCount = members.filter((member) =>
    context.growthStatuses.has(member.id)
  ).length;

  return {
    ok: true,
    circle,
    members,
    notes,
    workspace: {
      assessments: {
        numerator: assessedCount,
        denominator: members.length,
      },
      progress: {
        numerator: growthCount,
        denominator: members.length,
      },
      notesMessage:
        notes.length === 0
          ? "No Circle notes have been added yet."
          : `${notes.length} Circle note${notes.length === 1 ? "" : "s"} recorded.`,
      monthlyQuestionsMessage:
        "Create and manage reflective questions for this Circle.",
      resourcesMessage:
        "Shared resources for this Circle will appear here.",
    },
  };
}

export async function fetchCoachMember(
  auth: Extract<CoachAuthResult, { ok: true }>,
  profileId: string
): Promise<CoachMemberPayload | null> {
  const context = await loadCoachContext(auth);

  if (!context.authorizedMemberIds.has(profileId)) return null;

  const profile = getUserById(profileId, context.usersPayload);

  if (!isActiveProfile(profile)) return null;

  const relevantCircles = context.authorizedCircles.filter((circle) => {
    const sourceCircle = context.usersPayload.circles.find(
      (item) => item.id === circle.id
    );

    return Boolean(sourceCircle?.memberIds.includes(profileId));
  });
  const assessments = getLatestAssessmentPerType(
    context.records.filter((record) => record.userId === profileId)
  );
  const growthStatus = context.growthStatuses.get(profileId) || null;
  const [notes, monthlyQuestionReflections] = await Promise.all([
    fetchProfileNotesForAuth(auth, profileId, context),
    fetchCoachMonthlyQuestionReflections({
      coachId: auth.user.id,
      profileId,
      isAdmin: auth.isAdmin,
    }),
  ]);

  return {
    ok: true,
    profile: {
      id: profile.id,
      name: formatUserName(profile),
      initials: getInitials(profile),
      email: profile.email,
      organization: profile.organization,
      jobTitle: profile.jobTitle,
      timezone: profile.timezone,
    },
    relevantCircles,
    assignedCoaches: profile.coachIds.map((coachId) =>
      toPersonSummary(getUserById(coachId, context.usersPayload))
    ),
    assessments,
    growthStatus,
    notes,
    notesMessage:
      notes.length === 0
        ? "No coach-visible notes have been added for this member."
        : "",
    monthlyQuestionReflections,
    activity: buildMemberActivity({ profile, assessments, growthStatus }),
  };
}

export async function fetchCoachAssessmentResult(
  auth: Extract<CoachAuthResult, { ok: true }>,
  assessmentId: string
): Promise<PeaceAssessmentResult | null> {
  const assessment = await fetchAdminAssessmentById(assessmentId);

  if (!assessment) return null;

  const context = await loadCoachContext(auth);

  if (!context.authorizedMemberIds.has(assessment.user_id)) return null;

  return buildResultFromAssessmentRow(assessment as AdminAssessmentRow);
}

export async function createCoachCircleNote(
  auth: Extract<CoachAuthResult, { ok: true }>,
  circleId: string,
  values: CoachCircleNoteInput
) {
  const context = await loadCoachContext(auth);

  if (!context.authorizedCircleIds.has(circleId)) return notFoundResult();

  const cleaned = cleanCircleNoteInput(values, auth, circleId, context);

  if (!cleaned.ok) return cleaned;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("circle_notes")
    .insert({
      circle_id: circleId,
      author_id: auth.user.id,
      note_type: cleaned.noteType,
      body: cleaned.body,
      visibility: cleaned.visibility,
      audience_type: cleaned.audienceType,
      published_at: new Date().toISOString(),
      meeting_date: cleaned.meetingDate || null,
      follow_up_at: cleaned.followUpAt || null,
    })
    .select(
      "id, circle_id, author_id, note_type, body, visibility, audience_type, meeting_date, follow_up_at, published_at, created_at, updated_at"
    )
    .single();

  if (error) {
    if (isCircleNotesSchemaError(error)) {
      logSupabaseError("Coach Circle notes migration is not applied", error);
      return schemaUnavailableResult(
        "Circle notes are not fully configured. Apply the Circle notes Supabase migrations.",
        error
      );
    }

    logSupabaseError("Coach Circle note create failed", error);
    return databaseFailureResult(
      "circle_note_insert_failed",
      "Circle note could not be saved.",
      error
    );
  }

  const recipientResult =
    cleaned.recipientIds.length > 0
      ? await syncCircleNoteRecipients(data.id, cleaned.recipientIds)
      : { ok: true as const };

  if (!recipientResult.ok) {
    await supabase.from("circle_notes").delete().eq("id", data.id);
    return recipientResult;
  }

  const linkResult = await syncCircleNoteLinks(data.id, cleaned.links, {
    skipWhenEmpty: true,
  });

  if (!linkResult.ok) {
    await supabase.from("circle_notes").delete().eq("id", data.id);
    return linkResult;
  }

  const recipients = cleaned.recipientIds
    .map((profileId) => toPersonSummary(getUserById(profileId, context.usersPayload)))
    .sort((first, second) => first.name.localeCompare(second.name));

  return {
    ok: true as const,
    message:
      cleaned.audienceType === "selected_members"
        ? "Circle note was added. This will appear on the selected members’ My Dashboards."
        : "Circle note was added. This will appear on the dashboards of active members in this Circle.",
    note: mapCircleNote(
      data as CircleNoteRow,
      auth,
      context.usersPayload,
      recipients,
      linkResult.links
    ),
  };
}

export async function updateCoachCircleNote(
  auth: Extract<CoachAuthResult, { ok: true }>,
  circleId: string,
  noteId: string,
  values: CoachCircleNoteInput
) {
  const context = await loadCoachContext(auth);

  if (!context.authorizedCircleIds.has(circleId)) return notFoundResult();

  const note = await fetchCircleNoteRow(noteId, circleId);

  if (!note || !canEditNote(auth, note.author_id)) return notFoundResult();

  const cleaned = cleanCircleNoteInput(values, auth, circleId, context);

  if (!cleaned.ok) return cleaned;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("circle_notes")
    .update({
      note_type: cleaned.noteType,
      body: cleaned.body,
      visibility: cleaned.visibility,
      audience_type: cleaned.audienceType,
      published_at: note.published_at || new Date().toISOString(),
      meeting_date: cleaned.meetingDate || null,
      follow_up_at: cleaned.followUpAt || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .eq("circle_id", circleId)
    .select(
      "id, circle_id, author_id, note_type, body, visibility, audience_type, meeting_date, follow_up_at, published_at, created_at, updated_at"
    )
    .single();

  if (error) {
    if (isCircleNotesSchemaError(error)) {
      logSupabaseError("Coach Circle notes migration is not applied", error);
      return schemaUnavailableResult(
        "Circle notes are not fully configured. Apply the Circle notes Supabase migrations.",
        error
      );
    }

    logSupabaseError("Coach Circle note update failed", error);
    return databaseFailureResult(
      "circle_note_update_failed",
      "Circle note could not be updated.",
      error
    );
  }

  const recipientResult = await syncCircleNoteRecipients(noteId, cleaned.recipientIds);

  if (!recipientResult.ok) return recipientResult;

  const linkResult = await syncCircleNoteLinks(noteId, cleaned.links);

  if (!linkResult.ok) return linkResult;

  const recipients = cleaned.recipientIds
    .map((profileId) => toPersonSummary(getUserById(profileId, context.usersPayload)))
    .sort((first, second) => first.name.localeCompare(second.name));

  return {
    ok: true as const,
    message:
      cleaned.audienceType === "selected_members"
        ? "Circle note was updated. This will appear on the selected members’ My Dashboards."
        : "Circle note was updated. This will appear on the dashboards of active members in this Circle.",
    note: mapCircleNote(
      data as CircleNoteRow,
      auth,
      context.usersPayload,
      recipients,
      linkResult.links
    ),
  };
}

export async function deleteCoachCircleNote(
  auth: Extract<CoachAuthResult, { ok: true }>,
  circleId: string,
  noteId: string
) {
  const context = await loadCoachContext(auth);

  if (!context.authorizedCircleIds.has(circleId)) return notFoundResult();

  const note = await fetchCircleNoteRow(noteId, circleId);

  if (!note || !canEditNote(auth, note.author_id)) return notFoundResult();

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("circle_notes")
    .delete()
    .eq("id", noteId)
    .eq("circle_id", circleId);

  if (error) {
    if (isMissingTableError(error, "circle_notes")) {
      logSupabaseError("Coach Circle notes migration is not applied", error);
      return schemaUnavailableResult(
        "Circle notes are not fully configured. Apply the Circle notes Supabase migrations.",
        error
      );
    }

    logSupabaseError("Coach Circle note delete failed", error);
    return databaseFailureResult("database_delete_failed", "Circle note could not be deleted.", error);
  }

  return {
    ok: true as const,
    message: "Circle note, member assignments, and shared links were deleted.",
  };
}

export async function createCoachProfileNote(
  auth: Extract<CoachAuthResult, { ok: true }>,
  profileId: string,
  values: CoachProfileNoteInput
) {
  const context = await loadCoachContext(auth);

  if (!context.authorizedMemberIds.has(profileId)) return notFoundResult();

  const cleaned = cleanProfileNoteInput(values, auth, profileId, context);

  if (!cleaned.ok) return cleaned;

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("profile_notes").insert({
    profile_id: profileId,
    author_id: auth.user.id,
    note_type: cleaned.noteType,
    body: cleaned.body,
    visibility: cleaned.visibility,
    is_private: cleaned.visibility === "admins",
  });

  if (error) {
    console.error("Coach member note create failed", error);
    throw new Error("Member note could not be saved.");
  }

  return { ok: true as const, message: "Member note was added." };
}

export async function updateCoachProfileNote(
  auth: Extract<CoachAuthResult, { ok: true }>,
  profileId: string,
  noteId: string,
  values: CoachProfileNoteInput
) {
  const context = await loadCoachContext(auth);

  if (!context.authorizedMemberIds.has(profileId)) return notFoundResult();

  const note = await fetchProfileNoteRow(noteId, profileId);

  if (!note || !canEditNote(auth, note.author_id)) return notFoundResult();

  const cleaned = cleanProfileNoteInput(values, auth, profileId, context);

  if (!cleaned.ok) return cleaned;

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("profile_notes")
    .update({
      note_type: cleaned.noteType,
      body: cleaned.body,
      visibility: cleaned.visibility,
      is_private: cleaned.visibility === "admins",
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Coach member note update failed", error);
    throw new Error("Member note could not be updated.");
  }

  return { ok: true as const, message: "Member note was updated." };
}

export async function deleteCoachProfileNote(
  auth: Extract<CoachAuthResult, { ok: true }>,
  profileId: string,
  noteId: string
) {
  const context = await loadCoachContext(auth);

  if (!context.authorizedMemberIds.has(profileId)) return notFoundResult();

  const note = await fetchProfileNoteRow(noteId, profileId);

  if (!note || !canEditNote(auth, note.author_id)) return notFoundResult();

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("profile_notes")
    .delete()
    .eq("id", noteId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Coach member note delete failed", error);
    throw new Error("Member note could not be deleted.");
  }

  return { ok: true as const, message: "Member note was deleted." };
}

export async function updateCoachGrowthStatus(
  auth: Extract<CoachAuthResult, { ok: true }>,
  profileId: string,
  values: CoachGrowthStatusInput
) {
  const context = await loadCoachContext(auth);

  if (!context.authorizedMemberIds.has(profileId)) return notFoundResult();

  const cleaned = cleanGrowthStatusInput(values);

  if (!cleaned.ok) return cleaned;

  const timestamp = new Date().toISOString();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("profile_growth_status").upsert(
    {
      profile_id: profileId,
      process_stage: cleaned.processStage,
      engagement_status: cleaned.engagementStatus,
      current_focus: cleaned.currentFocus,
      next_step: cleaned.nextStep,
      last_contact_at: cleaned.lastContactAt || null,
      next_follow_up_at: cleaned.nextFollowUpAt || null,
      follow_up_status: cleaned.followUpStatus,
      follow_up_completed_at: cleaned.followUpCompletedAt || null,
      growth_summary: cleaned.growthSummary,
      support_needs: cleaned.supportNeeds,
      updated_by: auth.user.id,
      updated_at: timestamp,
    },
    { onConflict: "profile_id" }
  );

  if (error) {
    console.error("Coach growth status update failed", error);
    throw new Error("Growth status could not be saved.");
  }

  return { ok: true as const, message: "Growth status was saved." };
}

async function loadCoachContext(
  auth: Extract<CoachAuthResult, { ok: true }>
): Promise<CoachContext> {
  const usersPayload = await fetchAdminUsersData(auth.user.id);
  const assessmentData = await fetchOptionalCoachAssessmentData();
  const analytics = buildAdminAnalytics(assessmentData);
  const activeCircles = usersPayload.circles.filter(
    (circle) => circle.status === "active"
  );
  const authorizedSourceCircles = auth.isAdmin
    ? activeCircles
    : activeCircles.filter((circle) => circle.coachIds.includes(auth.user.id));
  const authorizedCircleIds = new Set(
    authorizedSourceCircles.map((circle) => circle.id)
  );
  const activeProfileIds = new Set(
    usersPayload.users
      .filter((profile) => profile.accountStatus === "active")
      .map((profile) => profile.id)
  );
  const circleCoachMemberIds = new Set(
    authorizedSourceCircles
      .flatMap((circle) => circle.memberIds)
      .filter((profileId) => activeProfileIds.has(profileId))
  );
  const directMemberIds = auth.isAdmin
    ? usersPayload.users
        .filter((profile) => profile.accountStatus === "active")
        .map((profile) => profile.id)
    : usersPayload.users
        .filter(
          (profile) =>
            profile.accountStatus === "active" &&
            profile.id !== auth.user.id &&
            profile.coachIds.includes(auth.user.id)
        )
        .map((profile) => profile.id);
  const authorizedMemberIds = new Set(
    [...circleCoachMemberIds, ...directMemberIds]
  );
  const growthStatuses = await fetchGrowthStatuses(Array.from(authorizedMemberIds));
  const authorizedCircles = authorizedSourceCircles.map((circle) =>
    buildCircleSummary({
      circle,
      records: analytics.records,
      usersPayload,
      growthStatuses,
    })
  );

  return {
    auth,
    usersPayload,
    records: analytics.records,
    growthStatuses,
    authorizedCircles,
    authorizedCircleIds,
    circleCoachMemberIds,
    authorizedMemberIds,
  };
}

async function getCoachProfileStatus(userId: string): Promise<
  | { ok: true; accountStatus: "active" | "deactivated" | "archived" }
  | { ok: false; status: 503; code: string; message: string }
  | { ok: false; status: 403; code: string; message: string }
> {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const { data: profile, error } = await adminSupabase
      .from("profiles")
      .select("id, account_status")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      if (isMissingLifecycleColumnError(error)) {
        console.warn(
          "Coach authorization lifecycle columns are not available yet; requiring profile existence only."
        );

        return getCoachProfileExistenceStatus(userId);
      }

      console.error("Coach authorization profile status check failed", error);

      return {
        ok: false,
        status: 503,
        code: "profile_status_lookup_failed",
        message: "Coach authorization could not be verified.",
      };
    }

    if (!profile) {
      return {
        ok: false,
        status: 403,
        code: "profile_required",
        message: "An active profile is required.",
      };
    }

    const accountStatus = normalizeAccountStatus(profile.account_status);

    if (accountStatus !== "active") {
      return {
        ok: false,
        status: 403,
        code: "profile_inactive",
        message: "An active profile is required.",
      };
    }

    return {
      ok: true,
      accountStatus,
    };
  } catch (error) {
    console.error("Coach authorization profile status check failed", error);

    return {
      ok: false,
      status: 503,
      code: "profile_status_lookup_failed",
      message: "Coach authorization could not be verified.",
    };
  }
}

async function getCoachProfileExistenceStatus(userId: string): Promise<
  | { ok: true; accountStatus: "active" }
  | { ok: false; status: 503; code: string; message: string }
  | { ok: false; status: 403; code: string; message: string }
> {
  const adminSupabase = createAdminSupabaseClient();
  const { data: profile, error } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Coach authorization profile existence check failed", error);

    return {
      ok: false,
      status: 503,
      code: "profile_lookup_failed",
      message: "Coach authorization could not be verified.",
    };
  }

  if (!profile) {
    return {
      ok: false,
      status: 403,
      code: "profile_required",
      message: "An active profile is required.",
    };
  }

  return {
    ok: true,
    accountStatus: "active",
  };
}

async function fetchCircleNotesForAuth(
  auth: Extract<CoachAuthResult, { ok: true }>,
  circleId: string,
  context: CoachContext
) {
  const supabase = createAdminSupabaseClient();
  const fullResponse = await supabase
    .from("circle_notes")
    .select(
      "id, circle_id, author_id, note_type, body, visibility, audience_type, meeting_date, follow_up_at, published_at, created_at, updated_at"
    )
    .eq("circle_id", circleId)
    .in("visibility", auth.isAdmin ? ["coaches", "admins"] : ["coaches"])
    .order("created_at", { ascending: false });
  let data: unknown[] | null = fullResponse.data;
  let error = fullResponse.error;

  if (error && isMissingColumnError(error, "audience_type")) {
    const fallbackResponse = await supabase
      .from("circle_notes")
      .select(
        "id, circle_id, author_id, note_type, body, visibility, meeting_date, follow_up_at, created_at, updated_at"
      )
      .eq("circle_id", circleId)
      .in("visibility", auth.isAdmin ? ["coaches", "admins"] : ["coaches"])
      .order("created_at", { ascending: false });

    data = fallbackResponse.data;
    error = fallbackResponse.error;
  }

  if (error) {
    if (isMissingTableError(error, "circle_notes")) {
      console.warn("circle_notes table is not available yet.");
      return [];
    }

    console.error("Coach Circle notes query failed", error);
    return [];
  }

  const recipients = await fetchCircleNoteRecipients(
    ((data || []) as CircleNoteRow[]).map((note) => note.id),
    context.usersPayload
  );
  const links = await fetchCircleNoteLinks(
    ((data || []) as CircleNoteRow[]).map((note) => note.id)
  );

  return ((data || []) as CircleNoteRow[]).map((note) =>
    mapCircleNote(
      note,
      auth,
      context.usersPayload,
      recipients.get(note.id) || [],
      links.get(note.id) || []
    )
  );
}

async function fetchProfileNotesForAuth(
  auth: Extract<CoachAuthResult, { ok: true }>,
  profileId: string,
  context: CoachContext
) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("profile_notes")
    .select(
      "id, profile_id, author_id, note_type, body, visibility, is_private, created_at, updated_at"
    )
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingColumnError(error, "visibility")) {
      console.warn(
        "profile_notes.visibility is not available yet; hiding member notes from coach workspace."
      );
      return [];
    }

    if (isMissingTableError(error, "profile_notes")) {
      console.warn("profile_notes table is not available yet.");
      return [];
    }

    console.error("Coach member notes query failed", error);
    return [];
  }

  return ((data || []) as ProfileNoteRow[])
    .filter((note) => canReadProfileNote(auth, note, profileId, context))
    .map((note) => mapProfileNote(note, auth, context.usersPayload));
}

async function fetchCircleNoteRow(noteId: string, circleId: string) {
  const supabase = createAdminSupabaseClient();
  const fullResponse = await supabase
    .from("circle_notes")
    .select(
      "id, circle_id, author_id, note_type, body, visibility, audience_type, meeting_date, follow_up_at, published_at, created_at, updated_at"
    )
    .eq("id", noteId)
    .eq("circle_id", circleId)
    .maybeSingle();
  let data: unknown = fullResponse.data;
  let error = fullResponse.error;

  if (error && isMissingColumnError(error, "audience_type")) {
    const fallbackResponse = await supabase
      .from("circle_notes")
      .select(
        "id, circle_id, author_id, note_type, body, visibility, meeting_date, follow_up_at, created_at, updated_at"
      )
      .eq("id", noteId)
      .eq("circle_id", circleId)
      .maybeSingle();

    data = fallbackResponse.data;
    error = fallbackResponse.error;
  }

  if (error) {
    console.error("Coach Circle note lookup failed", error);
    throw new Error("Circle note could not be loaded.");
  }

  return (data || null) as CircleNoteRow | null;
}

async function fetchProfileNoteRow(noteId: string, profileId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("profile_notes")
    .select("id, profile_id, author_id, note_type, body, visibility, is_private, created_at, updated_at")
    .eq("id", noteId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    console.error("Coach member note lookup failed", error);
    throw new Error("Member note could not be loaded.");
  }

  return (data || null) as ProfileNoteRow | null;
}

async function fetchCircleNoteRecipients(
  noteIds: string[],
  usersPayload: AdminUsersPayload
) {
  const recipients = new Map<string, CoachPersonSummary[]>();

  if (noteIds.length === 0) return recipients;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("circle_note_recipients")
    .select("circle_note_id, profile_id")
    .in("circle_note_id", noteIds);

  if (error) {
    if (isMissingTableError(error, "circle_note_recipients")) {
      console.warn("circle_note_recipients table is not available yet.");
      return recipients;
    }

    console.error("Coach Circle note recipients query failed", error);
    return recipients;
  }

  ((data || []) as CircleNoteRecipientRow[]).forEach((row) => {
    const current = recipients.get(row.circle_note_id) || [];
    current.push(toPersonSummary(getUserById(row.profile_id, usersPayload)));
    recipients.set(row.circle_note_id, current);
  });

  recipients.forEach((items) =>
    items.sort((first, second) => first.name.localeCompare(second.name))
  );

  return recipients;
}

async function syncCircleNoteRecipients(noteId: string, recipientIds: string[]) {
  const supabase = createAdminSupabaseClient();
  const { error: deleteError } = await supabase
    .from("circle_note_recipients")
    .delete()
    .eq("circle_note_id", noteId);

  if (deleteError) {
    if (isMissingTableError(deleteError, "circle_note_recipients")) {
      logSupabaseError("Coach Circle note recipients migration is not applied", deleteError);
      return schemaUnavailableResult(
        "Circle note recipients are not fully configured. Apply the Circle note recipients Supabase migration.",
        deleteError
      );
    }

    logSupabaseError("Coach Circle note recipient cleanup failed", deleteError);
    return databaseFailureResult(
      "recipient_cleanup_failed",
      "Circle note recipients could not be updated.",
      deleteError
    );
  }

  if (recipientIds.length === 0) return { ok: true as const };

  const { error: insertError } = await supabase.from("circle_note_recipients").insert(
    recipientIds.map((profileId) => ({
      circle_note_id: noteId,
      profile_id: profileId,
    }))
  );

  if (insertError) {
    if (isMissingTableError(insertError, "circle_note_recipients")) {
      logSupabaseError("Coach Circle note recipients migration is not applied", insertError);
      return schemaUnavailableResult(
        "Circle note recipients are not fully configured. Apply the Circle note recipients Supabase migration.",
        insertError
      );
    }

    logSupabaseError("Coach Circle note recipient insert failed", insertError);
    return databaseFailureResult(
      "recipient_insert_failed",
      "Circle note recipients could not be updated.",
      insertError
    );
  }

  return { ok: true as const };
}

async function fetchCircleNoteLinks(noteIds: string[]) {
  const links = new Map<string, CoachCircleNoteLink[]>();

  if (noteIds.length === 0) return links;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("circle_note_links")
    .select("id, circle_note_id, label, url, sort_order")
    .in("circle_note_id", noteIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableError(error, "circle_note_links")) {
      console.warn("circle_note_links table is not available yet.");
      return links;
    }

    console.error("Coach Circle note links query failed", error);
    return links;
  }

  ((data || []) as CircleNoteLinkRow[]).forEach((row) => {
    const current = links.get(row.circle_note_id) || [];
    current.push(mapCircleNoteLink(row));
    links.set(row.circle_note_id, current);
  });

  return links;
}

async function syncCircleNoteLinks(
  noteId: string,
  links: CoachCircleNoteLink[],
  options: { skipWhenEmpty?: boolean } = {}
) {
  if (links.length === 0 && options.skipWhenEmpty) {
    return { ok: true as const, links: [] };
  }

  const supabase = createAdminSupabaseClient();
  const { error: deleteError } = await supabase
    .from("circle_note_links")
    .delete()
    .eq("circle_note_id", noteId);

  if (deleteError) {
    if (isMissingTableError(deleteError, "circle_note_links")) {
      logSupabaseError("Coach Circle note links migration is not applied", deleteError);
      if (links.length === 0) return { ok: true as const, links: [] };

      return schemaUnavailableResult(
        "circle_note_links_table_missing",
        "Unable to save the Circle note. Apply the Circle note links Supabase migration.",
        deleteError
      );
    }

    logSupabaseError("Coach Circle note link cleanup failed", deleteError);
    return databaseFailureResult(
      "link_cleanup_failed",
      "Circle note links could not be updated.",
      deleteError
    );
  }

  if (links.length === 0) return { ok: true as const, links: [] };

  const { data, error: insertError } = await supabase
    .from("circle_note_links")
    .insert(
      links.map((link, index) => ({
        circle_note_id: noteId,
        label: link.label || null,
        url: link.url,
        sort_order: index,
      }))
    )
    .select("id, circle_note_id, label, url, sort_order")
    .order("sort_order", { ascending: true });

  if (insertError) {
    if (isMissingTableError(insertError, "circle_note_links")) {
      logSupabaseError("Coach Circle note links migration is not applied", insertError);
      return schemaUnavailableResult(
        "circle_note_links_table_missing",
        "Unable to save the Circle note. Apply the Circle note links Supabase migration.",
        insertError
      );
    }

    logSupabaseError("Coach Circle note link insert failed", insertError);
    return databaseFailureResult(
      "circle_note_link_insert_failed",
      "Circle note links could not be updated.",
      insertError
    );
  }

  return {
    ok: true as const,
    links: ((data || []) as CircleNoteLinkRow[]).map(mapCircleNoteLink),
  };
}

function mapCircleNote(
  row: CircleNoteRow,
  auth: Extract<CoachAuthResult, { ok: true }>,
  usersPayload: AdminUsersPayload,
  recipients: CoachPersonSummary[],
  links: CoachCircleNoteLink[]
): CoachCircleNote {
  const audienceType = parseCircleNoteAudienceType(row.audience_type);
  const canManage = audienceType !== "internal" && canEditNote(auth, row.author_id);

  return {
    id: row.id,
    circleId: row.circle_id,
    author: toNoteAuthor(row.author_id, usersPayload),
    noteType: parseCircleNoteType(row.note_type),
    body: row.body || "",
    visibility: parseCircleNoteVisibility(row.visibility),
    audienceType,
    recipients,
    links,
    meetingDate: row.meeting_date,
    followUpAt: row.follow_up_at,
    publishedAt: row.published_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    canEdit: canManage,
    canDelete: canEditNote(auth, row.author_id),
  };
}

function mapCircleNoteLink(row: CircleNoteLinkRow): CoachCircleNoteLink {
  return {
    id: row.id,
    label: row.label || "",
    url: row.url,
    sortOrder: row.sort_order || 0,
  };
}

function mapProfileNote(
  row: ProfileNoteRow,
  auth: Extract<CoachAuthResult, { ok: true }>,
  usersPayload: AdminUsersPayload
): CoachProfileNote {
  return {
    id: row.id,
    profileId: row.profile_id,
    author: toNoteAuthor(row.author_id, usersPayload),
    noteType: parseProfileNoteType(row.note_type),
    body: row.body || "",
    visibility: parseProfileNoteVisibility(row.visibility),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    canEdit: canEditNote(auth, row.author_id),
    canDelete: canEditNote(auth, row.author_id),
  };
}

function canReadProfileNote(
  auth: Extract<CoachAuthResult, { ok: true }>,
  note: ProfileNoteRow,
  profileId: string,
  context: CoachContext
) {
  const visibility = parseProfileNoteVisibility(note.visibility);

  if (auth.isAdmin) return true;
  if (visibility === "admins") return false;
  if (visibility === "assigned_coaches") {
    const profile = getUserById(profileId, context.usersPayload);
    return Boolean(profile?.coachIds.includes(auth.user.id));
  }

  return context.circleCoachMemberIds.has(profileId);
}

function canEditNote(
  auth: Extract<CoachAuthResult, { ok: true }>,
  authorId: string | null
) {
  return auth.isAdmin || authorId === auth.user.id;
}

function cleanCircleNoteInput(
  values: CoachCircleNoteInput,
  auth: Extract<CoachAuthResult, { ok: true }>,
  circleId: string,
  context: CoachContext
) {
  const body = cleanLimitedText(values.body, maxNoteLength);
  const noteType = parseCircleNoteType(values.noteType);
  const visibility = parseCircleNoteVisibility(values.visibility);
  const audienceType = parseCircleNoteAudienceType(values.audienceType);
  const meetingDate = cleanDate(values.meetingDate);
  const followUpAt = cleanDate(values.followUpAt);
  const links = cleanCircleNoteLinks(values.links);
  const activeCircle = context.usersPayload.circles.find(
    (circle) => circle.id === circleId
  );
  const activeMemberIds = new Set(activeCircle?.memberIds || []);
  const requestedRecipientIds = unique(
    (Array.isArray(values.recipientIds) ? values.recipientIds : []).filter(
      (value): value is string => typeof value === "string"
    )
  );
  const recipientIds = requestedRecipientIds.filter((profileId) =>
    activeMemberIds.has(profileId)
  );

  if (!body) return validationResult("Note body is required.", "circle_note_validation_failed");
  if (!links.ok) return links;
  if (audienceType === "internal") {
    return validationResult(
      "Choose All Circle Members or Selected Circle Members.",
      "circle_note_validation_failed"
    );
  }
  if (!auth.isAdmin && visibility !== "coaches") {
    return validationResult(
      "Circle note visibility is not available.",
      "circle_note_validation_failed"
    );
  }
  if (audienceType === "selected_members" && recipientIds.length === 0) {
    return validationResult("Select at least one Circle member.", "recipient_validation_failed");
  }
  if (
    audienceType === "selected_members" &&
    requestedRecipientIds.length !== recipientIds.length
  ) {
    return validationResult(
      "Selected recipients must belong to this Circle.",
      "recipient_validation_failed"
    );
  }
  if (!isDateValid(values.meetingDate) || !isDateValid(values.followUpAt)) {
    return validationResult(
      "Note dates must use YYYY-MM-DD format.",
      "circle_note_validation_failed"
    );
  }

  return {
    ok: true as const,
    noteType,
    body,
    visibility,
    audienceType,
    recipientIds: audienceType === "selected_members" ? recipientIds : [],
    links: links.links,
    meetingDate,
    followUpAt,
  };
}

function cleanCircleNoteLinks(value: unknown) {
  const rows = Array.isArray(value) ? value : [];
  const links: CoachCircleNoteLink[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;

    const source = row as Record<string, unknown>;
    const label = cleanLimitedText(source.label, maxCircleNoteLinkLabelLength);
    const rawUrl = typeof source.url === "string" ? source.url.trim() : "";

    if (!label && !rawUrl) continue;
    if (label && !rawUrl) {
      return validationResult("Shared Links need a URL.", "circle_note_validation_failed");
    }
    if (!rawUrl) continue;
    if (rawUrl.length > maxCircleNoteLinkUrlLength) {
      return validationResult(
        "Shared Link URLs are too long.",
        "circle_note_validation_failed"
      );
    }

    const normalizedUrl = normalizeCircleNoteUrl(rawUrl);

    if (!normalizedUrl) {
      return validationResult(
        "Shared Links must use a valid HTTPS URL.",
        "circle_note_validation_failed"
      );
    }

    links.push({
      id: typeof source.id === "string" ? source.id : "",
      label,
      url: normalizedUrl,
      sortOrder:
        typeof source.sortOrder === "number" && Number.isFinite(source.sortOrder)
          ? source.sortOrder
          : links.length,
    });

    if (links.length > maxCircleNoteLinks) {
      return validationResult(
        "Add up to 10 Shared Links per Circle note.",
        "circle_note_validation_failed"
      );
    }
  }

  return {
    ok: true as const,
    links: links.sort((first, second) => first.sortOrder - second.sortOrder),
  };
}

function normalizeCircleNoteUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function cleanProfileNoteInput(
  values: CoachProfileNoteInput,
  auth: Extract<CoachAuthResult, { ok: true }>,
  profileId: string,
  context: CoachContext
) {
  const body = cleanLimitedText(values.body, maxNoteLength);
  const noteType = parseProfileNoteType(values.noteType);
  const visibility = parseProfileNoteVisibility(values.visibility);

  if (!body) return validationResult("Note body is required.");

  if (auth.isAdmin) {
    return { ok: true as const, noteType, body, visibility };
  }

  if (visibility === "admins") {
    return validationResult("Member note visibility is not available.");
  }

  if (visibility === "assigned_coaches") {
    const profile = getUserById(profileId, context.usersPayload);

    if (!profile?.coachIds.includes(auth.user.id)) {
      return validationResult("Assigned-coach visibility is not available.");
    }
  }

  if (
    visibility === "circle_coaches" &&
    !context.circleCoachMemberIds.has(profileId)
  ) {
    return validationResult("Circle-coach visibility is not available.");
  }

  return { ok: true as const, noteType, body, visibility };
}

function cleanGrowthStatusInput(values: CoachGrowthStatusInput) {
  const processStage = values.processStage.trim();
  const engagementStatus = values.engagementStatus.trim();
  const lastContactAt = cleanDate(values.lastContactAt);
  const nextFollowUpAt = cleanDate(values.nextFollowUpAt);
  const followUpCompletedAt = cleanDateTime(values.followUpCompletedAt);
  const followUpStatus = parseFollowUpStatus(values.followUpStatus);

  if (processStage && !processStageOptions.includes(processStage)) {
    return validationResult("Process stage is not available.");
  }
  if (engagementStatus && !engagementStatusOptions.includes(engagementStatus)) {
    return validationResult("Engagement status is not available.");
  }
  if (
    !isDateValid(values.lastContactAt) ||
    !isDateValid(values.nextFollowUpAt) ||
    !isDateTimeValid(values.followUpCompletedAt)
  ) {
    return validationResult("Dates must use a valid date format.");
  }

  return {
    ok: true as const,
    processStage,
    engagementStatus,
    currentFocus: cleanLimitedText(values.currentFocus, 500),
    nextStep: cleanLimitedText(values.nextStep, 500),
    lastContactAt,
    nextFollowUpAt,
    followUpStatus,
    followUpCompletedAt,
    growthSummary: cleanLimitedText(values.growthSummary, 2000),
    supportNeeds: cleanLimitedText(values.supportNeeds, 2000),
  };
}

function validationResult(message: string, code = "validation_failed"): CoachActionFailure {
  return {
    ok: false as const,
    status: 400,
    code,
    message,
  };
}

function schemaUnavailableResult(
  codeOrMessage: string,
  messageOrError?: string | unknown,
  maybeError?: unknown
): CoachActionFailure {
  const hasCustomCode = typeof messageOrError === "string";
  const code = hasCustomCode ? codeOrMessage : "circle_note_schema_unavailable";
  const message = hasCustomCode ? messageOrError : codeOrMessage;
  const error = hasCustomCode ? maybeError : messageOrError;

  return {
    ok: false as const,
    status: 503,
    code,
    message,
    ...developmentSupabaseDiagnostic(error),
  };
}

function databaseFailureResult(
  code: string,
  message: string,
  error: unknown
): CoachActionFailure {
  return {
    ok: false as const,
    status: 503,
    code,
    message,
    ...developmentSupabaseDiagnostic(error),
  };
}

function notFoundResult(): CoachActionFailure {
  return {
    ok: false as const,
    status: 404,
    code: "resource_unavailable",
    message: "This resource is not available.",
  };
}

async function fetchOptionalCoachAssessmentData() {
  try {
    return await fetchAdminAssessmentData();
  } catch (error) {
    console.error(
      "Coach dashboard assessment query failed; continuing with empty assessment data.",
      error
    );

    return {
      users: [],
      profiles: [],
      assessments: [],
    };
  }
}

function buildCircleSummary({
  circle,
  records,
  usersPayload,
  growthStatuses,
}: {
  circle: AdminUsersPayload["circles"][number];
  records: AdminAssessmentRecord[];
  usersPayload: AdminUsersPayload;
  growthStatuses: Map<string, CoachGrowthStatus>;
}): CoachCircleSummary {
  const activeMembers = circle.memberIds
    .map((memberId) => getUserById(memberId, usersPayload))
    .filter(isActiveProfile);
  const assessedMemberIds = new Set(
    records
      .filter((record) => circle.memberIds.includes(record.userId))
      .map((record) => record.userId)
  );

  return {
    id: circle.id,
    name: circle.name,
    description: circle.description,
    status: circle.status,
    memberCount: activeMembers.length,
    coaches: circle.coachIds.map((coachId) =>
      toPersonSummary(getUserById(coachId, usersPayload))
    ),
    assessedCount: activeMembers.filter((member) =>
      assessedMemberIds.has(member.id)
    ).length,
    growthStatusCount: activeMembers.filter((member) =>
      growthStatuses.has(member.id)
    ).length,
  };
}

function buildCircleMemberCard(
  member: AdminManagedProfile,
  context: CoachContext
): CoachCircleMemberCard {
  const assessments = getLatestAssessmentPerType(
    context.records.filter((record) => record.userId === member.id)
  );
  const latestAssessment = assessments[0] || null;
  const growthStatus = context.growthStatuses.get(member.id);

  return {
    id: member.id,
    name: formatUserName(member),
    initials: getInitials(member),
    email: member.email,
    latestAssessment,
    assessmentStatus: latestAssessment ? latestAssessment.profileTitle : "Not assessed",
    processStage: growthStatus?.processStage || "No growth status documented",
    nextStep: growthStatus?.nextStep || "",
    nextFollowUpAt: growthStatus?.nextFollowUpAt || null,
    followUpStatus: growthStatus?.followUpStatus || "none",
    followUpDisplayStatus: getFollowUpDisplayStatus(growthStatus || null),
    assignedCoaches: member.coachIds.map((coachId) =>
      toPersonSummary(getUserById(coachId, context.usersPayload))
    ),
  };
}

async function fetchGrowthStatuses(profileIds: string[]) {
  const statuses = new Map<string, CoachGrowthStatus>();

  if (profileIds.length === 0) return statuses;

  const supabase = createAdminSupabaseClient();
  const fullResponse = await supabase
    .from("profile_growth_status")
    .select(
      "profile_id, process_stage, engagement_status, current_focus, next_step, last_contact_at, next_follow_up_at, follow_up_status, follow_up_completed_at, growth_summary, support_needs, updated_by, updated_at"
    )
    .in("profile_id", profileIds);
  let data: unknown[] | null = fullResponse.data;
  let error = fullResponse.error;

  if (error && isMissingFollowUpColumnError(error)) {
    console.warn(
      "profile_growth_status follow-up columns are not available yet; loading growth status without follow-up completion fields."
    );

    const fallbackResponse = await supabase
      .from("profile_growth_status")
      .select(
        "profile_id, process_stage, engagement_status, current_focus, next_step, last_contact_at, next_follow_up_at, growth_summary, support_needs, updated_by, updated_at"
      )
      .in("profile_id", profileIds);

    data = fallbackResponse.data;
    error = fallbackResponse.error;
  }

  if (error) {
    if (isMissingTableError(error, "profile_growth_status")) {
      console.warn("profile_growth_status table is not available yet.");
      return statuses;
    }

    console.error("Coach dashboard growth-status query failed", error);
    return statuses;
  }

  ((data || []) as GrowthStatusRow[]).forEach((row) => {
    statuses.set(row.profile_id, {
      processStage: row.process_stage || "",
      engagementStatus: row.engagement_status || "",
      currentFocus: row.current_focus || "",
      nextStep: row.next_step || "",
      lastContactAt: row.last_contact_at,
      nextFollowUpAt: row.next_follow_up_at,
      followUpStatus: parseFollowUpStatus(row.follow_up_status),
      followUpCompletedAt: row.follow_up_completed_at || null,
      growthSummary: row.growth_summary || "",
      supportNeeds: row.support_needs || "",
      updatedBy: row.updated_by || null,
      updatedByName: row.updated_by
        ? "Updated by " + row.updated_by.slice(0, 8)
        : "",
      updatedAt: row.updated_at,
    });
  });

  return statuses;
}

async function hasRole(profileId: string, roleName: "coach" | "admin") {
  const supabase = createAdminSupabaseClient();
  const [rolesResponse, profileRolesResponse] = await Promise.all([
    supabase.from("roles").select("id, name").eq("name", roleName).maybeSingle(),
    supabase.from("profile_roles").select("profile_id, role_id").eq("profile_id", profileId),
  ]);

  if (rolesResponse.error || profileRolesResponse.error) {
    console.error("Coach authorization role check failed", {
      roleError: rolesResponse.error,
      profileRoleError: profileRolesResponse.error,
    });
    throw new Error("Coach authorization could not be verified.");
  }

  const role = rolesResponse.data as { id: string; name: string } | null;

  if (!role) return false;

  return ((profileRolesResponse.data || []) as Array<{ role_id: string }>).some(
    (row) => row.role_id === role.id
  );
}

function buildMemberSearchIndex(context: CoachContext): CoachMemberSearchItem[] {
  return Array.from(context.authorizedMemberIds)
    .map((memberId) => getUserById(memberId, context.usersPayload))
    .filter(isActiveProfile)
    .map((member) => {
      const circles = context.authorizedCircles.filter((circle) => {
        const sourceCircle = context.usersPayload.circles.find(
          (item) => item.id === circle.id
        );

        return Boolean(sourceCircle?.memberIds.includes(member.id));
      });

      return {
        id: member.id,
        name: formatUserName(member),
        email: member.email,
        circleIds: circles.map((circle) => circle.id),
        circleNames: circles.map((circle) => circle.name),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getLatestAssessmentPerType(records: AdminAssessmentRecord[]) {
  const latestByAssessmentKey = new Map<string, AdminAssessmentRecord>();

  records.forEach((record) => {
    const current = latestByAssessmentKey.get(record.assessmentKey);

    if (!current || compareAssessmentRecords(record, current) < 0) {
      latestByAssessmentKey.set(record.assessmentKey, record);
    }
  });

  return Array.from(latestByAssessmentKey.values()).sort(compareAssessmentRecords);
}

function compareAssessmentRecords(
  first: AdminAssessmentRecord,
  second: AdminAssessmentRecord
) {
  const firstTime = first.completionDate
    ? new Date(first.completionDate).getTime()
    : 0;
  const secondTime = second.completionDate
    ? new Date(second.completionDate).getTime()
    : 0;

  if (firstTime !== secondTime) return secondTime - firstTime;

  return second.assessmentId.localeCompare(first.assessmentId);
}

function buildMemberActivity({
  profile,
  assessments,
  growthStatus,
}: {
  profile: AdminManagedProfile;
  assessments: AdminAssessmentRecord[];
  growthStatus: CoachGrowthStatus | null;
}) {
  return [
    {
      key: "created",
      label: "Profile created",
      date: profile.createdAt,
      detail: profile.email,
    },
    ...assessments.map((assessment) => ({
      key: `assessment-${assessment.assessmentId}`,
      label: `${assessment.assessmentName} completed`,
      date: assessment.completionDate,
      detail: assessment.profileTitle,
    })),
    ...(growthStatus
      ? [
          {
            key: "growth-status",
            label: "Growth status documented",
            date: growthStatus.updatedAt,
            detail: growthStatus.processStage || "Growth status",
          },
        ]
      : []),
  ]
    .filter((item) => item.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function getUserById(userId: string, payload: AdminUsersPayload) {
  return payload.users.find((user) => user.id === userId);
}

function isActiveProfile(
  profile: AdminManagedProfile | undefined
): profile is AdminManagedProfile {
  return Boolean(profile && profile.accountStatus === "active");
}

function toPersonSummary(
  profile: AdminManagedProfile | undefined,
  fallbackEmail = ""
): CoachPersonSummary {
  return {
    id: profile?.id || "",
    name: profile ? formatUserName(profile) : fallbackEmail || "Unknown profile",
    email: profile?.email || fallbackEmail,
  };
}

function toNoteAuthor(
  authorId: string | null,
  usersPayload: AdminUsersPayload
): CoachNoteAuthor {
  const profile = authorId ? getUserById(authorId, usersPayload) : undefined;
  const fallback = authorId ? `Profile ${authorId.slice(0, 8)}` : "Unknown author";

  return {
    id: authorId || "",
    name: profile ? formatUserName(profile) : fallback,
    email: profile?.email || "",
  };
}

function formatUserName(profile: AdminManagedProfile) {
  return (
    [profile.firstName, profile.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ") ||
    profile.email ||
    "Unnamed profile"
  );
}

function getInitials(profile: AdminManagedProfile) {
  const initials = `${profile.firstName.trim().charAt(0)}${profile.lastName
    .trim()
    .charAt(0)}`;
  return initials.toUpperCase() || profile.email.trim().charAt(0).toUpperCase() || "PW";
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function parseCircleNoteType(value: unknown): CoachCircleNoteType {
  return typeof value === "string" &&
    circleNoteTypes.includes(value as CoachCircleNoteType)
    ? (value as CoachCircleNoteType)
    : "general";
}

function parseProfileNoteType(value: unknown): CoachProfileNoteType {
  return typeof value === "string" &&
    profileNoteTypes.includes(value as CoachProfileNoteType)
    ? (value as CoachProfileNoteType)
    : "general";
}

function parseCircleNoteVisibility(value: unknown): CoachCircleNoteVisibility {
  return value === "admins" ? "admins" : "coaches";
}

function parseCircleNoteAudienceType(value: unknown): CoachCircleNoteAudienceType {
  if (value === "all_circle_members" || value === "selected_members") return value;
  return "internal";
}

function parseProfileNoteVisibility(value: unknown): CoachProfileNoteVisibility {
  if (value === "assigned_coaches" || value === "circle_coaches") return value;
  return "admins";
}

function parseFollowUpStatus(value: unknown): CoachFollowUpStatus {
  return typeof value === "string" &&
    followUpStatusOptions.includes(value as CoachFollowUpStatus)
    ? (value as CoachFollowUpStatus)
    : "none";
}

function getFollowUpBuckets(
  memberIds: string[],
  growthStatuses: Map<string, CoachGrowthStatus>
) {
  return memberIds.reduce(
    (buckets, memberId) => {
      const status = getFollowUpDisplayStatus(growthStatuses.get(memberId) || null);
      buckets[status].push(memberId);
      return buckets;
    },
    {
      overdue: [] as string[],
      due_soon: [] as string[],
      scheduled: [] as string[],
      completed: [] as string[],
      deferred: [] as string[],
      none: [] as string[],
      get dueSoon() {
        return this.due_soon;
      },
      get scheduledLater() {
        return this.scheduled;
      },
    }
  );
}

function getFollowUpDisplayStatus(
  growthStatus: CoachGrowthStatus | null
): CoachFollowUpDisplayStatus {
  if (!growthStatus) return "none";
  if (growthStatus.followUpStatus === "completed") return "completed";
  if (growthStatus.followUpStatus === "deferred") return "deferred";
  if (!growthStatus.nextFollowUpAt) return "none";

  const today = new Date(todayKey()).getTime();
  const next = new Date(growthStatus.nextFollowUpAt).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (next < today) return "overdue";
  if (next <= today + sevenDays) return "due_soon";
  return "scheduled";
}

function cleanLimitedText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function unique<T extends string>(values: T[]) {
  return Array.from(new Set(values));
}

function cleanDate(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function cleanDateTime(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function isDateValid(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return false;
  return !Number.isNaN(new Date(`${value.trim()}T00:00:00Z`).getTime());
}

function isDateTimeValid(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return true;
  return !Number.isNaN(new Date(value.trim()).getTime());
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.toLowerCase().startsWith("bearer ")) return "";

  return authorization.slice("bearer ".length).trim();
}

function normalizeAccountStatus(value: unknown) {
  if (value === "deactivated" || value === "archived") return value;
  return "active";
}

function isMissingTableError(error: unknown, tableName: string) {
  if (!error || typeof error !== "object") return false;

  const values = Object.values(error as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return (
    values.includes(tableName) &&
    (values.includes("relation") ||
      values.includes("schema cache") ||
      values.includes("could not find the table"))
  );
}

function isMissingColumnError(error: unknown, columnName: string) {
  if (!error || typeof error !== "object") return false;

  const values = Object.values(error as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return values.includes(columnName.toLowerCase()) && values.includes("column");
}

function isCircleNotesSchemaError(error: unknown) {
  return (
    isMissingTableError(error, "circle_notes") ||
    isMissingColumnError(error, "audience_type") ||
    isMissingColumnError(error, "published_at") ||
    isCheckConstraintError(error, "circle_notes_audience_type_check") ||
    isCheckConstraintError(error, "circle_notes_note_type_check") ||
    isCheckConstraintError(error, "circle_notes_visibility_check")
  );
}

function isCheckConstraintError(error: unknown, constraintName: string) {
  if (!error || typeof error !== "object") return false;

  const values = Object.values(error as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return values.includes(constraintName.toLowerCase());
}

function logSupabaseError(label: string, error: unknown) {
  console.error(label, developmentSupabaseDiagnostic(error));
}

function developmentSupabaseDiagnostic(error: unknown) {
  if (process.env.NODE_ENV === "production" || !error || typeof error !== "object") {
    return {};
  }

  const source = error as Record<string, unknown>;
  const diagnostic: { details?: string; hint?: string } = {};
  const parts = [source.code, source.message]
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0
    )
    .join(": ");

  if (parts) diagnostic.details = parts;

  if (typeof source.details === "string" && source.details.trim()) {
    diagnostic.details = diagnostic.details
      ? `${diagnostic.details} ${source.details}`
      : source.details;
  }

  if (typeof source.hint === "string" && source.hint.trim()) {
    diagnostic.hint = source.hint;
  }

  return diagnostic;
}

function isMissingFollowUpColumnError(error: unknown) {
  return (
    isMissingColumnError(error, "follow_up_status") ||
    isMissingColumnError(error, "follow_up_completed_at")
  );
}

function isMissingLifecycleColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const values = Object.values(error as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return values.includes("account_status") && values.includes("column");
}
