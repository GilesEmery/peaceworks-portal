import "server-only";

import { createAdminSupabaseClient } from "../admin/authorization";
import {
  canonicalAssignmentSelect,
  resolveCanonicalAssignmentRows,
  type ResolvedCanonicalAssignment,
} from "../content/assignments";
import {
  monthlyQuestionReflectionMaxLength,
  type CoachMonthlyQuestionReflection,
  type MonthlyQuestionReflectionResponse,
  type MonthlyQuestionReflectionRow,
} from "../monthlyQuestionReflections";
import type { MemberAuthResult } from "./authorization";

type ReflectionFailure = {
  ok: false;
  status: 400 | 403 | 404 | 503;
  code: string;
  message: string;
};

type EligibleMonthlyQuestion = {
  assignment: ResolvedCanonicalAssignment;
  monthlyQuestionId: string;
};

export async function readMemberMonthlyQuestionReflection(
  auth: Extract<MemberAuthResult, { ok: true }>,
  assignmentId: string
): Promise<MonthlyQuestionReflectionResponse | ReflectionFailure> {
  const eligible = await resolveEligibleMonthlyQuestion(
    auth.user.id,
    assignmentId
  );
  if (!eligible.ok) return eligible;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("monthly_question_reflections")
    .select(
      "id,profile_id,content_assignment_id,monthly_question_id,reflection_body,created_at,updated_at"
    )
    .eq("profile_id", auth.user.id)
    .eq("content_assignment_id", assignmentId)
    .maybeSingle();

  if (error) {
    console.error("Monthly Question reflection read failed", error);
    return serviceFailure();
  }

  const row = (data || null) as MonthlyQuestionReflectionRow | null;
  return {
    ok: true,
    reflection: {
      id: row?.id || null,
      assignmentId,
      monthlyQuestionId: eligible.monthlyQuestionId,
      body: row?.reflection_body || "",
      createdAt: row?.created_at || null,
      updatedAt: row?.updated_at || null,
    },
  };
}

export async function saveMemberMonthlyQuestionReflection(
  auth: Extract<MemberAuthResult, { ok: true }>,
  assignmentId: string,
  reflectionBody: unknown
): Promise<MonthlyQuestionReflectionResponse | ReflectionFailure> {
  if (
    typeof reflectionBody !== "string" ||
    reflectionBody.length > monthlyQuestionReflectionMaxLength
  ) {
    return {
      ok: false,
      status: 400,
      code: "invalid_reflection_body",
      message: `Reflection must be ${monthlyQuestionReflectionMaxLength.toLocaleString()} characters or fewer.`,
    };
  }

  const eligible = await resolveEligibleMonthlyQuestion(
    auth.user.id,
    assignmentId
  );
  if (!eligible.ok) return eligible;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("monthly_question_reflections")
    .upsert(
      {
        profile_id: auth.user.id,
        content_assignment_id: assignmentId,
        monthly_question_id: eligible.monthlyQuestionId,
        reflection_body: reflectionBody,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,content_assignment_id" }
    )
    .select(
      "id,profile_id,content_assignment_id,monthly_question_id,reflection_body,created_at,updated_at"
    )
    .single();

  if (error) {
    console.error("Monthly Question reflection save failed", error);
    return serviceFailure();
  }

  const row = data as MonthlyQuestionReflectionRow;
  return {
    ok: true,
    reflection: {
      id: row.id,
      assignmentId: row.content_assignment_id,
      monthlyQuestionId: row.monthly_question_id,
      body: row.reflection_body,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

export async function fetchCoachMonthlyQuestionReflections(input: {
  coachId: string;
  profileId: string;
  isAdmin: boolean;
}): Promise<CoachMonthlyQuestionReflection[]> {
  const supabase = createAdminSupabaseClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,account_status")
    .eq("id", input.profileId)
    .maybeSingle();

  if (profileError) throw new Error(`Reflection member lookup failed: ${profileError.message}`);
  if (!profile || profile.account_status !== "active") return [];

  const { data: reflections, error: reflectionError } = await supabase
    .from("monthly_question_reflections")
    .select(
      "id,profile_id,content_assignment_id,monthly_question_id,reflection_body,created_at,updated_at"
    )
    .eq("profile_id", input.profileId)
    .order("updated_at", { ascending: false });

  if (reflectionError) {
    if (reflectionError.code === "42P01") return [];
    throw new Error(`Coach reflection query failed: ${reflectionError.message}`);
  }
  if (!reflections?.length) return [];

  const assignmentIds = reflections.map((row) => row.content_assignment_id);
  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("content_assignments")
    .select(canonicalAssignmentSelect)
    .in("id", assignmentIds);
  if (assignmentError) {
    throw new Error(`Reflection assignments failed: ${assignmentError.message}`);
  }

  const assignments = await resolveCanonicalAssignmentRows(
    (assignmentRows || []) as unknown as Parameters<
      typeof resolveCanonicalAssignmentRows
    >[0]
  );
  const assignmentById = new Map(assignments.map((row) => [row.id, row]));
  const relationships = input.isAdmin
    ? { direct: true, sharedCircleIds: new Set<string>() }
    : await loadCoachMemberRelationships(input.coachId, input.profileId);

  const visibleRows = reflections.filter((reflection) => {
    const assignment = assignmentById.get(reflection.content_assignment_id);
    return Boolean(
      assignment &&
        assignment.content_kind === "monthly_question" &&
        assignment.source_id === reflection.monthly_question_id &&
        canCoachReadAssignment(assignment, relationships)
    );
  });
  if (!visibleRows.length) return [];

  const questionIds = Array.from(
    new Set(visibleRows.map((row) => row.monthly_question_id))
  );
  const circleIds = Array.from(
    new Set(
      visibleRows
        .map((row) => assignmentById.get(row.content_assignment_id)?.circle_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const [questionsResponse, circlesResponse] = await Promise.all([
    supabase
      .from("monthly_questions")
      .select(
        "id,title,theme,category,question_text,question_month,question_year"
      )
      .in("id", questionIds),
    circleIds.length
      ? supabase.from("circles").select("id,name").in("id", circleIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const detailError = questionsResponse.error || circlesResponse.error;
  if (detailError) {
    throw new Error(`Coach reflection details failed: ${detailError.message}`);
  }

  const questionById = new Map(
    (questionsResponse.data || []).map((row) => [row.id, row])
  );
  const circleById = new Map(
    (circlesResponse.data || []).map((row) => [row.id, row.name || ""])
  );

  return visibleRows.flatMap((row) => {
    const assignment = assignmentById.get(row.content_assignment_id);
    const question = questionById.get(row.monthly_question_id);
    if (!assignment || !question) return [];
    return [
      {
        id: row.id,
        assignmentId: row.content_assignment_id,
        monthlyQuestionId: row.monthly_question_id,
        question: question.question_text || "",
        title: question.title || "Monthly Question",
        theme: question.theme || "",
        category: question.category || "",
        questionMonth: question.question_month ?? null,
        questionYear: question.question_year ?? null,
        circle: assignment.circle_id
          ? {
              id: assignment.circle_id,
              name: circleById.get(assignment.circle_id) || "",
            }
          : null,
        audienceType: assignment.audience_type || "",
        body: row.reflection_body || "",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    ];
  });
}

async function resolveEligibleMonthlyQuestion(
  memberId: string,
  assignmentId: string
): Promise<
  | ({ ok: true } & EligibleMonthlyQuestion)
  | ReflectionFailure
> {
  if (!assignmentId) return notFoundFailure();

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("content_assignments")
    .select(canonicalAssignmentSelect)
    .eq("id", assignmentId)
    .eq("assignment_status", "active")
    .maybeSingle();

  if (error) {
    console.error("Monthly Question assignment lookup failed", error);
    return serviceFailure();
  }
  if (!data) return notFoundFailure();

  const [assignment] = await resolveCanonicalAssignmentRows([
    data as unknown as Parameters<typeof resolveCanonicalAssignmentRows>[0][number],
  ]);
  if (assignment.content_kind !== "monthly_question") return notFoundFailure();

  const now = new Date().toISOString();
  if (
    (assignment.visible_from && assignment.visible_from > now) ||
    (assignment.visible_until && assignment.visible_until < now)
  ) {
    return notFoundFailure();
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("circle_memberships")
    .select("circle_id")
    .eq("profile_id", memberId)
    .eq("status", "active")
    .is("ended_at", null);
  if (membershipError) {
    console.error("Reflection membership lookup failed", membershipError);
    return serviceFailure();
  }

  const activeCircleIds = new Set(
    (memberships || []).map((membership) => membership.circle_id)
  );
  if (activeCircleIds.size > 0) {
    const { data: activeCircles, error: circleError } = await supabase
      .from("circles")
      .select("id")
      .in("id", Array.from(activeCircleIds))
      .eq("status", "active");
    if (circleError) {
      console.error("Reflection Circle lookup failed", circleError);
      return serviceFailure();
    }
    const verifiedActiveIds = new Set(
      (activeCircles || []).map((circle) => circle.id)
    );
    activeCircleIds.forEach((circleId) => {
      if (!verifiedActiveIds.has(circleId)) activeCircleIds.delete(circleId);
    });
  }
  const eligible =
    assignment.audience_type === "all_members" ||
    (assignment.audience_type === "all_circle_members" &&
      activeCircleIds.size > 0) ||
    (assignment.audience_type === "selected_member" &&
      assignment.profile_id === memberId) ||
    (assignment.audience_type === "selected_circle" &&
      Boolean(
        assignment.circle_id && activeCircleIds.has(assignment.circle_id)
      ));
  if (!eligible) return notFoundFailure();

  const { data: question, error: questionError } = await supabase
    .from("monthly_questions")
    .select("id,status")
    .eq("id", assignment.source_id)
    .eq("status", "published")
    .maybeSingle();
  if (questionError) {
    console.error("Reflection Monthly Question lookup failed", questionError);
    return serviceFailure();
  }
  if (!question) return notFoundFailure();

  return {
    ok: true,
    assignment,
    monthlyQuestionId: question.id,
  };
}

async function loadCoachMemberRelationships(coachId: string, profileId: string) {
  const supabase = createAdminSupabaseClient();
  const [directResponse, membershipsResponse, coachedCirclesResponse] =
    await Promise.all([
      supabase
        .from("coach_assignments")
        .select("id")
        .eq("coach_id", coachId)
        .eq("member_id", profileId)
        .eq("status", "active")
        .is("ended_at", null)
        .limit(1),
      supabase
        .from("circle_memberships")
        .select("circle_id")
        .eq("profile_id", profileId)
        .eq("status", "active")
        .is("ended_at", null),
      supabase
        .from("circle_coaches")
        .select("circle_id")
        .eq("coach_id", coachId)
        .eq("status", "active")
        .is("ended_at", null),
    ]);
  const relationshipError =
    directResponse.error ||
    membershipsResponse.error ||
    coachedCirclesResponse.error;
  if (relationshipError) {
    throw new Error(`Coach reflection authorization failed: ${relationshipError.message}`);
  }

  const memberCircleIds = new Set(
    (membershipsResponse.data || []).map((row) => row.circle_id)
  );
  const sharedCandidateIds = (coachedCirclesResponse.data || [])
    .map((row) => row.circle_id)
    .filter((circleId) => memberCircleIds.has(circleId));
  const { data: activeCircles, error: activeCircleError } =
    sharedCandidateIds.length > 0
      ? await supabase
          .from("circles")
          .select("id")
          .in("id", sharedCandidateIds)
          .eq("status", "active")
      : { data: [], error: null };
  if (activeCircleError) {
    throw new Error(
      `Coach reflection Circle authorization failed: ${activeCircleError.message}`
    );
  }

  return {
    direct: Boolean(directResponse.data?.length),
    sharedCircleIds: new Set((activeCircles || []).map((circle) => circle.id)),
  };
}

function canCoachReadAssignment(
  assignment: ResolvedCanonicalAssignment,
  relationships: { direct: boolean; sharedCircleIds: Set<string> }
) {
  if (relationships.direct) return true;
  if (assignment.audience_type === "selected_circle") {
    return Boolean(
      assignment.circle_id &&
        relationships.sharedCircleIds.has(assignment.circle_id)
    );
  }
  return relationships.sharedCircleIds.size > 0;
}

function notFoundFailure(): ReflectionFailure {
  return {
    ok: false,
    status: 404,
    code: "reflection_assignment_not_found",
    message: "This Monthly Question assignment is not available.",
  };
}

function serviceFailure(): ReflectionFailure {
  return {
    ok: false,
    status: 503,
    code: "monthly_question_reflection_unavailable",
    message: "Your reflection is temporarily unavailable.",
  };
}
