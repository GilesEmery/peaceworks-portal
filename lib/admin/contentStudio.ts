import "server-only";

import { createAdminSupabaseClient } from "./authorization";
import {
  archiveCanonicalAssignment,
  canonicalAssignmentSelect,
  createCanonicalAssignments,
  resolveCanonicalAssignmentRows,
  restoreCanonicalAssignment,
  upsertMonthlyQuestionAssignmentMetadata,
} from "../content/assignments";
import type { ResolvedCanonicalAssignment } from "../content/assignments";
import type { ContentItemKind } from "../content/registry";
import { deliverCommunicationToPortal } from "../messaging/service";
import { deliverCommunicationEmail } from "../communications/email";
import {
  fetchEligibleCommunicationSenders,
  normalizeReplyToEmails,
  parseStoredReplyToEmails,
  resolveCommunicationSender,
  serializeReplyToEmails,
} from "../communications/senders";

export type AdminContentStatus = "draft" | "published" | "archived";
export type AdminContentType = ContentItemKind;
export type AdminAudienceType =
  | "coach_library"
  | "all_members"
  | "all_circle_members"
  | "all_coaches"
  | "selected_circle"
  | "selected_member"
  | "selected_coach";
export type AdminPlacement =
  | "my_dashboard"
  | "coach_dashboard_library"
  | "circle_dashboard"
  | "assessments_area"
  | "resources_area"
  | "trainings_area"
  | "featured_dashboard"
  | "announcements_area";
export type AdminResourceType =
  | "link"
  | "video"
  | "audio"
  | "pdf"
  | "image"
  | "document"
  | "worksheet"
  | "guide"
  | "article"
  | "blog"
  | "reflection"
  | "case_study"
  | "downloadable_tool"
  | "other";

export type AdminMonthlyQuestion = {
  id: string;
  title: string;
  openingReflection: string;
  questionText: string;
  guidance: string;
  discussionPrompts: string[];
  status: AdminContentStatus;
  category: string;
  theme: string;
  questionNumber: string;
  assignedCircleCount: number;
  currentUseCount: number;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminResource = {
  id: string;
  title: string;
  description: string;
  resourceType: AdminResourceType;
  provider: string;
  externalUrl: string;
  embedUrl: string;
  storagePath: string;
  thumbnailUrl: string;
  coverImagePath: string;
  coverImageUrl: string;
  bodyContent: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string;
  category: string;
  tags: string[];
  status: AdminContentStatus;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminTraining = {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  category: string;
  estimatedDuration: string;
  status: AdminContentStatus;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminCommunication = {
  id: string;
  format: CommunicationFormat;
  title: string;
  subject: string;
  previewText: string;
  summary: string;
  bodyContent: string;
  communicationType: string;
  channel: string;
  dashboardPresentation: DashboardPresentation;
  audienceScope: string;
  senderId: string;
  senderName: string;
  replyToEmails: string[];
  visibleAuthorName: string;
  headerImagePath: string;
  headerImageUrl: string;
  thumbnailImagePath: string;
  thumbnailImageUrl: string;
  imageAltText: string;
  category: string;
  tags: string[];
  visibleFrom: string | null;
  visibleUntil: string | null;
  links: CommunicationLink[];
  channels: CommunicationChannel[];
  audienceTargets: CommunicationAudienceTarget[];
  newsletterSections: CommunicationNewsletterSection[];
  resourceId: string;
  status: AdminContentStatus;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CommunicationFormat =
  | "email"
  | "blog_article"
  | "announcement"
  | "newsletter"
  | "dashboard_message"
  | "circle_update";

export type DashboardPresentation = "standard" | "featured" | "banner" | "article";

export type CommunicationLink = {
  id: string;
  label: string;
  url: string;
  linkStyle: "text" | "button" | "featured";
  sortOrder: number;
};

export type CommunicationChannel =
  | "email"
  | "my_dashboard"
  | "circle_dashboards"
  | "coach_dashboards"
  | "admin_internal"
  | "resource_library";

export type CommunicationAudienceTarget = {
  id: string;
  audienceType: string;
  circleId: string;
  profileId: string;
};

export type CommunicationNewsletterSection = {
  id: string;
  heading: string;
  bodyContent: string;
  sortOrder: number;
};

export type CommunicationSender = {
  id: string;
  displayName: string;
  email: string;
  senderType: string;
  profileId: string;
  isDefault: boolean;
};

export type AdminContentAssignment = {
  id: string;
  contentType: AdminContentType;
  contentId: string;
  audienceType: AdminAudienceType;
  circleId: string;
  profileId: string;
  placement: AdminPlacement;
  assignmentStatus: "active" | "archived";
  visibleFrom: string | null;
  visibleUntil: string | null;
  assignedBy: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminContentStudioPayload = {
  ok: true;
  monthlyQuestions: AdminMonthlyQuestion[];
  resources: AdminResource[];
  trainings: AdminTraining[];
  communications: AdminCommunication[];
  communicationSenders: CommunicationSender[];
  assignments: AdminContentAssignment[];
};

export type ContentAssignmentInput = {
  contentType: string;
  contentId: string;
  audienceType: string;
  placement: string;
  circleIds?: string[];
  profileIds?: string[];
  visibleFrom?: string | null;
  visibleUntil?: string | null;
};

export type MonthlyQuestionValues = {
  title: string;
  openingReflection: string;
  questionText: string;
  guidance: string;
  discussionPrompts: string[];
  category: string;
  theme: string;
  questionNumber?: string | null;
};

export type ResourceValues = {
  title: string;
  description: string;
  resourceType: string;
  externalUrl: string;
  embedUrl?: string;
  storagePath: string;
  thumbnailUrl: string;
  coverImagePath?: string;
  bodyContent?: string;
  fileName?: string;
  fileSize?: number | null;
  mimeType?: string;
  category: string;
  tags: string[];
};

export type TrainingValues = {
  title: string;
  description: string;
  coverImageUrl: string;
  category: string;
  estimatedDuration: string;
};

export type CommunicationValues = {
  format?: string;
  title: string;
  subject: string;
  previewText?: string;
  summary: string;
  bodyContent: string;
  communicationType: string;
  channel: string;
  audienceScope: string;
  dashboardPresentation?: string;
  senderId?: string;
  replyToEmails?: string[];
  replyToEmail?: string;
  visibleAuthorName?: string;
  headerImagePath?: string;
  thumbnailImagePath?: string;
  useHeaderAsThumbnail?: boolean;
  imageAltText?: string;
  category?: string;
  tags?: string[];
  visibleFrom?: string | null;
  visibleUntil?: string | null;
  links?: Array<{ label?: string; url?: string; linkStyle?: string; sortOrder?: number }>;
  channels?: string[];
  circleIds?: string[];
  profileIds?: string[];
  newsletterSections?: Array<{ heading?: string; bodyContent?: string; sortOrder?: number }>;
  addToResourceLibrary?: boolean;
  resourceTitle?: string;
  resourceSummary?: string;
  resourceType?: string;
  resourceCategory?: string;
  resourceTags?: string[];
  resourceStatus?: string;
};

type MonthlyQuestionRow = {
  id: string;
  content_item_id: string;
  title: string | null;
  opening_reflection: string | null;
  question_text: string | null;
  guidance: string | null;
  discussion_prompts: unknown;
  status: string | null;
  category?: string | null;
  theme?: string | null;
  question_number: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ContentResourceRow = {
  id: string;
  content_item_id: string;
  title: string | null;
  description: string | null;
  resource_type: string | null;
  provider?: string | null;
  external_url: string | null;
  embed_url?: string | null;
  storage_path: string | null;
  thumbnail_url: string | null;
  cover_image_path?: string | null;
  body_content?: string | null;
  source_communication_id?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  category: string | null;
  tags: unknown;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type TrainingRow = {
  id: string;
  content_item_id: string;
  title: string | null;
  description: string | null;
  cover_image_url: string | null;
  category: string | null;
  estimated_duration: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CommunicationRow = {
  id: string;
  format?: string | null;
  title: string | null;
  subject: string | null;
  preview_text?: string | null;
  summary: string | null;
  body_content: string | null;
  communication_type: string | null;
  channel: string | null;
  dashboard_presentation?: string | null;
  audience_scope: string | null;
  sender_id?: string | null;
  reply_to_email?: string | null;
  visible_author_name?: string | null;
  header_image_path?: string | null;
  thumbnail_image_path?: string | null;
  image_alt_text?: string | null;
  category?: string | null;
  tags?: unknown;
  visible_from?: string | null;
  visible_until?: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CommunicationLinkRow = {
  id: string;
  communication_id?: string | null;
  label: string | null;
  url: string | null;
  link_style: string | null;
  sort_order: number | null;
};

type CommunicationChannelRow = {
  channel: string | null;
};

type CommunicationAudienceTargetRow = {
  id: string;
  audience_type: string | null;
  circle_id: string | null;
  profile_id: string | null;
};

type CommunicationNewsletterSectionRow = {
  id: string;
  heading: string | null;
  body_content: string | null;
  sort_order: number | null;
};

type ContentAssignmentRow = ResolvedCanonicalAssignment;

const monthlyQuestionSelect =
  "id,content_item_id,title,opening_reflection,question_text,guidance,discussion_prompts,status,category,theme,question_number,published_at,created_at,updated_at";

export async function fetchAdminContentStudio(): Promise<AdminContentStudioPayload> {
  const [monthlyQuestions, resources, trainings, communications, communicationSenders, assignments] = await Promise.all([
    fetchMonthlyQuestions(),
    fetchResources(),
    fetchTrainings(),
    fetchCommunications(),
    fetchCommunicationSenders(),
    fetchContentAssignments(),
  ]);

  return {
    ok: true,
    monthlyQuestions,
    resources,
    trainings,
    communications,
    communicationSenders,
    assignments,
  };
}

export async function createAdminContentAssignments(
  adminUserId: string,
  input: ContentAssignmentInput
) {
  const cleaned = await cleanContentAssignmentInput(input);
  const assignments =
    cleaned.audienceType === "selected_circle"
      ? cleaned.circleIds.map((circleId) => ({
          audienceType: cleaned.audienceType,
          circleId,
          placement: cleaned.placement,
          visibleFrom: cleaned.visibleFrom,
          visibleUntil: cleaned.visibleUntil,
        }))
      : cleaned.audienceType === "selected_member" ||
          cleaned.audienceType === "selected_coach"
        ? cleaned.profileIds.map((profileId) => ({
            audienceType: cleaned.audienceType,
            profileId,
            placement: cleaned.placement,
            visibleFrom: cleaned.visibleFrom,
            visibleUntil: cleaned.visibleUntil,
          }))
        : [
            {
              audienceType: cleaned.audienceType,
              placement: cleaned.placement,
              visibleFrom: cleaned.visibleFrom,
              visibleUntil: cleaned.visibleUntil,
            },
          ];

  const rows = await createCanonicalAssignments({
    contentItemId: cleaned.contentItemId,
    assignedBy: adminUserId,
    assignments,
  });

  if (
    cleaned.contentType === "monthly_question" &&
    cleaned.audienceType === "selected_circle" &&
    cleaned.placement === "circle_dashboard"
  ) {
    await upsertMonthlyQuestionAssignmentMetadata({
      questionId: cleaned.contentId,
      circleIds: rows
        .map((row) => row.circle_id)
        .filter((circleId): circleId is string => Boolean(circleId)),
      assignedBy: adminUserId,
      visibleFrom: cleaned.visibleFrom || new Date().toISOString(),
    });
  }

  return rows.map(mapContentAssignment);
}

export async function archiveAdminContentAssignment(assignmentId: string) {
  return mapContentAssignment(await archiveCanonicalAssignment(assignmentId));
}

export async function restoreAdminContentAssignment(assignmentId: string) {
  const result = await restoreCanonicalAssignment(assignmentId);
  return mapContentAssignment(result.assignment);
}

export async function deleteAdminContentAssignment(assignmentId: string) {
  await archiveCanonicalAssignment(assignmentId);
}

export async function createAdminMonthlyQuestion(
  adminUserId: string,
  values: MonthlyQuestionValues
) {
  const cleaned = cleanMonthlyQuestion(values);
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("monthly_questions")
    .insert({
      title: cleaned.title,
      opening_reflection: cleaned.openingReflection || null,
      question_text: cleaned.questionText,
      guidance: cleaned.guidance || null,
      discussion_prompts: cleaned.discussionPrompts,
      category: cleaned.category || null,
      theme: cleaned.theme || null,
      question_number: cleaned.questionNumber || null,
      status: "draft",
      created_by: adminUserId,
      updated_by: adminUserId,
      updated_at: now,
    })
    .select(monthlyQuestionSelect)
    .single();

  if (error) throw new Error(`Monthly question could not be created: ${error.message}`);

  return mapMonthlyQuestion(data as MonthlyQuestionRow, new Map(), new Map());
}

export async function updateAdminMonthlyQuestion(
  adminUserId: string,
  questionId: string,
  values: MonthlyQuestionValues
) {
  const cleaned = cleanMonthlyQuestion(values);
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("monthly_questions")
    .update({
      title: cleaned.title,
      opening_reflection: cleaned.openingReflection || null,
      question_text: cleaned.questionText,
      guidance: cleaned.guidance || null,
      discussion_prompts: cleaned.discussionPrompts,
      category: cleaned.category || null,
      theme: cleaned.theme || null,
      question_number: cleaned.questionNumber || null,
      updated_by: adminUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionId)
    .select(monthlyQuestionSelect)
    .single();

  if (error) throw new Error(`Monthly question could not be updated: ${error.message}`);

  const { assignmentCounts, activeAssignmentCounts } =
    await fetchMonthlyQuestionAssignmentCounts([questionId]);

  return mapMonthlyQuestion(
    data as MonthlyQuestionRow,
    assignmentCounts,
    activeAssignmentCounts
  );
}

export async function setAdminMonthlyQuestionStatus(
  adminUserId: string,
  questionId: string,
  status: AdminContentStatus
) {
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("monthly_questions")
    .update({
      status,
      published_at: status === "published" ? now : null,
      updated_by: adminUserId,
      updated_at: now,
    })
    .eq("id", questionId)
    .select(monthlyQuestionSelect)
    .single();

  if (error) throw new Error(`Monthly question status could not be updated: ${error.message}`);

  const { assignmentCounts, activeAssignmentCounts } =
    await fetchMonthlyQuestionAssignmentCounts([questionId]);

  return mapMonthlyQuestion(
    data as MonthlyQuestionRow,
    assignmentCounts,
    activeAssignmentCounts
  );
}

export async function duplicateAdminMonthlyQuestion(
  adminUserId: string,
  questionId: string
) {
  const supabase = createAdminSupabaseClient();
  const { data: source, error: sourceError } = await supabase
    .from("monthly_questions")
    .select(monthlyQuestionSelect)
    .eq("id", questionId)
    .single();

  if (sourceError || !source) {
    throw new Error(sourceError?.message || "Monthly question was not found.");
  }

  const row = source as MonthlyQuestionRow;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("monthly_questions")
    .insert({
      title: `${row.title || "Monthly Question"} Copy`,
      opening_reflection: row.opening_reflection,
      question_text: row.question_text,
      guidance: row.guidance,
      discussion_prompts: normalizeStringArray(row.discussion_prompts),
      category: row.category || null,
      theme: row.theme || null,
      question_number: row.question_number,
      status: "draft",
      created_by: adminUserId,
      updated_by: adminUserId,
      updated_at: now,
    })
    .select(monthlyQuestionSelect)
    .single();

  if (error) throw new Error(`Monthly question could not be duplicated: ${error.message}`);

  return mapMonthlyQuestion(data as MonthlyQuestionRow, new Map(), new Map());
}

export async function deleteAdminMonthlyQuestion(questionId: string) {
  const supabase = createAdminSupabaseClient();
  const { data: question, error: questionError } = await supabase
    .from("monthly_questions")
    .select("content_item_id")
    .eq("id", questionId)
    .maybeSingle();

  if (questionError || !question) {
    throw new Error(questionError?.message || "Monthly question was not found.");
  }

  const { count, error: assignmentError } = await supabase
    .from("content_assignments")
    .select("id", { count: "exact", head: true })
    .eq("content_item_id", question.content_item_id);

  if (assignmentError) {
    throw new Error(`Monthly question assignment status could not be checked: ${assignmentError.message}`);
  }

  if ((count || 0) > 0) {
    throw new Error("Archive this question instead. It has been assigned to at least one Circle.");
  }

  const { error } = await supabase
    .from("monthly_questions")
    .delete()
    .eq("id", questionId);

  if (error) throw new Error(`Monthly question could not be deleted: ${error.message}`);
}

export async function createAdminResource(
  adminUserId: string,
  values: ResourceValues
) {
  const cleaned = cleanResource(values);
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("resources")
    .insert({
      title: cleaned.title,
      description: cleaned.description || null,
      resource_type: cleaned.resourceType,
      provider: cleaned.provider || null,
      external_url: cleaned.externalUrl || null,
      embed_url: cleaned.embedUrl || null,
      storage_path: cleaned.storagePath || null,
      thumbnail_url: cleaned.thumbnailUrl || null,
      cover_image_path: cleaned.coverImagePath || null,
      body_content: cleaned.bodyContent || null,
      file_name: cleaned.fileName || null,
      file_size: cleaned.fileSize,
      mime_type: cleaned.mimeType || null,
      category: cleaned.category || null,
      tags: cleaned.tags,
      status: "draft",
      created_by: adminUserId,
      updated_by: adminUserId,
      updated_at: now,
    })
    .select(resourceSelect)
    .single();

  if (error) throw new Error(`Resource could not be created: ${error.message}`);

  return mapResource(data as ContentResourceRow);
}

export async function updateAdminResource(
  adminUserId: string,
  resourceId: string,
  values: ResourceValues
) {
  const cleaned = cleanResource(values);
  const supabase = createAdminSupabaseClient();
  const { data: existing } = await supabase
    .from("resources")
    .select("storage_path, cover_image_path")
    .eq("id", resourceId)
    .maybeSingle();
  const { data, error } = await supabase
    .from("resources")
    .update({
      title: cleaned.title,
      description: cleaned.description || null,
      resource_type: cleaned.resourceType,
      provider: cleaned.provider || null,
      external_url: cleaned.externalUrl || null,
      embed_url: cleaned.embedUrl || null,
      storage_path: cleaned.storagePath || null,
      thumbnail_url: cleaned.thumbnailUrl || null,
      cover_image_path: cleaned.coverImagePath || null,
      body_content: cleaned.bodyContent || null,
      file_name: cleaned.fileName || null,
      file_size: cleaned.fileSize,
      mime_type: cleaned.mimeType || null,
      category: cleaned.category || null,
      tags: cleaned.tags,
      updated_by: adminUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId)
    .select(resourceSelect)
    .single();

  if (error) throw new Error(`Resource could not be updated: ${error.message}`);

  await cleanupReplacedResourceFiles(
    resourceId,
    existing as { storage_path?: string | null; cover_image_path?: string | null } | null,
    {
      storage_path: cleaned.storagePath || null,
      cover_image_path: cleaned.coverImagePath || null,
    }
  );

  return mapResource(data as ContentResourceRow);
}

export async function setAdminResourceStatus(
  adminUserId: string,
  resourceId: string,
  status: AdminContentStatus
) {
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("resources")
    .update({
      status,
      published_at: status === "published" ? now : null,
      updated_by: adminUserId,
      updated_at: now,
    })
    .eq("id", resourceId)
    .select(resourceSelect)
    .single();

  if (error) throw new Error(`Resource status could not be updated: ${error.message}`);

  return mapResource(data as ContentResourceRow);
}

export async function deleteAdminResource(resourceId: string) {
  const supabase = createAdminSupabaseClient();
  const { data: existing } = await supabase
    .from("resources")
    .select("storage_path, cover_image_path")
    .eq("id", resourceId)
    .maybeSingle();
  const { error } = await supabase.from("resources").delete().eq("id", resourceId);

  if (error) throw new Error(`Resource could not be deleted: ${error.message}`);

  await cleanupDeletedResourceFiles(
    resourceId,
    existing as { storage_path?: string | null; cover_image_path?: string | null } | null
  );
}

export async function createAdminResourceSignedUrl(resourceId: string) {
  const supabase = createAdminSupabaseClient();
  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("storage_path")
    .eq("id", resourceId)
    .single();

  if (resourceError || !resource?.storage_path) {
    throw new Error(resourceError?.message || "Resource file was not found.");
  }

  const { data, error } = await supabase.storage
    .from(resourceStorageBucket)
    .createSignedUrl(resource.storage_path, 60 * 10);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Resource file could not be opened.");
  }

  return data.signedUrl;
}

export async function duplicateAdminResource(adminUserId: string, resourceId: string) {
  const supabase = createAdminSupabaseClient();
  const { data: source, error: sourceError } = await supabase
    .from("resources")
    .select(resourceSelect)
    .eq("id", resourceId)
    .single();

  if (sourceError || !source) throw new Error(sourceError?.message || "Resource was not found.");

  const row = source as ContentResourceRow;
  const { data, error } = await supabase
    .from("resources")
    .insert({
      title: `${row.title || "Resource"} Copy`,
      description: row.description,
      resource_type: row.resource_type,
      provider: row.provider,
      external_url: row.external_url,
      embed_url: row.embed_url,
      storage_path: row.storage_path,
      thumbnail_url: row.thumbnail_url,
      cover_image_path: row.cover_image_path,
      body_content: row.body_content,
      file_name: row.file_name,
      file_size: row.file_size,
      mime_type: row.mime_type,
      category: row.category,
      tags: normalizeStringArray(row.tags),
      status: "draft",
      created_by: adminUserId,
      updated_by: adminUserId,
      updated_at: new Date().toISOString(),
    })
    .select(resourceSelect)
    .single();

  if (error) throw new Error(`Resource could not be duplicated: ${error.message}`);

  return mapResource(data as ContentResourceRow);
}

export async function createAdminTraining(
  adminUserId: string,
  values: TrainingValues
) {
  const cleaned = cleanTraining(values);
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("trainings")
    .insert({
      title: cleaned.title,
      description: cleaned.description || null,
      cover_image_url: cleaned.coverImageUrl || null,
      category: cleaned.category || null,
      estimated_duration: cleaned.estimatedDuration || null,
      status: "draft",
      created_by: adminUserId,
      updated_by: adminUserId,
      updated_at: now,
    })
    .select(trainingSelect)
    .single();

  if (error) throw new Error(`Training could not be created: ${error.message}`);

  return mapTraining(data as TrainingRow);
}

export async function updateAdminTraining(
  adminUserId: string,
  trainingId: string,
  values: TrainingValues
) {
  const cleaned = cleanTraining(values);
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("trainings")
    .update({
      title: cleaned.title,
      description: cleaned.description || null,
      cover_image_url: cleaned.coverImageUrl || null,
      category: cleaned.category || null,
      estimated_duration: cleaned.estimatedDuration || null,
      updated_by: adminUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", trainingId)
    .select(trainingSelect)
    .single();

  if (error) throw new Error(`Training could not be updated: ${error.message}`);

  return mapTraining(data as TrainingRow);
}

export async function setAdminTrainingStatus(
  adminUserId: string,
  trainingId: string,
  status: AdminContentStatus
) {
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("trainings")
    .update({
      status,
      published_at: status === "published" ? now : null,
      updated_by: adminUserId,
      updated_at: now,
    })
    .eq("id", trainingId)
    .select(trainingSelect)
    .single();

  if (error) throw new Error(`Training status could not be updated: ${error.message}`);

  return mapTraining(data as TrainingRow);
}

export async function deleteAdminTraining(trainingId: string) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("trainings").delete().eq("id", trainingId);

  if (error) throw new Error(`Training could not be deleted: ${error.message}`);
}

export async function duplicateAdminTraining(adminUserId: string, trainingId: string) {
  const supabase = createAdminSupabaseClient();
  const { data: source, error: sourceError } = await supabase
    .from("trainings")
    .select(trainingSelect)
    .eq("id", trainingId)
    .single();

  if (sourceError || !source) throw new Error(sourceError?.message || "Training was not found.");

  const row = source as TrainingRow;
  const { data, error } = await supabase
    .from("trainings")
    .insert({
      title: `${row.title || "Training"} Copy`,
      description: row.description,
      cover_image_url: row.cover_image_url,
      category: row.category,
      estimated_duration: row.estimated_duration,
      status: "draft",
      created_by: adminUserId,
      updated_by: adminUserId,
      updated_at: new Date().toISOString(),
    })
    .select(trainingSelect)
    .single();

  if (error) throw new Error(`Training could not be duplicated: ${error.message}`);

  return mapTraining(data as TrainingRow);
}

export async function createAdminCommunication(
  adminUserId: string,
  values: CommunicationValues
) {
  const cleaned = await cleanCommunication(values);
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("communications")
    .insert({
      format: cleaned.format,
      title: cleaned.title,
      subject: cleaned.subject || null,
      preview_text: cleaned.previewText || null,
      summary: cleaned.summary || null,
      body_content: cleaned.bodyContent || null,
      communication_type: cleaned.communicationType,
      channel: cleaned.channel,
      dashboard_presentation: cleaned.dashboardPresentation,
      audience_scope: cleaned.audienceScope,
      sender_id: cleaned.senderId || null,
      reply_to_email: serializeReplyToEmails(cleaned.replyToEmails) || null,
      visible_author_name: cleaned.visibleAuthorName || null,
      header_image_path: cleaned.headerImagePath || null,
      thumbnail_image_path: cleaned.thumbnailImagePath || null,
      image_alt_text: cleaned.imageAltText || null,
      category: cleaned.category || null,
      tags: cleaned.tags,
      visible_from: cleaned.visibleFrom,
      visible_until: cleaned.visibleUntil,
      status: "draft",
      created_by: adminUserId,
      updated_by: adminUserId,
      updated_at: new Date().toISOString(),
    })
    .select(communicationSelect)
    .single();

  if (error) throw new Error(`Communication could not be created: ${error.message}`);

  await syncCommunicationChildren(data.id, cleaned);

  if (cleaned.addToResourceLibrary) {
    await upsertCommunicationResource(adminUserId, data.id, cleaned);
  }

  return mapCommunication(data as CommunicationRow);
}

export async function updateAdminCommunication(
  adminUserId: string,
  communicationId: string,
  values: CommunicationValues
) {
  const cleaned = await cleanCommunication(values);
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("communications")
    .update({
      format: cleaned.format,
      title: cleaned.title,
      subject: cleaned.subject || null,
      preview_text: cleaned.previewText || null,
      summary: cleaned.summary || null,
      body_content: cleaned.bodyContent || null,
      communication_type: cleaned.communicationType,
      channel: cleaned.channel,
      dashboard_presentation: cleaned.dashboardPresentation,
      audience_scope: cleaned.audienceScope,
      sender_id: cleaned.senderId || null,
      reply_to_email: serializeReplyToEmails(cleaned.replyToEmails) || null,
      visible_author_name: cleaned.visibleAuthorName || null,
      header_image_path: cleaned.headerImagePath || null,
      thumbnail_image_path: cleaned.thumbnailImagePath || null,
      image_alt_text: cleaned.imageAltText || null,
      category: cleaned.category || null,
      tags: cleaned.tags,
      visible_from: cleaned.visibleFrom,
      visible_until: cleaned.visibleUntil,
      updated_by: adminUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", communicationId)
    .select(communicationSelect)
    .single();

  if (error) throw new Error(`Communication could not be updated: ${error.message}`);

  await syncCommunicationChildren(communicationId, cleaned);

  if (cleaned.addToResourceLibrary) {
    await upsertCommunicationResource(adminUserId, communicationId, cleaned);
  }

  return mapCommunication(data as CommunicationRow);
}

export async function setAdminCommunicationStatus(
  adminUserId: string,
  communicationId: string,
  status: AdminContentStatus
) {
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("communications")
    .update({
      status,
      published_at: status === "published" ? now : null,
      updated_by: adminUserId,
      updated_at: now,
    })
    .eq("id", communicationId)
    .select(communicationSelect)
    .single();

  if (error) throw new Error(`Communication status could not be updated: ${error.message}`);

  const [portalDelivery, emailDelivery] =
    status === "published"
      ? await Promise.all([
          deliverCommunicationToPortal(communicationId, adminUserId),
          deliverCommunicationEmail(communicationId),
        ])
      : [null, null];

  return {
    ...mapCommunication(data as CommunicationRow),
    portalDelivery,
    emailDelivery,
  };
}

export async function deleteAdminCommunication(communicationId: string) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("communications")
    .delete()
    .eq("id", communicationId);

  if (error) throw new Error(`Communication could not be deleted: ${error.message}`);
}

export async function uploadAdminResourceFile(
  file: File,
  resourceTypeValue: string,
  uploadKind: "primary" | "cover" = "primary"
) {
  const resourceType = parseResourceType(resourceTypeValue);

  if (uploadKind === "cover") {
    validateCoverImageFile(file);

    return uploadResourceStorageFile(file, "cover-images", "cover");
  }

  if (!isUploadedResourceType(resourceType)) {
    throw new Error("Files can only be uploaded for PDFs, images, documents, worksheets, and guides.");
  }

  validateUploadFile(file, resourceType);

  return uploadResourceStorageFile(file, resourceType, "resource");
}

export async function uploadAdminCommunicationImage(
  file: File,
  uploadKind: "header" | "thumbnail"
) {
  validateCoverImageFile(file);

  const supabase = createAdminSupabaseClient();
  const extension = getSafeImageExtension(file.name, file.type);
  const safeBaseName = sanitizeFileBaseName(file.name);
  const storagePath = `${uploadKind}-images/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeBaseName}.${extension}`;
  const { error } = await supabase.storage
    .from(communicationStorageBucket)
    .upload(storagePath, file, {
      contentType: file.type || "image/png",
      upsert: false,
    });

  if (error) throw new Error(`Communication image could not be uploaded: ${error.message}`);

  return {
    storagePath,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || "image/png",
  };
}

async function uploadResourceStorageFile(
  file: File,
  folder: string,
  prefix: string
) {
  const supabase = createAdminSupabaseClient();
  const extension =
    prefix === "cover"
      ? getSafeImageExtension(file.name, file.type)
      : getSafeExtension(file.name, file.type, parseResourceType(folder));
  const safeBaseName = sanitizeFileBaseName(file.name);
  const storagePath = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeBaseName}.${extension}`;
  const { error } = await supabase.storage
    .from(resourceStorageBucket)
    .upload(storagePath, file, {
      contentType: file.type || (prefix === "cover" ? "image/png" : "application/pdf"),
      upsert: false,
    });

  if (error) throw new Error(`Resource file could not be uploaded: ${error.message}`);

  return {
    storagePath,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || (prefix === "cover" ? "image/png" : "application/pdf"),
  };
}

async function cleanupReplacedResourceFiles(
  resourceId: string,
  previous: { storage_path?: string | null; cover_image_path?: string | null } | null,
  next: { storage_path?: string | null; cover_image_path?: string | null }
) {
  const removals = [
    previous?.storage_path && previous.storage_path !== next.storage_path
      ? previous.storage_path
      : "",
    previous?.cover_image_path && previous.cover_image_path !== next.cover_image_path
      ? previous.cover_image_path
      : "",
  ].filter(Boolean);

  await Promise.all(
    removals.map((path) => deleteStoragePathIfUnreferenced(path, resourceId))
  );
}

async function cleanupDeletedResourceFiles(
  resourceId: string,
  previous: { storage_path?: string | null; cover_image_path?: string | null } | null
) {
  const removals = [previous?.storage_path || "", previous?.cover_image_path || ""].filter(
    Boolean
  );

  await Promise.all(
    removals.map((path) => deleteStoragePathIfUnreferenced(path, resourceId))
  );
}

async function deleteStoragePathIfUnreferenced(storagePath: string, exceptResourceId: string) {
  const supabase = createAdminSupabaseClient();
  const { count, error: countError } = await supabase
    .from("resources")
    .select("id", { count: "exact", head: true })
    .or(`storage_path.eq.${storagePath},cover_image_path.eq.${storagePath}`)
    .neq("id", exceptResourceId);

  if (countError) {
    console.warn("Resource storage cleanup reference check failed", countError);
    return;
  }

  if ((count || 0) > 0) return;

  const { error } = await supabase.storage
    .from(resourceStorageBucket)
    .remove([storagePath]);

  if (error) {
    console.warn("Resource storage cleanup failed", error);
  }
}

const resourceSelect =
  "id,content_item_id,title,description,resource_type,provider,external_url,embed_url,storage_path,thumbnail_url,cover_image_path,body_content,source_communication_id,file_name,file_size,mime_type,category,tags,status,published_at,created_at,updated_at";

const trainingSelect =
  "id,content_item_id,title,description,cover_image_url,category,estimated_duration,status,published_at,created_at,updated_at";

const resourceStorageBucket = "peaceworks-resources";
const communicationStorageBucket = "peaceworks-communications";

const communicationSelect =
  "id,format,title,subject,preview_text,summary,body_content,communication_type,channel,dashboard_presentation,audience_scope,sender_id,reply_to_email,visible_author_name,header_image_path,thumbnail_image_path,image_alt_text,category,tags,visible_from,visible_until,status,published_at,created_at,updated_at";

async function fetchMonthlyQuestions() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("monthly_questions")
    .select(monthlyQuestionSelect)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Monthly questions could not be loaded: ${error.message}`);

  const rows = (data || []) as MonthlyQuestionRow[];
  const ids = rows.map((row) => row.id);
  const { assignmentCounts, activeAssignmentCounts } =
    await fetchMonthlyQuestionAssignmentCounts(ids);

  return rows.map((row) =>
    mapMonthlyQuestion(row, assignmentCounts, activeAssignmentCounts)
  );
}

async function fetchResources() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("resources")
    .select(resourceSelect)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Resources could not be loaded: ${error.message}`);

  return Promise.all(((data || []) as ContentResourceRow[]).map(mapResource));
}

async function fetchTrainings() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("trainings")
    .select(trainingSelect)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Training records could not be loaded: ${error.message}`);

  return ((data || []) as TrainingRow[]).map(mapTraining);
}

async function fetchCommunications() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("communications")
    .select(communicationSelect)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Communications could not be loaded: ${error.message}`);

  return Promise.all(((data || []) as CommunicationRow[]).map(mapCommunication));
}

async function fetchContentAssignments() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("content_assignments")
    .select(canonicalAssignmentSelect)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Content assignments could not be loaded: ${error.message}`);

  const rows = await resolveCanonicalAssignmentRows(
    (data || []) as unknown as Parameters<typeof resolveCanonicalAssignmentRows>[0]
  );
  return rows.map(mapContentAssignment);
}

async function fetchMonthlyQuestionAssignmentCounts(questionIds: string[]) {
  const assignmentCounts = new Map<string, number>();
  const activeAssignmentCounts = new Map<string, number>();

  if (questionIds.length === 0) {
    return { assignmentCounts, activeAssignmentCounts };
  }

  const supabase = createAdminSupabaseClient();
  const { data: questions, error: questionError } = await supabase
    .from("monthly_questions")
    .select("id,content_item_id")
    .in("id", questionIds);

  if (questionError) {
    console.warn("Monthly question registry links could not be loaded", questionError);
    return { assignmentCounts, activeAssignmentCounts };
  }

  const questionIdByContentItemId = new Map(
    (questions || []).map((row) => [row.content_item_id, row.id])
  );
  const contentItemIds = Array.from(questionIdByContentItemId.keys());
  if (contentItemIds.length === 0) {
    return { assignmentCounts, activeAssignmentCounts };
  }

  const { data, error } = await supabase
    .from("content_assignments")
    .select("content_item_id,assignment_status")
    .in("content_item_id", contentItemIds);

  if (error) {
    console.warn("Monthly question assignment counts could not be loaded", error);
    return { assignmentCounts, activeAssignmentCounts };
  }

  (data || []).forEach((row) => {
    const questionId = questionIdByContentItemId.get(row.content_item_id) || "";
    if (!questionId) return;

    assignmentCounts.set(questionId, (assignmentCounts.get(questionId) || 0) + 1);

    if (row.assignment_status !== "archived") {
      activeAssignmentCounts.set(
        questionId,
        (activeAssignmentCounts.get(questionId) || 0) + 1
      );
    }
  });

  return { assignmentCounts, activeAssignmentCounts };
}

function mapMonthlyQuestion(
  row: MonthlyQuestionRow,
  assignmentCounts: Map<string, number>,
  activeAssignmentCounts: Map<string, number>
): AdminMonthlyQuestion {
  return {
    id: row.id,
    title: row.title || "Untitled monthly question",
    openingReflection: row.opening_reflection || "",
    questionText: row.question_text || "",
    guidance: row.guidance || "",
    discussionPrompts: normalizeStringArray(row.discussion_prompts),
    status: parseStatus(row.status),
    category: row.category || "",
    theme: row.theme || "",
    questionNumber: row.question_number || "",
    assignedCircleCount: assignmentCounts.get(row.id) || 0,
    currentUseCount: activeAssignmentCounts.get(row.id) || 0,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function mapResource(row: ContentResourceRow): Promise<AdminResource> {
  return {
    id: row.id,
    title: row.title || "Untitled resource",
    description: row.description || "",
    resourceType: parseResourceType(row.resource_type),
    provider: row.provider || "",
    externalUrl: row.external_url || "",
    embedUrl: row.embed_url || "",
    storagePath: row.storage_path || "",
    thumbnailUrl: row.thumbnail_url || "",
    coverImagePath: row.cover_image_path || "",
    coverImageUrl: row.cover_image_path
      ? await createSignedStorageUrl(row.cover_image_path)
      : "",
    bodyContent: row.body_content || "",
    fileName: row.file_name || "",
    fileSize: row.file_size ?? null,
    mimeType: row.mime_type || "",
    category: row.category || "",
    tags: normalizeStringArray(row.tags),
    status: parseStatus(row.status),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTraining(row: TrainingRow): AdminTraining {
  return {
    id: row.id,
    title: row.title || "Untitled training",
    description: row.description || "",
    coverImageUrl: row.cover_image_url || "",
    category: row.category || "",
    estimatedDuration: row.estimated_duration || "",
    status: parseStatus(row.status),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function mapCommunication(row: CommunicationRow): Promise<AdminCommunication> {
  const [links, channels, audienceTargets, newsletterSections, sender, resourceId] =
    await Promise.all([
      fetchCommunicationLinks(row.id),
      fetchCommunicationChannels(row.id),
      fetchCommunicationAudienceTargets(row.id),
      fetchCommunicationNewsletterSections(row.id),
      row.sender_id ? resolveCommunicationSender(row.sender_id) : Promise.resolve(null),
      fetchLinkedResourceId(row.id),
    ]);

  return {
    id: row.id,
    format: parseCommunicationFormat(row.format || row.communication_type),
    title: row.title || "Untitled communication",
    subject: row.subject || "",
    previewText: row.preview_text || "",
    summary: row.summary || "",
    bodyContent: row.body_content || "",
    communicationType: row.communication_type || "announcement",
    channel: row.channel || "dashboard",
    dashboardPresentation: parseDashboardPresentation(row.dashboard_presentation),
    audienceScope: row.audience_scope || "all_members",
    senderId: row.sender_id || "",
    senderName: sender?.displayName || "",
    replyToEmails: parseStoredReplyToEmails(row.reply_to_email || sender?.email || ""),
    visibleAuthorName: row.visible_author_name || "",
    headerImagePath: row.header_image_path || "",
    headerImageUrl: row.header_image_path
      ? await createSignedCommunicationImageUrl(row.header_image_path)
      : "",
    thumbnailImagePath: row.thumbnail_image_path || "",
    thumbnailImageUrl: row.thumbnail_image_path
      ? await createSignedCommunicationImageUrl(row.thumbnail_image_path)
      : "",
    imageAltText: row.image_alt_text || "",
    category: row.category || "",
    tags: normalizeStringArray(row.tags),
    visibleFrom: row.visible_from || null,
    visibleUntil: row.visible_until || null,
    links,
    channels,
    audienceTargets,
    newsletterSections,
    resourceId,
    status: parseStatus(row.status),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContentAssignment(row: ContentAssignmentRow): AdminContentAssignment {
  const contentType = row.content_kind;
  const audienceType = parseAudienceType(row.audience_type);

  return {
    id: row.id,
    contentType,
    contentId: row.source_id,
    audienceType,
    circleId: row.circle_id || "",
    profileId: row.profile_id || "",
    placement: parsePlacement(row.placement, contentType, audienceType),
    assignmentStatus: row.assignment_status === "archived" ? "archived" : "active",
    visibleFrom: row.visible_from,
    visibleUntil: row.visible_until,
    assignedBy: row.assigned_by || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function cleanMonthlyQuestion(values: MonthlyQuestionValues) {
  const title = trimText(values.title).slice(0, 140);
  const questionText = trimText(values.questionText).slice(0, 1200);

  if (!title) throw new Error("A title is required.");
  if (!questionText) throw new Error("A monthly question is required.");
  const questionNumber = trimText(values.questionNumber);
  if (questionNumber.length > 50) {
    throw new Error("Question Number must be 50 characters or fewer.");
  }

  return {
    title,
    openingReflection: trimText(values.openingReflection).slice(0, 3200),
    questionText,
    guidance: trimText(values.guidance).slice(0, 3200),
    discussionPrompts: values.discussionPrompts
      .map((prompt) => trimText(prompt).slice(0, 600))
      .filter(Boolean)
      .slice(0, 10),
    category: trimText(values.category).slice(0, 120),
    theme: trimText(values.theme).slice(0, 120),
    questionNumber,
  };
}

function cleanResource(values: ResourceValues) {
  const title = trimText(values.title).slice(0, 140);
  const resourceType = parseResourceType(values.resourceType);
  const thumbnailUrl = trimText(values.thumbnailUrl).slice(0, 500);
  const storagePath = trimText(values.storagePath).slice(0, 500);
  const coverImagePath = trimText(values.coverImagePath).slice(0, 500);
  const externalUrl = trimText(values.externalUrl);
  const urlInfo = normalizeResourceUrl(resourceType, externalUrl);

  if (!title) throw new Error("A title is required.");

  if (isHostedMediaType(resourceType) && storagePath) {
    throw new Error("Video and audio resources must stay on their original media platform.");
  }

  if (isUploadedResourceType(resourceType) && !storagePath) {
    throw new Error("Upload a file before saving this resource.");
  }

  return {
    title,
    description: trimText(values.description).slice(0, 2000),
    resourceType,
    provider: urlInfo.provider,
    externalUrl: urlInfo.externalUrl,
    embedUrl: urlInfo.embedUrl,
    storagePath: trimText(values.storagePath).slice(0, 500),
    thumbnailUrl,
    coverImagePath,
    bodyContent: trimText(values.bodyContent).slice(0, 12000),
    fileName: trimText(values.fileName).slice(0, 240),
    fileSize: typeof values.fileSize === "number" ? values.fileSize : null,
    mimeType: trimText(values.mimeType).slice(0, 160),
    category: trimText(values.category).slice(0, 120),
    tags: values.tags.map((tag) => trimText(tag).slice(0, 80)).filter(Boolean),
  };
}

function cleanTraining(values: TrainingValues) {
  const title = trimText(values.title).slice(0, 140);

  if (!title) throw new Error("A title is required.");

  return {
    title,
    description: trimText(values.description).slice(0, 2200),
    coverImageUrl: trimText(values.coverImageUrl).slice(0, 500),
    category: trimText(values.category).slice(0, 120),
    estimatedDuration: trimText(values.estimatedDuration).slice(0, 80),
  };
}

async function cleanCommunication(values: CommunicationValues) {
  const format = parseCommunicationFormat(values.format || values.communicationType);
  const title = trimText(values.title).slice(0, 180);
  const subject = trimText(values.subject).slice(0, 180);
  const summary = trimText(values.summary).slice(0, 900);
  const bodyContent = trimText(values.bodyContent).slice(0, 18000);
  const channels = cleanCommunicationChannels(values.channels || [values.channel]);
  const channel = channels.includes("email")
    ? channels.some((item) => item !== "email")
      ? "both"
      : "email"
    : "dashboard";
  const senderId = trimText(values.senderId);
  const sender = senderId ? await resolveCommunicationSender(senderId) : null;
  const needsEmailSender =
    format === "email" || format === "newsletter" || channels.includes("email");

  if (!title) throw new Error("A title is required.");
  if ((format === "email" || format === "newsletter") && !subject) {
    throw new Error("A subject is required for email formats.");
  }
  if (needsEmailSender && !sender) {
    throw new Error("Choose an active sender before preparing email delivery.");
  }
  if (senderId && !sender) {
    throw new Error("The selected sender is not active.");
  }

  const visibleFrom = cleanOptionalDate(values.visibleFrom);
  const visibleUntil = cleanOptionalDate(values.visibleUntil);

  if (visibleFrom && visibleUntil && new Date(visibleUntil) <= new Date(visibleFrom)) {
    throw new Error("Visible until must be after the start date.");
  }

  const headerImagePath = trimText(values.headerImagePath).slice(0, 500);
  const thumbnailImagePath = values.useHeaderAsThumbnail
    ? headerImagePath
    : trimText(values.thumbnailImagePath).slice(0, 500);

  return {
    format,
    title,
    subject,
    previewText: trimText(values.previewText).slice(0, 240),
    summary,
    bodyContent,
    communicationType: format,
    channel: parseCommunicationChannel(channel),
    dashboardPresentation: parseDashboardPresentation(values.dashboardPresentation),
    audienceScope: parseCommunicationAudience(values.audienceScope),
    senderId: sender?.id || "",
    replyToEmails: sender
      ? normalizeReplyToEmails(values.replyToEmails || values.replyToEmail, sender.email)
      : [],
    visibleAuthorName: trimText(values.visibleAuthorName).slice(0, 140),
    headerImagePath,
    thumbnailImagePath,
    imageAltText: trimText(values.imageAltText).slice(0, 500),
    category: trimText(values.category).slice(0, 120),
    tags: (values.tags || []).map((tag) => trimText(tag).slice(0, 80)).filter(Boolean),
    visibleFrom,
    visibleUntil,
    links: cleanCommunicationLinks(values.links || []),
    channels,
    circleIds: Array.from(new Set((values.circleIds || []).filter(Boolean))),
    profileIds: Array.from(new Set((values.profileIds || []).filter(Boolean))),
    newsletterSections: cleanNewsletterSections(values.newsletterSections || []),
    addToResourceLibrary: Boolean(values.addToResourceLibrary),
    resourceTitle: trimText(values.resourceTitle).slice(0, 180) || title,
    resourceSummary: trimText(values.resourceSummary).slice(0, 1200) || summary,
    resourceType: parseResourceType(values.resourceType || "article"),
    resourceCategory: trimText(values.resourceCategory).slice(0, 120),
    resourceTags: (values.resourceTags || values.tags || [])
      .map((tag) => trimText(tag).slice(0, 80))
      .filter(Boolean),
    resourceStatus: parseStatus(values.resourceStatus),
  };
}

async function cleanContentAssignmentInput(input: ContentAssignmentInput) {
  const contentType = parseContentType(input.contentType);
  const audienceType = parseAudienceType(input.audienceType);
  const placement = cleanPlacement(input.placement, contentType, audienceType);
  const visibleFrom = cleanOptionalDate(input.visibleFrom);
  const visibleUntil = cleanOptionalDate(input.visibleUntil);

  if (visibleFrom && visibleUntil && new Date(visibleUntil) <= new Date(visibleFrom)) {
    throw new Error("Visible until must be after the start date.");
  }

  const contentItemId = await assertPublishedContent(contentType, input.contentId);
  if (
    contentType === "monthly_question" &&
    audienceType === "selected_circle"
  ) {
    throw new Error(
      "Assign Monthly Questions to Circles from the Coach portal, where the delivery Month and Year are required."
    );
  }

  const circleIds =
    audienceType === "selected_circle"
      ? await validateCircleTargets(input.circleIds || [])
      : [];
  const profileIds =
    audienceType === "selected_member" || audienceType === "selected_coach"
      ? await validateProfileTargets(input.profileIds || [], audienceType)
      : [];

  return {
    contentType,
    contentId: input.contentId,
    contentItemId,
    audienceType,
    placement,
    circleIds,
    profileIds,
    visibleFrom,
    visibleUntil,
  };
}

function cleanPlacement(
  value: string | null | undefined,
  contentType: AdminContentType,
  audienceType: AdminAudienceType
): AdminPlacement {
  const valid = getValidPlacements(contentType, audienceType);

  if (valid.includes(value as AdminPlacement)) return value as AdminPlacement;

  throw new Error("Choose a valid destination for this content and audience.");
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function parseStatus(status: string | null | undefined): AdminContentStatus {
  if (status === "published" || status === "archived") return status;

  return "draft";
}

function parseCommunicationChannel(value: string | null | undefined) {
  const normalized = trimText(value).toLowerCase();

  if (normalized === "email" || normalized === "both") return normalized;

  return "dashboard";
}

function parseCommunicationFormat(value: string | null | undefined): CommunicationFormat {
  const normalized = trimText(value).toLowerCase();
  const allowed: CommunicationFormat[] = [
    "email",
    "blog_article",
    "announcement",
    "newsletter",
    "dashboard_message",
    "circle_update",
  ];

  return allowed.includes(normalized as CommunicationFormat)
    ? (normalized as CommunicationFormat)
    : "announcement";
}

function parseDashboardPresentation(
  value: string | null | undefined
): DashboardPresentation {
  const normalized = trimText(value).toLowerCase();

  if (normalized === "featured" || normalized === "banner" || normalized === "article") {
    return normalized;
  }

  return "standard";
}

function parseCommunicationAudience(value: string | null | undefined) {
  const normalized = trimText(value).toLowerCase();
  const allowed = [
    "all_members",
    "all_circle_members",
    "all_coaches",
    "selected_circles",
    "selected_members",
    "selected_coaches",
    "admins",
  ];

  return allowed.includes(normalized) ? normalized : "all_members";
}

function cleanCommunicationChannels(values: Array<string | null | undefined>) {
  const allowed: CommunicationChannel[] = [
    "email",
    "my_dashboard",
    "circle_dashboards",
    "coach_dashboards",
    "admin_internal",
    "resource_library",
  ];
  const normalized = values
    .map((value) => trimText(value).toLowerCase())
    .map((value) => (value === "dashboard" ? "my_dashboard" : value))
    .filter((value): value is CommunicationChannel =>
      allowed.includes(value as CommunicationChannel)
    );

  return Array.from(
    new Set<CommunicationChannel>(
      normalized.length > 0 ? normalized : ["my_dashboard"]
    )
  );
}

function cleanCommunicationLinks(
  values: Array<{ label?: string; url?: string; linkStyle?: string; sortOrder?: number }>
) {
  return values
    .map((link, index) => ({
      label: trimText(link.label).slice(0, 120),
      url: trimText(link.url).slice(0, 1000),
      linkStyle: parseCommunicationLinkStyle(link.linkStyle),
      sortOrder: Number.isFinite(link.sortOrder) ? Number(link.sortOrder) : index,
    }))
    .filter((link) => link.label || link.url)
    .map((link) => {
      if (!link.url) throw new Error("Every communication link needs a URL.");
      validateHttpsUrl(link.url);

      return link;
    })
    .slice(0, 10);
}

function parseCommunicationLinkStyle(
  value: string | null | undefined
): CommunicationLink["linkStyle"] {
  const normalized = trimText(value).toLowerCase();

  if (normalized === "button" || normalized === "featured") return normalized;

  return "text";
}

function cleanNewsletterSections(
  values: Array<{ heading?: string; bodyContent?: string; sortOrder?: number }>
) {
  return values
    .map((section, index) => ({
      heading: trimText(section.heading).slice(0, 160),
      bodyContent: trimText(section.bodyContent).slice(0, 4000),
      sortOrder: Number.isFinite(section.sortOrder) ? Number(section.sortOrder) : index,
    }))
    .filter((section) => section.heading || section.bodyContent)
    .slice(0, 12);
}

function validateHttpsUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Communication links must use valid HTTPS URLs.");
  }

  if (url.protocol !== "https:") {
    throw new Error("Communication links must use HTTPS URLs.");
  }
}

async function fetchCommunicationSenders() {
  const senders = await fetchEligibleCommunicationSenders();
  return senders.map((sender) => ({
    ...sender,
    senderType: "person",
  }));
}

async function fetchCommunicationLinks(communicationId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("communication_links")
    .select("id,label,url,link_style,sort_order")
    .eq("communication_id", communicationId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Communication links could not be loaded: ${error.message}`);

  return ((data || []) as CommunicationLinkRow[]).map((row) => ({
    id: row.id,
    label: row.label || "",
    url: row.url || "",
    linkStyle: parseCommunicationLinkStyle(row.link_style),
    sortOrder: row.sort_order ?? 0,
  }));
}

async function fetchCommunicationChannels(communicationId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("communication_channels")
    .select("channel")
    .eq("communication_id", communicationId);

  if (error) throw new Error(`Communication channels could not be loaded: ${error.message}`);

  return cleanCommunicationChannels(
    ((data || []) as CommunicationChannelRow[]).map((row) => row.channel)
  );
}

async function fetchCommunicationAudienceTargets(communicationId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("communication_audience_targets")
    .select("id,audience_type,circle_id,profile_id")
    .eq("communication_id", communicationId);

  if (error) throw new Error(`Communication audiences could not be loaded: ${error.message}`);

  return ((data || []) as CommunicationAudienceTargetRow[]).map((row) => ({
    id: row.id,
    audienceType: row.audience_type || "",
    circleId: row.circle_id || "",
    profileId: row.profile_id || "",
  }));
}

async function fetchCommunicationNewsletterSections(communicationId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("communication_newsletter_sections")
    .select("id,heading,body_content,sort_order")
    .eq("communication_id", communicationId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Newsletter sections could not be loaded: ${error.message}`);
  }

  return ((data || []) as CommunicationNewsletterSectionRow[]).map((row) => ({
    id: row.id,
    heading: row.heading || "",
    bodyContent: row.body_content || "",
    sortOrder: row.sort_order ?? 0,
  }));
}

async function fetchLinkedResourceId(communicationId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("resources")
    .select("id")
    .eq("source_communication_id", communicationId)
    .maybeSingle();

  if (error) {
    console.warn("Linked communication resource could not be loaded", error);
    return "";
  }

  return data?.id || "";
}

async function syncCommunicationChildren(
  communicationId: string,
  input: Awaited<ReturnType<typeof cleanCommunication>>
) {
  const supabase = createAdminSupabaseClient();
  const [validCircleIds, validProfileIds] = await Promise.all([
    input.audienceScope === "selected_circles"
      ? validateCircleTargets(input.circleIds)
      : Promise.resolve([]),
    input.audienceScope === "selected_members" || input.audienceScope === "selected_coaches"
      ? validateProfileTargets(
          input.profileIds,
          input.audienceScope === "selected_coaches" ? "selected_coach" : "selected_member"
        )
      : Promise.resolve([]),
  ]);

  await Promise.all([
    supabase.from("communication_links").delete().eq("communication_id", communicationId),
    supabase.from("communication_channels").delete().eq("communication_id", communicationId),
    supabase.from("communication_audience_targets").delete().eq("communication_id", communicationId),
    supabase.from("communication_newsletter_sections").delete().eq("communication_id", communicationId),
  ]);

  if (input.links.length > 0) {
    const { error } = await supabase.from("communication_links").insert(
      input.links.map((link) => ({
        communication_id: communicationId,
        label: link.label || null,
        url: link.url,
        link_style: link.linkStyle,
        sort_order: link.sortOrder,
      }))
    );

    if (error) throw new Error(`Communication links could not be saved: ${error.message}`);
  }

  if (input.channels.length > 0) {
    const { error } = await supabase.from("communication_channels").insert(
      input.channels.map((channel) => ({
        communication_id: communicationId,
        channel,
        channel_status: "draft",
      }))
    );

    if (error) throw new Error(`Communication channels could not be saved: ${error.message}`);
  }

  const audienceRows: Array<{
    communication_id: string;
    audience_type: string;
    circle_id: string | null;
    profile_id: string | null;
  }> =
    input.audienceScope === "selected_circles"
      ? validCircleIds.map((circleId) => ({
          communication_id: communicationId,
          audience_type: "selected_circle",
          circle_id: circleId,
          profile_id: null,
        }))
      : input.audienceScope === "selected_members" || input.audienceScope === "selected_coaches"
        ? validProfileIds.map((profileId) => ({
            communication_id: communicationId,
            audience_type:
              input.audienceScope === "selected_coaches"
                ? "selected_coach"
                : "selected_member",
            circle_id: null,
            profile_id: profileId,
          }))
        : [
            {
              communication_id: communicationId,
              audience_type: input.audienceScope,
              circle_id: null,
              profile_id: null,
            },
          ];

  if (audienceRows.length > 0) {
    const { error } = await supabase
      .from("communication_audience_targets")
      .insert(audienceRows);

    if (error) throw new Error(`Communication audience could not be saved: ${error.message}`);
  }

  if (input.newsletterSections.length > 0) {
    const { error } = await supabase.from("communication_newsletter_sections").insert(
      input.newsletterSections.map((section) => ({
        communication_id: communicationId,
        heading: section.heading || null,
        body_content: section.bodyContent || null,
        sort_order: section.sortOrder,
      }))
    );

    if (error) throw new Error(`Newsletter sections could not be saved: ${error.message}`);
  }
}

async function upsertCommunicationResource(
  adminUserId: string,
  communicationId: string,
  input: Awaited<ReturnType<typeof cleanCommunication>>
) {
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const row = {
    title: input.resourceTitle,
    description: input.resourceSummary || null,
    resource_type: input.resourceType,
    external_url: null,
    embed_url: null,
    storage_path: null,
    thumbnail_url: null,
    cover_image_path: input.thumbnailImagePath || input.headerImagePath || null,
    body_content: input.bodyContent || null,
    source_communication_id: communicationId,
    file_name: null,
    file_size: null,
    mime_type: null,
    category: input.resourceCategory || input.category || null,
    tags: input.resourceTags,
    status: input.resourceStatus,
    updated_by: adminUserId,
    updated_at: now,
    published_at: input.resourceStatus === "published" ? now : null,
  };
  const { data: existing, error: existingError } = await supabase
    .from("resources")
    .select("id")
    .eq("source_communication_id", communicationId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Linked resource could not be checked: ${existingError.message}`);
  }

  const query = existing?.id
    ? supabase.from("resources").update(row).eq("id", existing.id)
    : supabase.from("resources").insert({
        ...row,
        created_by: adminUserId,
      });
  const { error } = await query;

  if (error) throw new Error(`Linked Resource could not be saved: ${error.message}`);
}

async function createSignedCommunicationImageUrl(storagePath: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.storage
    .from(communicationStorageBucket)
    .createSignedUrl(storagePath, 60 * 60);

  if (error) {
    console.warn("Communication image signed URL could not be created", error);
    return "";
  }

  return data?.signedUrl || "";
}

function parseContentType(value: string | null | undefined): AdminContentType {
  if (value === "resource" || value === "training") return value;

  return "monthly_question";
}

function parseAudienceType(value: string | null | undefined): AdminAudienceType {
  const allowed: AdminAudienceType[] = [
    "coach_library",
    "all_members",
    "all_circle_members",
    "all_coaches",
    "selected_circle",
    "selected_member",
    "selected_coach",
  ];

  return allowed.includes(value as AdminAudienceType)
    ? (value as AdminAudienceType)
    : "coach_library";
}

function parsePlacement(
  value: string | null | undefined,
  contentType: AdminContentType,
  audienceType?: AdminAudienceType
): AdminPlacement {
  const valid = getValidPlacements(contentType, audienceType);

  if (valid.includes(value as AdminPlacement)) return value as AdminPlacement;

  return valid[0];
}

function getValidPlacements(
  contentType: AdminContentType,
  audienceType?: AdminAudienceType
): AdminPlacement[] {
  if (audienceType === "coach_library") {
    return ["coach_dashboard_library"];
  }

  if (audienceType === "selected_circle") {
    if (contentType === "monthly_question") return ["circle_dashboard"];
    if (contentType === "training") return ["trainings_area", "featured_dashboard"];

    return ["resources_area", "featured_dashboard"];
  }

  if (contentType === "monthly_question") {
    return ["my_dashboard", "coach_dashboard_library", "circle_dashboard"];
  }

  if (contentType === "training") {
    return ["my_dashboard", "trainings_area", "featured_dashboard", "coach_dashboard_library"];
  }

  return ["my_dashboard", "resources_area", "featured_dashboard", "coach_dashboard_library"];
}

async function assertPublishedContent(contentType: AdminContentType, contentId: string) {
  const supabase = createAdminSupabaseClient();
  const table =
    contentType === "monthly_question"
      ? "monthly_questions"
      : contentType === "training"
        ? "trainings"
        : "resources";
  const { data, error } = await supabase
    .from(table)
    .select("id,status,content_item_id")
    .eq("id", contentId)
    .maybeSingle();

  if (error) throw new Error(`Content source could not be verified: ${error.message}`);
  if (!data) throw new Error("Content source was not found.");
  if (data.status !== "published") throw new Error("Only published content can be assigned.");
  if (!data.content_item_id) throw new Error("Content source is not registered.");

  return data.content_item_id;
}

async function validateCircleTargets(circleIds: string[]) {
  const uniqueIds = Array.from(new Set(circleIds.filter(Boolean)));

  if (uniqueIds.length === 0) throw new Error("Choose at least one Circle.");

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("circles")
    .select("id,status")
    .in("id", uniqueIds)
    .eq("status", "active");

  if (error) throw new Error(`Circle targets could not be verified: ${error.message}`);

  const validIds = new Set((data || []).map((circle) => circle.id));

  if (validIds.size !== uniqueIds.length) {
    throw new Error("One or more selected Circles are not active.");
  }

  return uniqueIds;
}

async function validateProfileTargets(
  profileIds: string[],
  audienceType: AdminAudienceType
) {
  const uniqueIds = Array.from(new Set(profileIds.filter(Boolean)));

  if (uniqueIds.length === 0) throw new Error("Choose at least one person.");

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,account_status,profile_roles(roles(name))")
    .in("id", uniqueIds);

  if (error) throw new Error(`Profile targets could not be verified: ${error.message}`);

  const activeProfiles = (data || []).filter((profile) => {
    const isActive = !profile.account_status || profile.account_status === "active";
    const isCoach =
      audienceType !== "selected_coach" ||
      hasNestedRole(profile.profile_roles, "coach");

    return isActive && isCoach;
  });

  if (activeProfiles.length !== uniqueIds.length) {
    throw new Error(
      audienceType === "selected_coach"
        ? "One or more selected coaches are not active coach-role profiles."
        : "One or more selected people are not active profiles."
    );
  }

  return uniqueIds;
}

function hasNestedRole(profileRoles: unknown, roleName: string) {
  if (!Array.isArray(profileRoles)) return false;

  return profileRoles.some((profileRole) => {
    if (!profileRole || typeof profileRole !== "object") return false;
    const roles = (profileRole as { roles?: unknown }).roles;

    if (Array.isArray(roles)) {
      return roles.some(
        (role) =>
          role &&
          typeof role === "object" &&
          (role as { name?: unknown }).name === roleName
      );
    }

    return (
      roles &&
      typeof roles === "object" &&
      (roles as { name?: unknown }).name === roleName
    );
  });
}

function cleanOptionalDate(value: string | null | undefined) {
  const trimmed = trimText(value);

  if (!trimmed) return null;

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) throw new Error("Choose a valid visibility date.");

  return date.toISOString();
}

function parseResourceType(value: string | null | undefined): AdminResourceType {
  const normalized = trimText(value).toLowerCase();
  const allowed: AdminResourceType[] = [
    "link",
    "video",
    "audio",
    "pdf",
    "image",
    "document",
    "worksheet",
    "guide",
    "article",
    "blog",
    "reflection",
    "case_study",
    "downloadable_tool",
    "other",
  ];

  return allowed.includes(normalized as AdminResourceType)
    ? (normalized as AdminResourceType)
    : "link";
}

function normalizeResourceUrl(resourceType: AdminResourceType, rawUrl: string) {
  if (isUploadedResourceType(resourceType)) {
    return { provider: "", externalUrl: "", embedUrl: "" };
  }

  if (!rawUrl) {
    if (resourceType === "other" || isWrittenResourceType(resourceType)) {
      return { provider: "", externalUrl: "", embedUrl: "" };
    }

    throw new Error(resourceType === "link" ? "A URL is required." : "A media URL is required.");
  }

  assertNoRawEmbedCode(rawUrl);
  const url = parseHttpsUrl(rawUrl);

  if (resourceType === "video") return normalizeVideoUrl(url);
  if (resourceType === "audio") return normalizeAudioUrl(url);

  return {
    provider: getExternalProvider(url),
    externalUrl: normalizeUrlWithoutTracking(url),
    embedUrl: "",
  };
}

function normalizeVideoUrl(url: URL) {
  const host = normalizeHost(url.hostname);
  const youtubeId = getYoutubeId(url);

  if (youtubeId) {
    return {
      provider: "youtube",
      externalUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    };
  }

  const vimeoId = getVimeoId(url);

  if (vimeoId && (host === "vimeo.com" || host === "player.vimeo.com")) {
    return {
      provider: "vimeo",
      externalUrl: `https://vimeo.com/${vimeoId}`,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  throw new Error("Use a supported YouTube or Vimeo video URL.");
}

function normalizeAudioUrl(url: URL) {
  const host = normalizeHost(url.hostname);

  if (host === "open.spotify.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const mediaType = parts[0] || "";
    const mediaId = parts[1] || "";

    if (!mediaType || !mediaId) {
      throw new Error("Use a valid Spotify media URL.");
    }

    return {
      provider: "spotify",
      externalUrl: `https://open.spotify.com/${mediaType}/${mediaId}`,
      embedUrl: `https://open.spotify.com/embed/${mediaType}/${mediaId}`,
    };
  }

  if (host === "soundcloud.com" || host === "w.soundcloud.com") {
    return {
      provider: "soundcloud",
      externalUrl: normalizeUrlWithoutTracking(url),
      embedUrl: host === "w.soundcloud.com" ? normalizeUrlWithoutTracking(url) : "",
    };
  }

  if (host === "podcasts.apple.com") {
    return {
      provider: "apple_podcasts",
      externalUrl: normalizeUrlWithoutTracking(url),
      embedUrl: "",
    };
  }

  return {
    provider: "external",
    externalUrl: normalizeUrlWithoutTracking(url),
    embedUrl: "",
  };
}

function getYoutubeId(url: URL) {
  const host = normalizeHost(url.hostname);

  if (host === "youtu.be") return cleanMediaId(url.pathname.split("/")[1]);

  if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") return cleanMediaId(url.searchParams.get("v"));

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "shorts" || parts[0] === "embed") return cleanMediaId(parts[1]);
  }

  return "";
}

function getVimeoId(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts[0] === "video") return cleanMediaId(parts[1]);

  return cleanMediaId(parts[0]);
}

function cleanMediaId(value: string | null | undefined) {
  const cleaned = trimText(value).replace(/[^a-zA-Z0-9_-]/g, "");

  return cleaned.slice(0, 80);
}

function assertNoRawEmbedCode(value: string) {
  if (/<\s*iframe/i.test(value) || /<\/?[a-z][\s\S]*>/i.test(value)) {
    throw new Error("Paste the public media URL, not embed code.");
  }
}

function parseHttpsUrl(url: string) {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Enter a valid URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Resource URLs must use HTTPS.");
  }

  return parsed;
}

function normalizeUrlWithoutTracking(url: URL) {
  const normalized = new URL(url.toString());

  [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ].forEach((param) => normalized.searchParams.delete(param));

  normalized.hash = "";

  return normalized.toString();
}

function getExternalProvider(url: URL) {
  const host = normalizeHost(url.hostname);

  if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
  if (host.includes("vimeo.com")) return "vimeo";
  if (host === "open.spotify.com") return "spotify";
  if (host.includes("soundcloud.com")) return "soundcloud";
  if (host === "podcasts.apple.com") return "apple_podcasts";

  return "external";
}

function normalizeHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function isHostedMediaType(resourceType: AdminResourceType) {
  return resourceType === "video" || resourceType === "audio";
}

function isUploadedResourceType(resourceType: AdminResourceType) {
  return (
    resourceType === "pdf" ||
    resourceType === "image" ||
    resourceType === "document" ||
    resourceType === "worksheet" ||
    resourceType === "guide" ||
    resourceType === "downloadable_tool"
  );
}

function isWrittenResourceType(resourceType: AdminResourceType) {
  return (
    resourceType === "article" ||
    resourceType === "blog" ||
    resourceType === "reflection" ||
    resourceType === "case_study"
  );
}

async function createSignedStorageUrl(storagePath: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.storage
    .from(resourceStorageBucket)
    .createSignedUrl(storagePath, 60 * 10);

  if (error || !data?.signedUrl) {
    console.warn("Resource cover image signed URL could not be created", error);
    return "";
  }

  return data.signedUrl;
}

function validateCoverImageFile(file: File) {
  const maxSize = 5 * 1024 * 1024;

  if (file.size <= 0) throw new Error("Choose a non-empty image.");
  if (file.size > maxSize) throw new Error("Cover images must be 5 MB or smaller.");

  getSafeImageExtension(file.name, file.type);
}

function getSafeImageExtension(filename: string, mimeType: string) {
  const extension = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!mimeType || !allowedMimeTypes.includes(mimeType)) {
    throw new Error("Cover images must be JPEG, PNG, or WebP.");
  }

  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error("Cover images must use a supported image extension.");
  }

  return extension === "jpeg" ? "jpg" : extension;
}

function validateUploadFile(file: File, resourceType: AdminResourceType) {
  const maxSize = 15 * 1024 * 1024;

  if (file.size <= 0) throw new Error("Choose a non-empty file.");
  if (file.size > maxSize) throw new Error("Files must be 15 MB or smaller.");

  const extension = getSafeExtension(file.name, file.type, resourceType);
  const allowed = getAllowedUploadTypes(resourceType);
  const mimeType = file.type || getDefaultMimeType(resourceType);

  if (!allowed.extensions.includes(extension) || !allowed.mimeTypes.includes(mimeType)) {
    throw new Error("This file type is not supported for the selected resource.");
  }
}

function getAllowedUploadTypes(resourceType: AdminResourceType) {
  if (resourceType === "pdf") {
    return { extensions: ["pdf"], mimeTypes: ["application/pdf"] };
  }

  if (resourceType === "image") {
    return {
      extensions: ["jpg", "jpeg", "png", "webp"],
      mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    };
  }

  return {
    extensions: ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"],
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  };
}

function getSafeExtension(
  filename: string,
  mimeType: string,
  resourceType: AdminResourceType
) {
  const extension = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  const allowed = getAllowedUploadTypes(resourceType);

  if (extension && allowed.extensions.includes(extension)) return extension;

  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";

  throw new Error("The file extension does not match a supported resource type.");
}

function sanitizeFileBaseName(filename: string) {
  const baseName = filename.replace(/\.[^/.]+$/, "");
  const sanitized = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return sanitized.slice(0, 80) || "resource";
}

function getDefaultMimeType(resourceType: AdminResourceType) {
  if (resourceType === "image") return "image/png";

  return "application/pdf";
}

function trimText(value: string | null | undefined) {
  return (value || "").trim();
}
