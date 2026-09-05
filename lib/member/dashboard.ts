import "server-only";

import { createAdminSupabaseClient } from "../admin/authorization";
import {
  canonicalAssignmentSelect,
  resolveCanonicalAssignmentRows,
  type ResolvedCanonicalAssignment,
} from "../content/assignments";
import {
  normalizeResourceMedia,
  type ResourceMedia,
} from "../resources/media";
import type { MemberAuthResult } from "./authorization";
import { resolveSecondaryIdentityType } from "../peaceAssessmentScoring";
import { createCommunicationImagePreviewUrl } from "../communications/images";

export type DashboardCoach = {
  id: string;
  displayName: string;
  avatarPath: string;
};

export type DashboardCircle = {
  id: string;
  name: string;
  description: string;
  joinedAt: string | null;
  coaches: DashboardCoach[];
};

export type DashboardMonthlyQuestion = {
  id: string;
  assignmentId: string;
  contentItemId: string;
  title: string;
  theme: string;
  question: string;
  openingReflection: string;
  discussionPrompts: string[];
  guidance: string;
  category: string;
  questionNumber: string;
  questionMonth: number | null;
  questionYear: number | null;
  hasReflection: boolean;
  reflectionUpdatedAt: string | null;
  visibleFrom: string | null;
  visibleUntil: string | null;
  placement: string;
  circle: { id: string; name: string } | null;
  coachIntroduction: string | null;
  authorName: string;
};

export type DashboardResource = {
  id: string;
  contentItemId: string;
  title: string;
  description: string;
  resourceType: string;
  media: ResourceMedia;
  thumbnailUrl: string | null;
  coverUrl: string | null;
  tags: string[];
  visibleFrom: string | null;
  visibleUntil: string | null;
  placement: string;
  circle: { id: string; name: string } | null;
  authorName: string;
};

export type DashboardTraining = {
  id: string;
  contentItemId: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  coverUrl: string | null;
  visibleFrom: string | null;
  visibleUntil: string | null;
  placement: string;
  circle: { id: string; name: string } | null;
  authorName: string;
};

export type DashboardPost = {
  id: string;
  title: string;
  excerpt: string;
  format: string;
  authorName: string;
  thumbnailUrl: string;
  publishedAt: string | null;
  circle: { id: string; name: string } | null;
  detailHref: string;
};

export type DashboardPostDetail = DashboardPost & {
  body: string;
  category: string;
  tags: string[];
  headerImageUrl: string;
  imageAltText: string;
};

export type DashboardNoteSource = "circle" | "member";

export type DashboardNoteLink = {
  id: string;
  label: string;
  url: string;
};

export type DashboardNote = {
  id: string;
  noteSource: DashboardNoteSource;
  title: string;
  noteType: string;
  preview: string;
  publishedAt: string | null;
  meetingDate: string | null;
  followUpDate: string | null;
  authorDisplayName: string | null;
  circle: { id: string; name: string } | null;
  links: DashboardNoteLink[];
  detailHref: string;
};

export type MemberVisibleNoteDetail = DashboardNote & {
  body: string;
};

export type MemberVisibleCircleNote = MemberVisibleNoteDetail & {
  noteSource: "circle";
  circle: { id: string; name: string };
};

export type MemberVisibleProfileNote = MemberVisibleNoteDetail & {
  noteSource: "member";
  circle: null;
};

export type MemberNoteDetailResponse = {
  ok: true;
  note: MemberVisibleCircleNote | MemberVisibleProfileNote;
};

export type MemberDashboardResponse = {
  ok: true;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    organization: string;
    jobTitle: string;
    avatarPath: string;
    roles: string[];
  };
  assessment: {
    hasCompletedAssessment: true;
    latestResultId: string;
    completedAt: string | null;
    peaceProfile: string;
    basePattern: string;
    identityType: string;
    secondaryIdentityType: string | null;
    responseType: string;
    processingStyle: string;
    capacityStage: string;
    scores: Record<string, number>;
  } | null;
  circles: DashboardCircle[];
  directCoaches: Array<
    DashboardCoach & {
      isPrimary: boolean;
      assignedAt: string | null;
    }
  >;
  eligibility: {
    hasActiveCircle: boolean;
    isCoach: boolean;
    canAccessCircle: boolean;
    canAccessCoach: boolean;
  };
  sections: {
    monthlyQuestions: DashboardMonthlyQuestion[];
    notes: DashboardNote[];
    resources: DashboardResource[];
    trainings: DashboardTraining[];
    posts: DashboardPost[];
  };
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  organization: string | null;
  job_title: string | null;
  avatar_path: string | null;
};

const audienceRank: Record<string, number> = {
  selected_member: 4,
  selected_circle: 3,
  all_circle_members: 2,
  all_members: 1,
};

export async function fetchMemberDashboard(
  auth: Extract<MemberAuthResult, { ok: true }>
): Promise<MemberDashboardResponse> {
  const supabase = createAdminSupabaseClient();
  const memberId = auth.user.id;
  const now = new Date().toISOString();

  const [
    profileResponse,
    profileRolesResponse,
    membershipsResponse,
    directAssignmentsResponse,
    assessmentResponse,
    assignmentsResponse,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,first_name,last_name,organization,job_title,avatar_path")
      .eq("id", memberId)
      .single(),
    supabase.from("profile_roles").select("role_id").eq("profile_id", memberId),
    supabase
      .from("circle_memberships")
      .select("circle_id,joined_at")
      .eq("profile_id", memberId)
      .eq("status", "active")
      .is("ended_at", null),
    supabase
      .from("coach_assignments")
      .select("coach_id,is_primary,assigned_at")
      .eq("member_id", memberId)
      .eq("status", "active")
      .is("ended_at", null),
    supabase
      .from("peace_assessment_results")
      .select(
        "id,created_at,peace_profile,base_pattern,identity_type,secondary_identity_type,response_type,processing_style,capacity_stage,scores"
      )
      .eq("user_id", memberId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("content_assignments")
      .select(canonicalAssignmentSelect)
      .eq("assignment_status", "active")
      .in("audience_type", [
        "all_members",
        "all_circle_members",
        "selected_member",
        "selected_circle",
      ]),
  ]);

  const firstError = [
    profileResponse.error,
    profileRolesResponse.error,
    membershipsResponse.error,
    directAssignmentsResponse.error,
    assessmentResponse.error,
    assignmentsResponse.error,
  ].find(Boolean);
  if (firstError) throw new Error(`Member dashboard query failed: ${firstError.message}`);

  const profile = profileResponse.data as ProfileRow;
  const roleIds = (profileRolesResponse.data || []).map((row) => row.role_id);
  const circleIds = (membershipsResponse.data || []).map((row) => row.circle_id);
  const directCoachIds = (directAssignmentsResponse.data || []).map(
    (row) => row.coach_id
  );

  const [rolesResponse, circlesResponse, circleCoachesResponse] = await Promise.all([
    roleIds.length
      ? supabase.from("roles").select("id,name").in("id", roleIds)
      : Promise.resolve({ data: [], error: null }),
    circleIds.length
      ? supabase
          .from("circles")
          .select("id,name,description")
          .in("id", circleIds)
          .eq("status", "active")
      : Promise.resolve({ data: [], error: null }),
    circleIds.length
      ? supabase
          .from("circle_coaches")
          .select("circle_id,coach_id")
          .in("circle_id", circleIds)
          .eq("status", "active")
          .is("ended_at", null)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const relationshipError = [
    rolesResponse.error,
    circlesResponse.error,
    circleCoachesResponse.error,
  ].find(Boolean);
  if (relationshipError) {
    throw new Error(`Member relationship query failed: ${relationshipError.message}`);
  }

  const circleCoachIds = (circleCoachesResponse.data || []).map(
    (row) => row.coach_id
  );
  const coachIds = Array.from(new Set([...directCoachIds, ...circleCoachIds]));
  const { data: coachProfiles, error: coachProfileError } = coachIds.length
    ? await supabase
        .from("profiles")
        .select("id,first_name,last_name,avatar_path")
        .in("id", coachIds)
        .eq("account_status", "active")
    : { data: [], error: null };
  if (coachProfileError) {
    throw new Error(`Dashboard coach profiles failed: ${coachProfileError.message}`);
  }

  const coachById = new Map(
    (coachProfiles || []).map((coach) => [
      coach.id,
      {
        id: coach.id,
        displayName: displayName(coach.first_name, coach.last_name),
        avatarPath: coach.avatar_path || "",
      },
    ])
  );
  const circleById = new Map(
    (circlesResponse.data || []).map((circle) => [circle.id, circle])
  );
  const membershipByCircleId = new Map(
    (membershipsResponse.data || []).map((membership) => [
      membership.circle_id,
      membership,
    ])
  );
  const circleCoachIdsByCircle = new Map<string, string[]>();
  (circleCoachesResponse.data || []).forEach((relationship) => {
    const existing = circleCoachIdsByCircle.get(relationship.circle_id) || [];
    circleCoachIdsByCircle.set(relationship.circle_id, [
      ...existing,
      relationship.coach_id,
    ]);
  });

  const circles: DashboardCircle[] = circleIds
    .map((circleId) => {
      const circle = circleById.get(circleId);
      if (!circle) return null;
      return {
        id: circle.id,
        name: circle.name || "",
        description: circle.description || "",
        joinedAt: membershipByCircleId.get(circleId)?.joined_at || null,
        coaches: (circleCoachIdsByCircle.get(circleId) || [])
          .map((coachId) => coachById.get(coachId))
          .filter((coach): coach is DashboardCoach => Boolean(coach)),
      };
    })
    .filter((circle): circle is DashboardCircle => Boolean(circle));

  const resolvedAssignments = await resolveCanonicalAssignmentRows(
    (assignmentsResponse.data || []) as unknown as Parameters<
      typeof resolveCanonicalAssignmentRows
    >[0],
    { missingSource: "skip" }
  );
  const activeCircleIds = new Set(circles.map((circle) => circle.id));
  const matchingAssignments = deduplicateAssignments(
    resolvedAssignments.filter(
      (assignment) =>
        isCurrentlyVisible(assignment, now) &&
        matchesMemberAudience(assignment, memberId, activeCircleIds)
    )
  );
  const circleNames = new Map(circles.map((circle) => [circle.id, circle.name]));
  const roles = (rolesResponse.data || []).map((role) => role.name);
  const [contentSections, notes, posts] = await Promise.all([
    resolveDashboardContent(matchingAssignments, circleNames, memberId),
    fetchMemberVisibleNotes(memberId, activeCircleIds, circleNames),
    fetchMemberVisiblePostsSafely(memberId, roles, activeCircleIds, circleNames, now),
  ]);
  const sections = { ...contentSections, notes, posts };
  const assessment = assessmentResponse.data;

  return {
    ok: true,
    member: {
      id: profile.id,
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      displayName: displayName(profile.first_name, profile.last_name),
      organization: profile.organization || "",
      jobTitle: profile.job_title || "",
      avatarPath: profile.avatar_path || "",
      roles,
    },
    assessment: assessment
      ? buildDashboardAssessment(assessment)
      : null,
    circles,
    directCoaches: (directAssignmentsResponse.data || [])
      .map((relationship) => {
        const coach = coachById.get(relationship.coach_id);
        return coach
          ? {
              ...coach,
              isPrimary: Boolean(relationship.is_primary),
              assignedAt: relationship.assigned_at || null,
            }
          : null;
      })
      .filter(
        (
          coach
        ): coach is DashboardCoach & {
          isPrimary: boolean;
          assignedAt: string | null;
        } => Boolean(coach)
      ),
    eligibility: {
      hasActiveCircle: circles.length > 0,
      isCoach: roles.includes("coach"),
      canAccessCircle: circles.length > 0,
      canAccessCoach: roles.includes("coach"),
    },
    sections,
  };
}

export async function fetchMemberDashboardPostDetail(
  auth: Extract<MemberAuthResult, { ok: true }>,
  communicationId: string
): Promise<DashboardPostDetail | null> {
  const dashboard = await fetchMemberDashboard(auth);
  const post = dashboard.sections.posts.find((item) => item.id === communicationId);
  if (!post) return null;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("communications")
    .select("body_content,summary,category,tags,header_image_path,image_alt_text")
    .eq("id", communicationId)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`Member post detail failed: ${error.message}`);
  if (!data) return null;

  return {
    ...post,
    body: data.body_content || data.summary || "",
    category: data.category || "",
    tags: normalizeStrings(data.tags),
    headerImageUrl: data.header_image_path
      ? await createCommunicationImagePreviewUrl(data.header_image_path)
      : "",
    imageAltText: data.image_alt_text || "",
  };
}

async function fetchMemberVisiblePosts(
  memberId: string,
  roles: string[],
  activeCircleIds: Set<string>,
  circleNames: Map<string, string>,
  now: string
): Promise<DashboardPost[]> {
  const supabase = createAdminSupabaseClient();
  const { data: channels, error: channelError } = await supabase
    .from("communication_channels")
    .select("communication_id")
    .eq("channel", "my_dashboard");
  if (channelError) throw new Error(`Dashboard post channels failed: ${channelError.message}`);
  const communicationIds = Array.from(new Set((channels || []).map((row) => row.communication_id)));
  if (communicationIds.length === 0) return [];

  const [{ data: targets, error: targetError }, { data: communications, error: postError }] =
    await Promise.all([
      supabase
        .from("communication_audience_targets")
        .select("communication_id,audience_type,circle_id,profile_id")
        .in("communication_id", communicationIds),
      supabase
        .from("communications")
        .select(
          "id,title,summary,body_content,format,author_name,visible_author_name,thumbnail_image_path,status,published_at,visible_from,visible_until"
        )
        .in("id", communicationIds)
        .in("format", [
          "email",
          "blog_article",
          "announcement",
          "newsletter",
          "circle_update",
          "dashboard_message",
        ])
        .eq("status", "published"),
    ]);
  if (targetError || postError) {
    throw new Error(`Dashboard posts could not be loaded: ${targetError?.message || postError?.message}`);
  }

  const visibleIds = new Set(
    (targets || [])
      .filter((target) => communicationTargetMatchesMember(target, memberId, roles, activeCircleIds))
      .map((target) => target.communication_id)
  );
  const circleIdByCommunication = new Map(
    (targets || [])
      .filter((target) => target.audience_type === "selected_circle" && target.circle_id)
      .map((target) => [target.communication_id, target.circle_id])
  );

  const visiblePosts = (communications || [])
    .filter(
      (post) =>
        visibleIds.has(post.id) &&
        (!post.visible_from || post.visible_from <= now) &&
        (!post.visible_until || post.visible_until >= now)
    )
  const posts = await Promise.all(visiblePosts.map(async (post) => {
      const circleId = circleIdByCommunication.get(post.id) || "";
      return {
        id: post.id,
        title: post.title || "PeaceWorks update",
        excerpt: excerpt(post.summary || post.body_content || ""),
        format: post.format || "announcement",
        authorName: post.author_name || post.visible_author_name || "",
        thumbnailUrl: post.thumbnail_image_path
          ? await createCommunicationImagePreviewUrl(post.thumbnail_image_path)
          : "",
        publishedAt: post.published_at,
        circle: circleId
          ? { id: circleId, name: circleNames.get(circleId) || "Your Circle" }
          : null,
        detailHref: `/my-dashboard/posts/${post.id}`,
      };
    }));

  return posts.sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));
}

async function fetchMemberVisiblePostsSafely(
  memberId: string,
  roles: string[],
  activeCircleIds: Set<string>,
  circleNames: Map<string, string>,
  now: string
) {
  try {
    return await fetchMemberVisiblePosts(memberId, roles, activeCircleIds, circleNames, now);
  } catch (error) {
    console.error("Optional Circle post aggregation failed", error);
    return [];
  }
}

function communicationTargetMatchesMember(
  target: { audience_type: string; circle_id: string | null; profile_id: string | null },
  memberId: string,
  roles: string[],
  activeCircleIds: Set<string>
) {
  if (target.audience_type === "all_members") return true;
  if (target.audience_type === "all_circle_members") return activeCircleIds.size > 0;
  if (target.audience_type === "all_coaches") return roles.includes("coach");
  if (target.audience_type === "admins") return roles.includes("admin");
  if (target.audience_type === "selected_circle") {
    return Boolean(target.circle_id && activeCircleIds.has(target.circle_id));
  }
  if (target.audience_type === "selected_member" || target.audience_type === "selected_coach") {
    return target.profile_id === memberId;
  }
  return false;
}

function matchesMemberAudience(
  assignment: ResolvedCanonicalAssignment,
  memberId: string,
  activeCircleIds: Set<string>
) {
  if (assignment.audience_type === "all_members") return true;
  if (assignment.audience_type === "all_circle_members") {
    return activeCircleIds.size > 0;
  }
  if (assignment.audience_type === "selected_member") {
    return assignment.profile_id === memberId;
  }
  if (assignment.audience_type === "selected_circle") {
    return Boolean(
      assignment.circle_id && activeCircleIds.has(assignment.circle_id)
    );
  }
  return false;
}

function isCurrentlyVisible(
  assignment: ResolvedCanonicalAssignment,
  now: string
) {
  if (assignment.visible_from && assignment.visible_from > now) return false;
  if (assignment.visible_until && assignment.visible_until < now) return false;
  return true;
}

function deduplicateAssignments(assignments: ResolvedCanonicalAssignment[]) {
  const selected = new Map<string, ResolvedCanonicalAssignment>();
  assignments.forEach((assignment) => {
    const current = selected.get(assignment.content_item_id);
    if (!current || compareAssignments(assignment, current) < 0) {
      selected.set(assignment.content_item_id, assignment);
    }
  });
  return Array.from(selected.values());
}

function compareAssignments(
  first: ResolvedCanonicalAssignment,
  second: ResolvedCanonicalAssignment
) {
  const rankDifference =
    (audienceRank[second.audience_type || ""] || 0) -
    (audienceRank[first.audience_type || ""] || 0);
  if (rankDifference !== 0) return rankDifference;
  return String(second.visible_from || second.created_at || "").localeCompare(
    String(first.visible_from || first.created_at || "")
  );
}

async function resolveDashboardContent(
  assignments: ResolvedCanonicalAssignment[],
  circleNames: Map<string, string>,
  memberId: string
): Promise<Omit<MemberDashboardResponse["sections"], "notes" | "posts">> {
  const supabase = createAdminSupabaseClient();
  const byKind = {
    monthly_question: assignments.filter(
      (assignment) => assignment.content_kind === "monthly_question"
    ),
    resource: assignments.filter(
      (assignment) => assignment.content_kind === "resource"
    ),
    training: assignments.filter(
      (assignment) => assignment.content_kind === "training"
    ),
  };

  const [
    questionsResponse,
    resourcesResponse,
    trainingsResponse,
    reflectionsResponse,
  ] =
    await Promise.all([
      byKind.monthly_question.length
        ? supabase
            .from("monthly_questions")
            .select(
              "id,content_item_id,title,theme,question_text,opening_reflection,discussion_prompts,guidance,category,question_number,author_name,status"
            )
            .in(
              "content_item_id",
              byKind.monthly_question.map((assignment) => assignment.content_item_id)
            )
            .eq("status", "published")
        : Promise.resolve({ data: [], error: null }),
      byKind.resource.length
        ? supabase
            .from("resources")
            .select(
              "id,content_item_id,title,description,resource_type,external_url,storage_path,thumbnail_url,cover_image_path,tags,author_name,status"
            )
            .in(
              "content_item_id",
              byKind.resource.map((assignment) => assignment.content_item_id)
            )
            .eq("status", "published")
        : Promise.resolve({ data: [], error: null }),
      byKind.training.length
        ? supabase
            .from("trainings")
            .select(
              "id,content_item_id,title,description,category,estimated_duration,cover_image_url,author_name,status"
            )
            .in(
              "content_item_id",
              byKind.training.map((assignment) => assignment.content_item_id)
            )
            .eq("status", "published")
        : Promise.resolve({ data: [], error: null }),
      byKind.monthly_question.length
        ? supabase
            .from("monthly_question_reflections")
            .select("content_assignment_id,updated_at")
            .eq("profile_id", memberId)
            .in(
              "content_assignment_id",
              byKind.monthly_question.map((assignment) => assignment.id)
            )
        : Promise.resolve({ data: [], error: null }),
    ]);

  const sourceError = [
    questionsResponse.error,
    resourcesResponse.error,
    trainingsResponse.error,
    reflectionsResponse.error,
  ].find(Boolean);
  if (sourceError) throw new Error(`Dashboard content query failed: ${sourceError.message}`);

  const questionByContentItem = new Map(
    (questionsResponse.data || []).map((row) => [row.content_item_id, row])
  );
  const reflectionByAssignmentId = new Map(
    (reflectionsResponse.data || []).map((row) => [
      row.content_assignment_id,
      row.updated_at,
    ])
  );
  const circleQuestionAssignments = byKind.monthly_question.filter(
    (assignment) =>
      assignment.audience_type === "selected_circle" && assignment.circle_id
  );
  const metadataByTarget = new Map<
    string,
    {
      coachIntroduction: string | null;
      questionMonth: number | null;
      questionYear: number | null;
    }
  >();
  if (circleQuestionAssignments.length) {
    const { data, error } = await supabase
      .from("monthly_question_circle_assignments")
      .select(
        "monthly_question_id,circle_id,coach_introduction,question_month,question_year"
      )
      .in(
        "monthly_question_id",
        circleQuestionAssignments.map((assignment) => assignment.source_id)
      )
      .in(
        "circle_id",
        circleQuestionAssignments.map((assignment) => assignment.circle_id as string)
      );
    if (error) throw new Error(`Monthly Question metadata failed: ${error.message}`);
    (data || []).forEach((row) => {
      metadataByTarget.set(
        `${row.monthly_question_id}:${row.circle_id}`,
        {
          coachIntroduction: row.coach_introduction || null,
          questionMonth: row.question_month ?? null,
          questionYear: row.question_year ?? null,
        }
      );
    });
  }

  const monthlyQuestions = byKind.monthly_question
    .map((assignment) => {
      const row = questionByContentItem.get(assignment.content_item_id);
      if (!row) return null;
      const assignmentMetadata = assignment.circle_id
        ? metadataByTarget.get(`${row.id}:${assignment.circle_id}`)
        : null;
      return {
        id: row.id,
        assignmentId: assignment.id,
        contentItemId: assignment.content_item_id,
        title: row.title || "",
        theme: row.theme || "",
        question: row.question_text || "",
        openingReflection: row.opening_reflection || "",
        discussionPrompts: normalizeStrings(row.discussion_prompts),
        guidance: row.guidance || "",
        category: row.category || "",
        questionNumber: row.question_number || "",
        questionMonth: assignmentMetadata?.questionMonth ?? null,
        questionYear: assignmentMetadata?.questionYear ?? null,
        hasReflection: reflectionByAssignmentId.has(assignment.id),
        reflectionUpdatedAt:
          reflectionByAssignmentId.get(assignment.id) || null,
        visibleFrom: assignment.visible_from,
        visibleUntil: assignment.visible_until,
        placement: assignment.placement || "",
        circle: assignment.circle_id
          ? {
              id: assignment.circle_id,
              name: circleNames.get(assignment.circle_id) || "",
            }
          : null,
        coachIntroduction: assignment.circle_id
          ? assignmentMetadata?.coachIntroduction || null
          : null,
        authorName: row.author_name || "",
      };
    })
    .filter((item): item is DashboardMonthlyQuestion => Boolean(item));

  const resources = await Promise.all(
    byKind.resource.map(async (assignment) => {
      const row = (resourcesResponse.data || []).find(
        (item) => item.content_item_id === assignment.content_item_id
      );
      if (!row) return null;
      const url = await resolveResourceUrl(
        row.external_url,
        row.storage_path
      );
      return {
        id: row.id,
        contentItemId: assignment.content_item_id,
        title: row.title || "",
        description: row.description || "",
        resourceType: row.resource_type || "link",
        media: normalizeResourceMedia(row.resource_type || "link", url),
        thumbnailUrl: row.thumbnail_url || null,
        coverUrl: row.cover_image_path
          ? await createResourceSignedUrl(row.cover_image_path)
          : null,
        tags: normalizeStrings(row.tags),
        visibleFrom: assignment.visible_from,
        visibleUntil: assignment.visible_until,
        placement: assignment.placement || "",
        circle: assignment.circle_id
          ? {
              id: assignment.circle_id,
              name: circleNames.get(assignment.circle_id) || "",
            }
          : null,
        authorName: row.author_name || "",
      };
    })
  );

  const trainingByContentItem = new Map(
    (trainingsResponse.data || []).map((row) => [row.content_item_id, row])
  );
  const trainings = byKind.training
    .map((assignment) => {
      const row = trainingByContentItem.get(assignment.content_item_id);
      if (!row) return null;
      return {
        id: row.id,
        contentItemId: assignment.content_item_id,
        title: row.title || "",
        description: row.description || "",
        category: row.category || "",
        duration: row.estimated_duration || "",
        coverUrl: row.cover_image_url || null,
        visibleFrom: assignment.visible_from,
        visibleUntil: assignment.visible_until,
        placement: assignment.placement || "",
        circle: assignment.circle_id
          ? {
              id: assignment.circle_id,
              name: circleNames.get(assignment.circle_id) || "",
            }
          : null,
        authorName: row.author_name || "",
      };
    })
    .filter((item): item is DashboardTraining => Boolean(item));

  return {
    monthlyQuestions: sortDashboardItems(monthlyQuestions),
    resources: sortDashboardItems(
      resources.filter((item): item is DashboardResource => Boolean(item))
    ),
    trainings: sortDashboardItems(trainings),
  };
}

export async function fetchMemberVisibleNoteDetail(
  auth: Extract<MemberAuthResult, { ok: true }>,
  noteSource: string,
  noteId: string
): Promise<MemberVisibleCircleNote | MemberVisibleProfileNote | null> {
  const supabase = createAdminSupabaseClient();
  const { data: memberships, error } = await supabase
    .from("circle_memberships")
    .select("circle_id")
    .eq("profile_id", auth.user.id)
    .eq("status", "active")
    .is("ended_at", null);
  if (error) throw new Error(`Member note authorization failed: ${error.message}`);

  const circleIds = new Set((memberships || []).map((row) => row.circle_id));
  const { data: circles, error: circleError } = circleIds.size
    ? await supabase
        .from("circles")
        .select("id,name")
        .in("id", Array.from(circleIds))
        .eq("status", "active")
    : { data: [], error: null };
  if (circleError) throw new Error(`Member note Circle lookup failed: ${circleError.message}`);

  const activeCircleIds = new Set((circles || []).map((circle) => circle.id));
  const notes = await fetchMemberVisibleNotes(
    auth.user.id,
    activeCircleIds,
    new Map((circles || []).map((circle) => [circle.id, circle.name || ""])),
    { includeBody: true, noteSource, noteId }
  );
  return (notes[0] as MemberVisibleCircleNote | MemberVisibleProfileNote | undefined) || null;
}

async function fetchMemberVisibleNotes(
  memberId: string,
  activeCircleIds: Set<string>,
  circleNames: Map<string, string>,
  options?: { includeBody?: boolean; noteSource?: string; noteId?: string }
): Promise<Array<DashboardNote | MemberVisibleCircleNote | MemberVisibleProfileNote>> {
  const supabase = createAdminSupabaseClient();
  const circleIds = Array.from(activeCircleIds);
  const includeCircle = !options?.noteSource || options.noteSource === "circle";
  const includeProfile = !options?.noteSource || options.noteSource === "member";

  const [circleResponse, profileResponse] = await Promise.all([
    includeCircle && circleIds.length
      ? supabase
          .from("circle_notes")
          .select(
            "id,circle_id,author_id,note_type,body,visibility,audience_type,meeting_date,follow_up_at,published_at,created_at,updated_at"
          )
          .in("circle_id", circleIds)
          .in("audience_type", ["all_circle_members", "selected_members"])
          .not("published_at", "is", null)
          .eq(options?.noteId ? "id" : "visibility", options?.noteId || "coaches")
      : Promise.resolve({ data: [], error: null }),
    includeProfile
      ? supabase
          .from("profile_notes")
          .select("id,profile_id,author_id,note_type,body,visibility,created_at,updated_at")
          .eq("profile_id", memberId)
          .eq("visibility", "member")
          .eq(options?.noteId ? "id" : "profile_id", options?.noteId || memberId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const firstError = circleResponse.error || profileResponse.error;
  if (firstError) throw new Error(`Member-visible notes query failed: ${firstError.message}`);

  const circleRows = circleResponse.data || [];
  const selectedIds = circleRows
    .filter((row) => row.audience_type === "selected_members")
    .map((row) => row.id);
  const noteIds = circleRows.map((row) => row.id);
  const authorIds = Array.from(
    new Set(
      [...circleRows, ...(profileResponse.data || [])]
        .map((row) => row.author_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const [recipientsResponse, linksResponse, authorsResponse] = await Promise.all([
    selectedIds.length
      ? supabase
          .from("circle_note_recipients")
          .select("circle_note_id")
          .in("circle_note_id", selectedIds)
          .eq("profile_id", memberId)
      : Promise.resolve({ data: [], error: null }),
    noteIds.length
      ? supabase
          .from("circle_note_links")
          .select("id,circle_note_id,label,url,sort_order")
          .in("circle_note_id", noteIds)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    authorIds.length
      ? supabase.from("profiles").select("id,first_name,last_name").in("id", authorIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const relatedError =
    recipientsResponse.error || linksResponse.error || authorsResponse.error;
  if (relatedError) throw new Error(`Member-visible note details failed: ${relatedError.message}`);

  const permittedSelectedIds = new Set(
    (recipientsResponse.data || []).map((row) => row.circle_note_id)
  );
  const linksByNote = new Map<string, DashboardNoteLink[]>();
  (linksResponse.data || []).forEach((row) => {
    const current = linksByNote.get(row.circle_note_id) || [];
    current.push({ id: row.id, label: row.label || "Open link", url: row.url });
    linksByNote.set(row.circle_note_id, current);
  });
  const authorById = new Map(
    (authorsResponse.data || []).map((row) => [
      row.id,
      displayName(row.first_name, row.last_name),
    ])
  );

  const circleNotes = circleRows
    .filter(
      (row) =>
        row.visibility === "coaches" &&
        (row.audience_type === "all_circle_members" ||
          permittedSelectedIds.has(row.id))
    )
    .map((row) => {
      const body = row.body || "";
      return {
        id: row.id,
        noteSource: "circle" as const,
        title: noteTitle(row.note_type, circleNames.get(row.circle_id)),
        noteType: row.note_type || "general",
        preview: notePreview(body),
        publishedAt: row.published_at,
        meetingDate: row.meeting_date,
        followUpDate: row.follow_up_at,
        authorDisplayName: row.author_id ? authorById.get(row.author_id) || null : null,
        circle: { id: row.circle_id, name: circleNames.get(row.circle_id) || "Your Circle" },
        links: linksByNote.get(row.id) || [],
        detailHref: `/my-dashboard/notes/circle/${row.id}`,
        ...(options?.includeBody ? { body } : {}),
        sortDate: row.published_at || row.meeting_date || row.created_at || "",
      };
    });
  const profileNotes = (profileResponse.data || []).map((row) => {
    const body = row.body || "";
    return {
      id: row.id,
      noteSource: "member" as const,
      title: noteTitle(row.note_type),
      noteType: row.note_type || "general",
      preview: notePreview(body),
      publishedAt: row.updated_at || row.created_at,
      meetingDate: null,
      followUpDate: null,
      authorDisplayName: row.author_id ? authorById.get(row.author_id) || null : null,
      circle: null,
      links: [],
      detailHref: `/my-dashboard/notes/member/${row.id}`,
      ...(options?.includeBody ? { body } : {}),
      sortDate: row.updated_at || row.created_at || "",
    };
  });

  return [...circleNotes, ...profileNotes]
    .sort(
      (first, second) =>
        second.sortDate.localeCompare(first.sortDate) ||
        first.noteSource.localeCompare(second.noteSource) ||
        first.id.localeCompare(second.id)
    )
    .map(({ sortDate, ...note }) => {
      void sortDate;
      return note;
    });
}

function notePreview(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim();
  return normalized.length > 180 ? `${normalized.slice(0, 177).trimEnd()}...` : normalized;
}

function noteTitle(noteType: string | null, context?: string) {
  const label = (noteType || "general")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return context ? `${label} · ${context}` : label;
}

async function createResourceSignedUrl(path: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.storage
    .from("peaceworks-resources")
    .createSignedUrl(path, 60 * 10);
  if (error) {
    console.warn("Member dashboard resource URL could not be signed", error);
    return null;
  }
  return data.signedUrl;
}

async function resolveResourceUrl(
  externalUrl: string | null,
  storagePath: string | null
) {
  if (externalUrl) return externalUrl;
  if (!storagePath) return null;
  return createResourceSignedUrl(storagePath);
}

function sortDashboardItems<
  T extends {
    placement: string;
    visibleFrom: string | null;
    title: string;
    id: string;
  },
>(items: T[]) {
  return items.sort(
    (first, second) =>
      first.placement.localeCompare(second.placement) ||
      String(second.visibleFrom || "").localeCompare(
        String(first.visibleFrom || "")
      ) ||
      first.title.localeCompare(second.title) ||
      first.id.localeCompare(second.id)
  );
}

function displayName(firstName: string | null, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "PeaceWorks Member";
}

function normalizeStrings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function excerpt(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > 220 ? `${text.slice(0, 217).trimEnd()}...` : text;
}

function buildDashboardAssessment(assessment: {
  id: string;
  created_at: string | null;
  peace_profile: string | null;
  base_pattern: string | null;
  identity_type: string | null;
  secondary_identity_type: string | null;
  response_type: string | null;
  processing_style: string | null;
  capacity_stage: string | null;
  scores: unknown;
}): NonNullable<MemberDashboardResponse["assessment"]> {
  const scores = normalizeScores(assessment.scores);
  const secondaryIdentityType = resolveSecondaryIdentityType(
    scores,
    assessment.identity_type,
    assessment.secondary_identity_type
  );

  if (!secondaryIdentityType) {
    console.error("Dashboard assessment has no resolvable secondary identity", {
      assessmentId: assessment.id,
    });
  }

  return {
    hasCompletedAssessment: true,
    latestResultId: assessment.id,
    completedAt: assessment.created_at,
    peaceProfile: assessment.peace_profile || "",
    basePattern: assessment.base_pattern || "",
    identityType: assessment.identity_type || "",
    secondaryIdentityType,
    responseType: assessment.response_type || "",
    processingStyle: assessment.processing_style || "",
    capacityStage: assessment.capacity_stage || "",
    scores,
  };
}

function normalizeScores(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, score]) => Number.isFinite(Number(score)))
      .map(([key, score]) => [key, Number(score)])
  );
}
