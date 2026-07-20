import { createClient, type User } from "@supabase/supabase-js";

import {
  createAdminSupabaseClient,
  isAdminEmail,
} from "../admin/authorization";
import {
  fetchAdminUsersData,
  type AdminManagedProfile,
  type AdminUsersPayload,
} from "../admin/userManagement";
import {
  archiveCanonicalCircleMonthlyQuestion,
  canonicalAssignmentSelect,
  deleteCanonicalCircleMonthlyQuestion,
  resolveCanonicalAssignmentRows,
  upsertMonthlyQuestionAssignmentMetadata,
  upsertCanonicalCircleMonthlyQuestion,
} from "../content/assignments";
import type { ResolvedCanonicalAssignment } from "../content/assignments";
import { parseMonthlyQuestionPeriod } from "../monthlyQuestionPeriod";
import {
  type CoachAuthResult,
  type CoachPersonSummary,
} from "./dashboard";

export type MonthlyQuestionStatus = "draft" | "published" | "archived";

export type CoachMonthlyQuestion = {
  id: string;
  title: string;
  openingReflection: string;
  questionText: string;
  guidance: string;
  discussionPrompts: string[];
  category: string;
  theme: string;
  questionNumber: string;
  status: MonthlyQuestionStatus;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  author: CoachPersonSummary;
  assignedCircles: CoachMonthlyQuestionCircle[];
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canArchive: boolean;
  canDuplicate: boolean;
};

export type CoachMonthlyQuestionAssignment = {
  id: string;
  circle: CoachMonthlyQuestionCircle;
  question: CoachMonthlyQuestion;
  assignmentStatus: "active" | "archived";
  assignedAt: string | null;
  visibleFrom: string | null;
  archivedAt: string | null;
  coachIntroduction: string;
  questionMonth: number | null;
  questionYear: number | null;
  assignedBy: CoachPersonSummary;
  canArchive: boolean;
  canRemove: boolean;
};

export type CoachMonthlyQuestionCircle = {
  id: string;
  name: string;
  status: string;
};

export type CoachMonthlyQuestionsPayload = {
  ok: true;
  circles: CoachMonthlyQuestionCircle[];
  questions: CoachMonthlyQuestion[];
  assignments: CoachMonthlyQuestionAssignment[];
  currentByCircle: Array<{
    circle: CoachMonthlyQuestionCircle;
    assignment: CoachMonthlyQuestionAssignment | null;
  }>;
};

export type CoachMonthlyQuestionAssignmentInput = {
  questionId: string;
  circleIds: string[];
  coachIntroduction: string;
  questionMonth: number | string | null;
  questionYear: number | string | null;
};

export type CoachMonthlyQuestionInput = {
  title: string;
  openingReflection: string;
  questionText: string;
  guidance: string;
  discussionPrompts: string[];
  circleIds: string[];
  questionNumber?: string | null;
};

export type MemberMonthlyQuestion = {
  id: string;
  circle: CoachMonthlyQuestionCircle;
  title: string;
  openingReflection: string;
  questionText: string;
  guidance: string;
  discussionPrompts: string[];
  questionNumber: string;
  questionMonth: number | null;
  questionYear: number | null;
  status: "published" | "archived";
  publishedAt: string | null;
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
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type MonthlyQuestionAssignmentRow = {
  id?: string;
  monthly_question_id: string;
  circle_id: string;
  assigned_by?: string | null;
  assigned_at?: string | null;
  created_at?: string | null;
  assignment_status?: string | null;
  visible_from?: string | null;
  archived_at?: string | null;
  coach_introduction?: string | null;
  question_month?: number | null;
  question_year?: number | null;
};

type ContentAssignmentRow = ResolvedCanonicalAssignment;

type MonthlyQuestionContext = {
  usersPayload: AdminUsersPayload;
  authorizedCircleIds: Set<string>;
  authorizedCircles: CoachMonthlyQuestionCircle[];
};

const maxTitleLength = 120;
const maxReflectionLength = 2600;
const maxQuestionLength = 900;
const maxGuidanceLength = 2600;
const maxPromptLength = 500;
const maxPromptCount = 8;

export async function fetchCoachMonthlyQuestions(
  auth: Extract<CoachAuthResult, { ok: true }>
): Promise<CoachMonthlyQuestionsPayload> {
  const context = await loadMonthlyQuestionContext(auth);
  const { rows, assignmentRows, contentAssignmentRows } =
    await fetchMonthlyQuestionRows();
  const coachLibraryQuestionIds = getCoachLibraryQuestionIds(contentAssignmentRows);
  const hasAdminAvailabilityAssignments = contentAssignmentRows.some(
    (assignment) => assignment.content_kind === "monthly_question"
  );
  const allAssignmentRows = mergeMonthlyQuestionAssignmentRows(
    assignmentRows,
    contentAssignmentRows,
    context
  );
  const assignments = buildAssignmentMap(allAssignmentRows);
  const questions = rows
    .filter((row) => {
      if (parseStatus(row.status) !== "published") return false;
      if (!hasAdminAvailabilityAssignments) return true;
      return coachLibraryQuestionIds.has(row.id);
    })
    .map((row) => mapCoachMonthlyQuestion(row, assignments, auth, context))
    .sort(sortQuestions);
  const assignmentItems = mapCoachMonthlyQuestionAssignments(
    rows,
    allAssignmentRows,
    assignments,
    auth,
    context
  );

  return {
    ok: true,
    circles: context.authorizedCircles,
    questions,
    assignments: assignmentItems,
    currentByCircle: context.authorizedCircles.map((circle) => ({
      circle,
      assignment: getCurrentAssignmentForCircle(circle.id, assignmentItems),
    })),
  };
}

export async function createCoachMonthlyQuestion(
  auth: Extract<CoachAuthResult, { ok: true }>,
  values: CoachMonthlyQuestionInput
) {
  const context = await loadMonthlyQuestionContext(auth);
  const cleaned = cleanMonthlyQuestionInput(values, context, false);

  if (!cleaned.ok) return cleaned;

  const supabase = createAdminSupabaseClient();
  const timestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from("monthly_questions")
    .insert({
      title: cleaned.title || null,
      opening_reflection: cleaned.openingReflection || null,
      question_text: cleaned.questionText,
      guidance: cleaned.guidance || null,
      discussion_prompts: cleaned.discussionPrompts,
      question_number: cleaned.questionNumber || null,
      status: "draft",
      created_by: auth.user.id,
      updated_by: auth.user.id,
      updated_at: timestamp,
    })
    .select(monthlyQuestionSelect)
    .single();

  if (error) return monthlyQuestionDatabaseFailure("monthly_question_create_failed", error);

  const assignmentResult = await syncMonthlyQuestionAssignments(
    data.id,
    cleaned.circleIds,
    auth.user.id
  );

  if (!assignmentResult.ok) {
    await supabase.from("monthly_questions").delete().eq("id", data.id);
    return assignmentResult;
  }

  return {
    ok: true as const,
    message: "Monthly question draft was saved.",
    question: mapCoachMonthlyQuestion(
      data as MonthlyQuestionRow,
      new Map([[data.id, cleaned.circleIds]]),
      auth,
      context
    ),
  };
}

export async function updateCoachMonthlyQuestion(
  auth: Extract<CoachAuthResult, { ok: true }>,
  questionId: string,
  values: CoachMonthlyQuestionInput
) {
  const context = await loadMonthlyQuestionContext(auth);
  const existing = await fetchMonthlyQuestionRow(questionId);

  if (!existing) return notFoundResult();

  const currentAssignments = await fetchAssignmentMap([questionId]);

  if (!canManageQuestion(auth, existing, currentAssignments, context)) {
    return notFoundResult();
  }

  const cleaned = cleanMonthlyQuestionInput(
    values,
    context,
    parseStatus(existing.status) === "published"
  );

  if (!cleaned.ok) return cleaned;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("monthly_questions")
    .update({
      title: cleaned.title || null,
      opening_reflection: cleaned.openingReflection || null,
      question_text: cleaned.questionText,
      guidance: cleaned.guidance || null,
      discussion_prompts: cleaned.discussionPrompts,
      question_number: cleaned.questionNumber || null,
      updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionId)
    .select(monthlyQuestionSelect)
    .single();

  if (error) return monthlyQuestionDatabaseFailure("monthly_question_update_failed", error);

  const assignmentResult = await syncMonthlyQuestionAssignments(
    questionId,
    cleaned.circleIds,
    auth.user.id
  );

  if (!assignmentResult.ok) return assignmentResult;

  return {
    ok: true as const,
    message:
      parseStatus(existing.status) === "published"
        ? "Published question was updated."
        : "Monthly question draft was updated.",
    question: mapCoachMonthlyQuestion(
      data as MonthlyQuestionRow,
      new Map([[questionId, cleaned.circleIds]]),
      auth,
      context
    ),
  };
}

export async function publishCoachMonthlyQuestion(
  auth: Extract<CoachAuthResult, { ok: true }>,
  questionId: string
) {
  const context = await loadMonthlyQuestionContext(auth);
  const existing = await fetchMonthlyQuestionRow(questionId);

  if (!existing) return notFoundResult();

  const assignments = await fetchAssignmentMap([questionId]);

  if (!canManageQuestion(auth, existing, assignments, context)) return notFoundResult();
  if (parseStatus(existing.status) === "archived") {
    return validationResult("Archived questions cannot be republished in this phase.");
  }

  const circleIds = assignments.get(questionId) || [];

  if (circleIds.length === 0) {
    return validationResult("Assign at least one Circle before publishing.");
  }

  const invalidCircleId = circleIds.find((circleId) => !context.authorizedCircleIds.has(circleId));

  if (invalidCircleId) {
    return validationResult("One assigned Circle is not available to you.");
  }

  const supabase = createAdminSupabaseClient();
  const timestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from("monthly_questions")
    .update({
      status: "published",
      published_at: existing.published_at || timestamp,
      updated_by: auth.user.id,
      updated_at: timestamp,
    })
    .eq("id", questionId)
    .select(monthlyQuestionSelect)
    .single();

  if (error) return monthlyQuestionDatabaseFailure("monthly_question_publish_failed", error);

  return {
    ok: true as const,
    message: "Monthly question was published to the selected Circles.",
    question: mapCoachMonthlyQuestion(data as MonthlyQuestionRow, assignments, auth, context),
  };
}

export async function archiveCoachMonthlyQuestion(
  auth: Extract<CoachAuthResult, { ok: true }>,
  questionId: string
) {
  const context = await loadMonthlyQuestionContext(auth);
  const existing = await fetchMonthlyQuestionRow(questionId);

  if (!existing) return notFoundResult();

  const assignments = await fetchAssignmentMap([questionId]);

  if (!canManageQuestion(auth, existing, assignments, context)) return notFoundResult();
  if (parseStatus(existing.status) !== "published") {
    return validationResult("Only published questions can be archived.");
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("monthly_questions")
    .update({
      status: "archived",
      updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionId)
    .select(monthlyQuestionSelect)
    .single();

  if (error) return monthlyQuestionDatabaseFailure("monthly_question_archive_failed", error);

  return {
    ok: true as const,
    message: "Monthly question was archived.",
    question: mapCoachMonthlyQuestion(data as MonthlyQuestionRow, assignments, auth, context),
  };
}

export async function duplicateCoachMonthlyQuestion(
  auth: Extract<CoachAuthResult, { ok: true }>,
  questionId: string
) {
  const context = await loadMonthlyQuestionContext(auth);
  const existing = await fetchMonthlyQuestionRow(questionId);

  if (!existing) return notFoundResult();

  const assignments = await fetchAssignmentMap([questionId]);

  if (!canViewQuestion(auth, existing, assignments, context)) return notFoundResult();

  return createCoachMonthlyQuestion(auth, {
    title: existing.title ? `${existing.title} Copy` : "",
    openingReflection: existing.opening_reflection || "",
    questionText: existing.question_text || "",
    guidance: existing.guidance || "",
    discussionPrompts: parseDiscussionPrompts(existing.discussion_prompts),
    circleIds: (assignments.get(questionId) || []).filter((circleId) =>
      context.authorizedCircleIds.has(circleId)
    ),
    questionNumber: existing.question_number || "",
  });
}

export async function deleteCoachMonthlyQuestion(
  auth: Extract<CoachAuthResult, { ok: true }>,
  questionId: string
) {
  const context = await loadMonthlyQuestionContext(auth);
  const existing = await fetchMonthlyQuestionRow(questionId);

  if (!existing) return notFoundResult();

  const assignments = await fetchAssignmentMap([questionId]);

  if (!canDeleteQuestion(auth, existing, assignments, context)) return notFoundResult();

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("monthly_questions")
    .delete()
    .eq("id", questionId);

  if (error) return monthlyQuestionDatabaseFailure("monthly_question_delete_failed", error);

  return { ok: true as const, message: "Monthly question was permanently deleted." };
}

export async function assignCoachMonthlyQuestion(
  auth: Extract<CoachAuthResult, { ok: true }>,
  values: CoachMonthlyQuestionAssignmentInput
) {
  const context = await loadMonthlyQuestionContext(auth);
  const question = await fetchMonthlyQuestionRow(values.questionId);

  if (!question || parseStatus(question.status) !== "published") {
    return notFoundResult();
  }
  let period;
  try {
    period = parseMonthlyQuestionPeriod(
      values.questionMonth,
      values.questionYear,
      { required: true }
    );
  } catch (error) {
    return validationResult(
      error instanceof Error ? error.message : "Choose a Month and Year."
    );
  }

  const circleIds = unique(
    (Array.isArray(values.circleIds) ? values.circleIds : [])
      .filter((circleId): circleId is string => typeof circleId === "string")
      .map((circleId) => circleId.trim())
      .filter(Boolean)
  );
  const invalidCircleId = circleIds.find((circleId) => !context.authorizedCircleIds.has(circleId));

  if (circleIds.length === 0) return validationResult("Select at least one Circle.");
  if (invalidCircleId) return validationResult("One selected Circle is not available to you.");

  const timestamp = new Date().toISOString();
  try {
    await Promise.all(
      circleIds.map((circleId) =>
        upsertCanonicalCircleMonthlyQuestion({
          contentItemId: question.content_item_id,
          circleId,
          assignedBy: auth.user.id,
          visibleFrom: timestamp,
        })
      )
    );

    await upsertMonthlyQuestionAssignmentMetadata({
      questionId: question.id,
      circleIds,
      assignedBy: auth.user.id,
      visibleFrom: timestamp,
      coachIntroduction: cleanText(values.coachIntroduction, 1200) || null,
      questionMonth: period.month,
      questionYear: period.year,
    });
  } catch (error) {
    return monthlyQuestionDatabaseFailure("monthly_question_assignment_save_failed", error);
  }

  return {
    ok: true as const,
    message:
      "Monthly Question assigned to Circle. This will appear on the dashboards of active members in the selected Circle.",
  };
}

export async function archiveCoachMonthlyQuestionAssignment(
  auth: Extract<CoachAuthResult, { ok: true }>,
  circleId: string,
  assignmentId: string
) {
  const context = await loadMonthlyQuestionContext(auth);
  if (!context.authorizedCircleIds.has(circleId)) return notFoundResult();

  const assignment = await fetchAssignmentRow(assignmentId, circleId);
  if (!assignment) return notFoundResult();

  const question = await fetchMonthlyQuestionRow(assignment.monthly_question_id);
  if (!question) return notFoundResult();

  try {
    await archiveCanonicalCircleMonthlyQuestion(question.content_item_id, circleId);
  } catch (error) {
    return monthlyQuestionDatabaseFailure("monthly_question_assignment_archive_failed", error);
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("monthly_question_circle_assignments")
    .update({
      assignment_status: "archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", assignmentId)
    .eq("circle_id", circleId);

  if (error) return monthlyQuestionDatabaseFailure("monthly_question_assignment_archive_failed", error);

  return { ok: true as const, message: "Monthly Question archived from this Circle." };
}

export async function removeCoachMonthlyQuestionAssignment(
  auth: Extract<CoachAuthResult, { ok: true }>,
  circleId: string,
  assignmentId: string
) {
  const context = await loadMonthlyQuestionContext(auth);
  if (!context.authorizedCircleIds.has(circleId)) return notFoundResult();

  const assignment = await fetchAssignmentRow(assignmentId, circleId);
  if (!assignment) return notFoundResult();

  const question = await fetchMonthlyQuestionRow(assignment.monthly_question_id);
  if (!question) return notFoundResult();

  try {
    await deleteCanonicalCircleMonthlyQuestion(question.content_item_id, circleId);
  } catch (error) {
    return monthlyQuestionDatabaseFailure("monthly_question_assignment_remove_failed", error);
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("monthly_question_circle_assignments")
    .delete()
    .eq("id", assignmentId)
    .eq("circle_id", circleId);

  if (error) return monthlyQuestionDatabaseFailure("monthly_question_assignment_remove_failed", error);

  return { ok: true as const, message: "Monthly Question assignment was removed." };
}

export async function fetchMemberMonthlyQuestions(request: Request) {
  const member = await requireMemberFromRequest(request);

  if (!member.ok) return member;

  const usersPayload = await fetchAdminUsersData(member.user.id);
  const profile = usersPayload.users.find((user) => user.id === member.user.id);

  if (!profile || profile.accountStatus !== "active") {
    return {
      ok: false as const,
      status: 403,
      code: "member_profile_required",
      message: "An active profile is required.",
    };
  }

  const activeCircleIds = new Set(
    usersPayload.circles
      .filter((circle) => circle.status === "active" && circle.memberIds.includes(member.user.id))
      .map((circle) => circle.id)
  );

  if (activeCircleIds.size === 0) {
    return { ok: true as const, questions: [] as MemberMonthlyQuestion[] };
  }

  const { rows, assignmentRows, contentAssignmentRows } =
    await fetchMonthlyQuestionRows();
  const canonicalAssignmentRows = mergeMonthlyQuestionAssignmentRows(
    assignmentRows,
    contentAssignmentRows
  );
  const assignmentRowsByQuestion = buildAssignmentRowsMap(canonicalAssignmentRows);
  const visible = rows
    .filter((row) => {
      const status = parseStatus(row.status);
      if (status !== "published") return false;
      return (assignmentRowsByQuestion.get(row.id) || []).some(
        (assignment) =>
          activeCircleIds.has(assignment.circle_id) &&
          assignment.assignment_status !== "archived"
      );
    })
    .flatMap((row) =>
      (assignmentRowsByQuestion.get(row.id) || [])
        .filter(
          (assignment) =>
            activeCircleIds.has(assignment.circle_id) &&
            assignment.assignment_status !== "archived"
        )
        .map((assignment) =>
          mapMemberMonthlyQuestion(row, assignment, usersPayload)
        )
    )
    .sort((first, second) =>
      String(second.publishedAt || "").localeCompare(String(first.publishedAt || ""))
    );

  return { ok: true as const, questions: visible };
}

const monthlyQuestionSelect =
  "id, content_item_id, title, opening_reflection, question_text, guidance, discussion_prompts, status, category, theme, question_number, published_at, created_by, updated_by, created_at, updated_at";
const monthlyQuestionAssignmentSelect =
  "id, monthly_question_id, circle_id, assigned_by, assigned_at, created_at, assignment_status, visible_from, archived_at, coach_introduction, question_month, question_year";

async function loadMonthlyQuestionContext(
  auth: Extract<CoachAuthResult, { ok: true }>
): Promise<MonthlyQuestionContext> {
  const usersPayload = await fetchAdminUsersData(auth.user.id);
  const activeCircles = usersPayload.circles.filter((circle) => circle.status === "active");
  const authorizedSourceCircles = auth.isAdmin
    ? activeCircles
    : activeCircles.filter((circle) => circle.coachIds.includes(auth.user.id));
  const authorizedCircles = authorizedSourceCircles.map((circle) => ({
    id: circle.id,
    name: circle.name,
    status: circle.status,
  }));

  return {
    usersPayload,
    authorizedCircles,
    authorizedCircleIds: new Set(authorizedCircles.map((circle) => circle.id)),
  };
}

async function fetchMonthlyQuestionRows() {
  const supabase = createAdminSupabaseClient();
  const [questionsResponse, assignmentsResponse, contentAssignmentsResponse] = await Promise.all([
    supabase.from("monthly_questions").select(monthlyQuestionSelect),
    supabase
      .from("monthly_question_circle_assignments")
      .select(monthlyQuestionAssignmentSelect),
    supabase
      .from("content_assignments")
      .select(canonicalAssignmentSelect)
      .eq("content_item.content_kind", "monthly_question")
      .eq("assignment_status", "active"),
  ]);
  let assignmentData: unknown[] | null = assignmentsResponse.data;
  let assignmentError = assignmentsResponse.error;
  const contentAssignmentError = contentAssignmentsResponse.error;

  if (questionsResponse.error) {
    throw monthlyQuestionSchemaError("Monthly questions are not configured.", questionsResponse.error);
  }

  if (assignmentError && isMissingAssignmentStateError(assignmentError)) {
    const fallbackResponse = await supabase
      .from("monthly_question_circle_assignments")
      .select("id, monthly_question_id, circle_id, assigned_by, assigned_at, created_at");

    assignmentData = fallbackResponse.data;
    assignmentError = fallbackResponse.error;
  }

  if (assignmentError) {
    throw monthlyQuestionSchemaError(
      "Monthly question assignments are not configured.",
      assignmentError
    );
  }

  if (contentAssignmentError) {
    throw monthlyQuestionSchemaError(
      "Content assignments are not configured.",
      contentAssignmentError
    );
  }

  const assignmentRows = (assignmentData || []) as MonthlyQuestionAssignmentRow[];
  const contentAssignmentRows = await resolveCanonicalAssignmentRows(
    (contentAssignmentsResponse.data || []) as unknown as Parameters<
      typeof resolveCanonicalAssignmentRows
    >[0]
  );

  return {
    rows: (questionsResponse.data || []) as MonthlyQuestionRow[],
    assignmentRows,
    contentAssignmentRows,
  };
}

function getCoachLibraryQuestionIds(rows: ContentAssignmentRow[]) {
  return new Set(
    rows
      .filter(
        (row) =>
          row.content_kind === "monthly_question" &&
          row.assignment_status !== "archived" &&
          (row.audience_type === "coach_library" || row.audience_type === "all_coaches") &&
          row.placement === "coach_dashboard_library"
      )
      .map((row) => row.source_id)
  );
}

function mergeMonthlyQuestionAssignmentRows(
  rows: MonthlyQuestionAssignmentRow[],
  contentAssignments: ContentAssignmentRow[],
  context?: MonthlyQuestionContext
) {
  const specializedByTarget = new Map(
    rows.map((row) => [`${row.monthly_question_id}:${row.circle_id}`, row])
  );
  return contentAssignments
    .filter(
      (row) =>
        row.content_kind === "monthly_question" &&
        row.circle_id &&
        row.assignment_status !== "archived" &&
        row.audience_type === "selected_circle" &&
        row.placement === "circle_dashboard" &&
        (!context || context.authorizedCircleIds.has(row.circle_id))
    )
    .map((row) => {
      const specialized = specializedByTarget.get(`${row.source_id}:${row.circle_id}`);
      return {
        id: specialized?.id || row.id,
        monthly_question_id: row.source_id,
        circle_id: row.circle_id as string,
        assigned_by: row.assigned_by,
        assigned_at: row.created_at,
        created_at: row.created_at,
        assignment_status: row.assignment_status,
        visible_from: row.visible_from,
        archived_at: null,
        coach_introduction: specialized?.coach_introduction || "",
        question_month: specialized?.question_month || null,
        question_year: specialized?.question_year || null,
      };
    });
}

async function fetchMonthlyQuestionRow(questionId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("monthly_questions")
    .select(monthlyQuestionSelect)
    .eq("id", questionId)
    .maybeSingle();

  if (error) throw monthlyQuestionSchemaError("Monthly questions are not configured.", error);

  return (data || null) as MonthlyQuestionRow | null;
}

async function fetchAssignmentMap(questionIds: string[]) {
  if (questionIds.length === 0) return new Map<string, string[]>();

  const supabase = createAdminSupabaseClient();
  const { data: questions, error: questionError } = await supabase
    .from("monthly_questions")
    .select("id,content_item_id")
    .in("id", questionIds);

  if (questionError) {
    throw monthlyQuestionSchemaError("Monthly questions are not configured.", questionError);
  }

  const contentItemIds = (questions || []).map((row) => row.content_item_id);
  if (contentItemIds.length === 0) return new Map<string, string[]>();

  const { data, error } = await supabase
    .from("content_assignments")
    .select(canonicalAssignmentSelect)
    .in("content_item_id", contentItemIds)
    .eq("audience_type", "selected_circle")
    .eq("placement", "circle_dashboard")
    .eq("assignment_status", "active");

  if (error) {
    throw monthlyQuestionSchemaError("Content assignments are not configured.", error);
  }

  const rows = await resolveCanonicalAssignmentRows(
    (data || []) as unknown as Parameters<typeof resolveCanonicalAssignmentRows>[0]
  );
  const map = new Map<string, string[]>();
  rows.forEach((row) => {
    if (!row.circle_id) return;
    const existing = map.get(row.source_id) || [];
    map.set(row.source_id, [...existing, row.circle_id]);
  });
  return map;
}

async function fetchAssignmentRow(assignmentId: string, circleId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("monthly_question_circle_assignments")
    .select(monthlyQuestionAssignmentSelect)
    .eq("id", assignmentId)
    .eq("circle_id", circleId)
    .maybeSingle();

  if (error) {
    throw monthlyQuestionSchemaError("Monthly question assignments are not configured.", error);
  }

  return (data || null) as MonthlyQuestionAssignmentRow | null;
}

async function syncMonthlyQuestionAssignments(
  questionId: string,
  circleIds: string[],
  assignedBy: string
) {
  const question = await fetchMonthlyQuestionRow(questionId);
  if (!question) return notFoundResult();

  const currentAssignments = await fetchAssignmentMap([questionId]);
  const currentCircleIds = new Set(currentAssignments.get(questionId) || []);
  const nextCircleIds = new Set(circleIds);

  try {
    await Promise.all([
      ...Array.from(currentCircleIds)
        .filter((circleId) => !nextCircleIds.has(circleId))
        .map((circleId) =>
          deleteCanonicalCircleMonthlyQuestion(question.content_item_id, circleId)
        ),
      ...circleIds.map((circleId) =>
        upsertCanonicalCircleMonthlyQuestion({
          contentItemId: question.content_item_id,
          circleId,
          assignedBy,
          visibleFrom: new Date().toISOString(),
        })
      ),
    ]);
  } catch (error) {
    return monthlyQuestionDatabaseFailure("monthly_question_assignment_sync_failed", error);
  }

  const supabase = createAdminSupabaseClient();
  const { error: deleteError } = await supabase
    .from("monthly_question_circle_assignments")
    .delete()
    .eq("monthly_question_id", questionId);

  if (deleteError) {
    return monthlyQuestionDatabaseFailure("monthly_question_assignment_delete_failed", deleteError);
  }

  if (circleIds.length === 0) return { ok: true as const };

  try {
    await upsertMonthlyQuestionAssignmentMetadata({
      questionId,
      circleIds,
      assignedBy,
      visibleFrom: new Date().toISOString(),
    });
  } catch (error) {
    return monthlyQuestionDatabaseFailure(
      "monthly_question_assignment_insert_failed",
      error
    );
  }

  return { ok: true as const };
}

function buildAssignmentMap(rows: MonthlyQuestionAssignmentRow[]) {
  const map = new Map<string, string[]>();

  rows.forEach((row) => {
    const existing = map.get(row.monthly_question_id) || [];
    map.set(row.monthly_question_id, [...existing, row.circle_id]);
  });

  return map;
}

function buildAssignmentRowsMap(rows: MonthlyQuestionAssignmentRow[]) {
  const map = new Map<string, MonthlyQuestionAssignmentRow[]>();

  rows.forEach((row) => {
    const existing = map.get(row.monthly_question_id) || [];
    map.set(row.monthly_question_id, [...existing, row]);
  });

  return map;
}

function cleanMonthlyQuestionInput(
  values: CoachMonthlyQuestionInput,
  context: MonthlyQuestionContext,
  requireCircle: boolean
) {
  const title = cleanText(values.title, maxTitleLength);
  const openingReflection = cleanText(values.openingReflection, maxReflectionLength);
  const questionText = cleanText(values.questionText, maxQuestionLength);
  const guidance = cleanText(values.guidance, maxGuidanceLength);
  const discussionPrompts = unique(
    (Array.isArray(values.discussionPrompts) ? values.discussionPrompts : [])
      .map((prompt) => cleanText(prompt, maxPromptLength))
      .filter(Boolean)
  ).slice(0, maxPromptCount);
  const circleIds = unique(
    (Array.isArray(values.circleIds) ? values.circleIds : [])
      .filter((circleId): circleId is string => typeof circleId === "string")
      .map((circleId) => circleId.trim())
      .filter(Boolean)
  );

  if (!questionText) return validationResult("Main question is required.");
  if (requireCircle && circleIds.length === 0) {
    return validationResult("Assign at least one Circle before publishing.");
  }

  const invalidCircleId = circleIds.find((circleId) => !context.authorizedCircleIds.has(circleId));

  if (invalidCircleId) {
    return validationResult("One selected Circle is not available to you.");
  }
  const rawQuestionNumber =
    typeof values.questionNumber === "string"
      ? values.questionNumber.trim()
      : "";
  if (rawQuestionNumber.length > 50) {
    return validationResult(
      "Question Number must be 50 characters or fewer."
    );
  }
  const questionNumber = rawQuestionNumber;

  return {
    ok: true as const,
    title,
    openingReflection,
    questionText,
    guidance,
    discussionPrompts,
    circleIds,
    questionNumber,
  };
}

function canViewQuestion(
  auth: Extract<CoachAuthResult, { ok: true }>,
  question: MonthlyQuestionRow,
  assignments: Map<string, string[]>,
  context: MonthlyQuestionContext
) {
  if (auth.isAdmin || question.created_by === auth.user.id) return true;

  return (assignments.get(question.id) || []).some((circleId) =>
    context.authorizedCircleIds.has(circleId)
  );
}

function canManageQuestion(
  auth: Extract<CoachAuthResult, { ok: true }>,
  question: MonthlyQuestionRow,
  assignments: Map<string, string[]>,
  context: MonthlyQuestionContext
) {
  return canViewQuestion(auth, question, assignments, context);
}

function canDeleteQuestion(
  auth: Extract<CoachAuthResult, { ok: true }>,
  question: MonthlyQuestionRow,
  assignments: Map<string, string[]>,
  context: MonthlyQuestionContext
) {
  if (auth.isAdmin) return true;
  if (question.created_by !== auth.user.id) return false;

  const assignedCircleIds = assignments.get(question.id) || [];

  return assignedCircleIds.every((circleId) =>
    context.authorizedCircleIds.has(circleId)
  );
}

function mapCoachMonthlyQuestion(
  row: MonthlyQuestionRow,
  assignments: Map<string, string[]>,
  auth: Extract<CoachAuthResult, { ok: true }>,
  context: MonthlyQuestionContext
): CoachMonthlyQuestion {
  const status = parseStatus(row.status);
  const author = getUserById(row.created_by || "", context.usersPayload);
  const assignedCircles = (assignments.get(row.id) || [])
    .map((circleId) => context.usersPayload.circles.find((circle) => circle.id === circleId))
    .filter((circle): circle is AdminUsersPayload["circles"][number] => Boolean(circle))
    .map((circle) => ({ id: circle.id, name: circle.name, status: circle.status }));

  return {
    id: row.id,
    title: row.title || "",
    openingReflection: row.opening_reflection || "",
    questionText: row.question_text || "",
    guidance: row.guidance || "",
    discussionPrompts: parseDiscussionPrompts(row.discussion_prompts),
    category: row.category || "",
    theme: row.theme || "",
    questionNumber: row.question_number || "",
    status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: toPersonSummary(author),
    assignedCircles,
    canEdit: false,
    canDelete: false,
    canPublish: false,
    canArchive: false,
    canDuplicate: false,
  };
}

function mapCoachMonthlyQuestionAssignments(
  rows: MonthlyQuestionRow[],
  assignmentRows: MonthlyQuestionAssignmentRow[],
  assignments: Map<string, string[]>,
  auth: Extract<CoachAuthResult, { ok: true }>,
  context: MonthlyQuestionContext
) {
  const rowsById = new Map(rows.map((row) => [row.id, row]));

  return assignmentRows
    .filter((assignment) => context.authorizedCircleIds.has(assignment.circle_id))
    .map((assignment) => {
      const row = rowsById.get(assignment.monthly_question_id);
      if (!row || parseStatus(row.status) !== "published") return null;

      const circle = context.authorizedCircles.find(
        (item) => item.id === assignment.circle_id
      );

      if (!circle) return null;

      return {
        id: assignment.id || `${assignment.monthly_question_id}:${assignment.circle_id}`,
        circle,
        question: mapCoachMonthlyQuestion(row, assignments, auth, context),
        assignmentStatus:
          assignment.assignment_status === "archived" ? "archived" as const : "active" as const,
        assignedAt: assignment.assigned_at || assignment.created_at || null,
        visibleFrom: assignment.visible_from || null,
        archivedAt: assignment.archived_at || null,
        coachIntroduction: assignment.coach_introduction || "",
        questionMonth: assignment.question_month || null,
        questionYear: assignment.question_year || null,
        assignedBy: toPersonSummary(getUserById(assignment.assigned_by || "", context.usersPayload)),
        canArchive:
          assignment.assignment_status !== "archived" &&
          Boolean(auth.isAdmin || assignment.assigned_by === auth.user.id),
        canRemove: Boolean(auth.isAdmin || assignment.assigned_by === auth.user.id),
      };
    })
    .filter((item): item is CoachMonthlyQuestionAssignment => Boolean(item))
    .sort(sortAssignments);
}

function mapMemberMonthlyQuestion(
  row: MonthlyQuestionRow,
  assignment: MonthlyQuestionAssignmentRow,
  usersPayload: AdminUsersPayload
): MemberMonthlyQuestion {
  const circleId = assignment.circle_id;
  const circle = usersPayload.circles.find((item) => item.id === circleId);

  return {
    id: row.id,
    circle: {
      id: circleId,
      name: circle?.name || "Circle",
      status: circle?.status || "",
    },
    title: row.title || "",
    openingReflection: row.opening_reflection || "",
    questionText: row.question_text || "",
    guidance: row.guidance || "",
    discussionPrompts: parseDiscussionPrompts(row.discussion_prompts),
    questionNumber: row.question_number || "",
    questionMonth: assignment.question_month || null,
    questionYear: assignment.question_year || null,
    status: parseStatus(row.status) === "archived" ? "archived" : "published",
    publishedAt: row.published_at,
  };
}

function getCurrentAssignmentForCircle(
  circleId: string,
  assignments: CoachMonthlyQuestionAssignment[]
) {
  return (
    assignments
      .filter(
        (assignment) =>
          assignment.circle.id === circleId &&
          assignment.assignmentStatus === "active" &&
          assignment.question.status === "published"
      )
      .sort((first, second) =>
        String(second.visibleFrom || second.assignedAt || "").localeCompare(
          String(first.visibleFrom || first.assignedAt || "")
        )
      )[0] || null
  );
}

function sortQuestions(first: CoachMonthlyQuestion, second: CoachMonthlyQuestion) {
  const firstDate = first.publishedAt || first.updatedAt || first.createdAt || "";
  const secondDate = second.publishedAt || second.updatedAt || second.createdAt || "";
  return String(secondDate).localeCompare(String(firstDate));
}

function sortAssignments(
  first: CoachMonthlyQuestionAssignment,
  second: CoachMonthlyQuestionAssignment
) {
  const firstDate = first.visibleFrom || first.assignedAt || "";
  const secondDate = second.visibleFrom || second.assignedAt || "";
  return String(secondDate).localeCompare(String(firstDate));
}

function parseDiscussionPrompts(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function parseStatus(value: unknown): MonthlyQuestionStatus {
  if (value === "published" || value === "archived") return value;
  return "draft";
}

function toPersonSummary(profile: AdminManagedProfile | null): CoachPersonSummary {
  return {
    id: profile?.id || "",
    name: profile ? formatUserName(profile) : "PeaceWorks Coach",
    email: profile?.email || "",
  };
}

function getUserById(profileId: string, usersPayload: AdminUsersPayload) {
  return usersPayload.users.find((user) => user.id === profileId) || null;
}

function formatUserName(profile: AdminManagedProfile) {
  return (
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.email ||
    "PeaceWorks Member"
  );
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function validationResult(message: string) {
  return {
    ok: false as const,
    status: 400,
    code: "validation_failed",
    message,
  };
}

function notFoundResult() {
  return {
    ok: false as const,
    status: 404,
    code: "resource_unavailable",
    message: "This monthly question is not available.",
  };
}

function monthlyQuestionDatabaseFailure(code: string, error: unknown) {
  console.error(code, error);

  return {
    ok: false as const,
    status: 503,
    code,
    message: "Monthly questions are not available yet.",
    details: process.env.NODE_ENV === "production" ? undefined : safeErrorDetail(error),
  };
}

function monthlyQuestionSchemaError(message: string, error: unknown) {
  const detail = safeErrorDetail(error);
  const wrapped = new Error(message);
  wrapped.cause = { code: "monthly_questions_schema_unavailable", detail };
  console.error(message, error);
  return wrapped;
}

function isMissingAssignmentStateError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const values = Object.values(error as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return (
    values.includes("assignment_status") ||
    values.includes("visible_from") ||
    values.includes("archived_at") ||
    values.includes("coach_introduction")
  );
}

function safeErrorDetail(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const source = error as Record<string, unknown>;
  return [source.code, source.message, source.details, source.hint]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");
}

async function requireMemberFromRequest(request: Request): Promise<
  | { ok: true; user: User; email: string; isAdmin: boolean }
  | { ok: false; status: number; code: string; message: string }
> {
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

  return {
    ok: true,
    user,
    email,
    isAdmin: isAdminEmail(email),
  };
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.toLowerCase().startsWith("bearer ")) return "";

  return authorization.slice("bearer ".length).trim();
}
import "server-only";
