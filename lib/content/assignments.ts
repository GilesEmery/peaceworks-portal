import "server-only";

import { createAdminSupabaseClient } from "../admin/authorization";
import type { ContentItemKind, ContentItemRow } from "./registry";

export type CanonicalAudienceType =
  | "coach_library"
  | "all_members"
  | "all_circle_members"
  | "all_coaches"
  | "selected_circle"
  | "selected_member"
  | "selected_coach";

export type CanonicalAssignmentRow = {
  id: string;
  content_item_id: string;
  content_type: string | null;
  content_id: string | null;
  audience_type: string | null;
  circle_id: string | null;
  profile_id: string | null;
  placement: string | null;
  assignment_status: string | null;
  visible_from: string | null;
  visible_until: string | null;
  assigned_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  content_item: ContentItemRow | ContentItemRow[] | null;
};

export type ResolvedCanonicalAssignment = Omit<
  CanonicalAssignmentRow,
  "content_item"
> & {
  content_kind: ContentItemKind;
  source_id: string;
};

export type CanonicalAssignmentWrite = {
  audienceType: CanonicalAudienceType;
  circleId?: string | null;
  profileId?: string | null;
  placement: string;
  assignmentStatus?: "active" | "archived";
  visibleFrom?: string | null;
  visibleUntil?: string | null;
};

export type ContentAssignmentStatus = "active" | "archived";
export type UnassignContentResult = {
  assignment: ResolvedCanonicalAssignment;
  previousStatus: ContentAssignmentStatus;
};

export type CanonicalAssignmentCreateInput = {
  contentItemId: string;
  assignedBy: string;
  assignments: CanonicalAssignmentWrite[];
};

export const canonicalAssignmentSelect =
  "id,content_item_id,content_type,content_id,audience_type,circle_id,profile_id,placement,assignment_status,visible_from,visible_until,assigned_by,created_at,updated_at,content_item:content_items!inner(id,content_kind,created_at,updated_at)";

export async function createCanonicalAssignments(
  input: CanonicalAssignmentCreateInput
) {
  const source = await resolveCanonicalContentSource(input.contentItemId);
  const writes = input.assignments.map((assignment) =>
    buildCanonicalAssignmentWrite(source, input.assignedBy, assignment)
  );
  const activeWrites = writes.filter((write) => write.assignment_status === "active");
  const existingKeys = await fetchActiveAssignmentKeys(
    input.contentItemId,
    activeWrites.map(getLogicalAssignmentKey)
  );
  const rowsToInsert = writes.filter(
    (write) =>
      write.assignment_status !== "active" ||
      !existingKeys.has(getLogicalAssignmentKey(write))
  );

  if (rowsToInsert.length === 0) {
    throw new Error("This active content assignment already exists.");
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("content_assignments")
    .insert(rowsToInsert)
    .select(canonicalAssignmentSelect);

  if (error?.code === "23505") {
    throw new Error("This active content assignment already exists.");
  }
  if (error) throw new Error(`Content assignment could not be saved: ${error.message}`);

  return resolveCanonicalAssignmentRows(
    (data || []) as unknown as CanonicalAssignmentRow[]
  );
}

export async function upsertCanonicalCircleMonthlyQuestion(input: {
  contentItemId: string;
  circleId: string;
  assignedBy: string;
  visibleFrom: string;
}) {
  const supabase = createAdminSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from("content_assignments")
    .select("id")
    .eq("content_item_id", input.contentItemId)
    .eq("audience_type", "selected_circle")
    .eq("circle_id", input.circleId)
    .eq("placement", "circle_dashboard")
    .eq("assignment_status", "active")
    .maybeSingle();

  if (existingError) {
    throw new Error(`Existing assignment could not be checked: ${existingError.message}`);
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("content_assignments")
      .update({
        assigned_by: input.assignedBy,
        visible_from: input.visibleFrom,
        visible_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) throw new Error(`Content assignment could not be updated: ${error.message}`);
    return existing.id;
  }

  const rows = await createCanonicalAssignments({
    contentItemId: input.contentItemId,
    assignedBy: input.assignedBy,
    assignments: [
      {
        audienceType: "selected_circle",
        circleId: input.circleId,
        placement: "circle_dashboard",
        visibleFrom: input.visibleFrom,
      },
    ],
  });

  return rows[0]?.id || "";
}

export async function archiveCanonicalAssignment(assignmentId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("content_assignments")
    .update({
      assignment_status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", assignmentId)
    .select(canonicalAssignmentSelect)
    .single();

  if (error) throw new Error(`Content assignment could not be archived: ${error.message}`);

  const [resolved] = await resolveCanonicalAssignmentRows([
    data as unknown as CanonicalAssignmentRow,
  ]);
  if (
    resolved.content_kind === "monthly_question" &&
    resolved.audience_type === "selected_circle" &&
    resolved.circle_id
  ) {
    await archiveMonthlyQuestionAssignmentMetadata(
      resolved.source_id,
      resolved.circle_id
    );
  }
  return resolved;
}

export async function restoreCanonicalAssignment(
  assignmentId: string
): Promise<UnassignContentResult> {
  const supabase = createAdminSupabaseClient();
  const { data: current, error: readError } = await supabase
    .from("content_assignments")
    .select(canonicalAssignmentSelect)
    .eq("id", assignmentId)
    .single();

  if (readError) throw new Error(`Content assignment could not be loaded: ${readError.message}`);

  const [resolvedCurrent] = await resolveCanonicalAssignmentRows([
    current as unknown as CanonicalAssignmentRow,
  ]);
  const { data, error } = await supabase
    .from("content_assignments")
    .update({ assignment_status: "active", updated_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .select(canonicalAssignmentSelect)
    .single();

  if (error?.code === "23505") {
    throw new Error("This active content assignment already exists.");
  }
  if (error) throw new Error(`Content assignment could not be restored: ${error.message}`);

  const [resolved] = await resolveCanonicalAssignmentRows([
    data as unknown as CanonicalAssignmentRow,
  ]);
  if (
    resolved.content_kind === "monthly_question" &&
    resolved.audience_type === "selected_circle" &&
    resolved.circle_id
  ) {
    await restoreMonthlyQuestionAssignmentMetadata(resolved.source_id, resolved.circle_id);
  }

  return {
    assignment: resolved,
    previousStatus:
      resolvedCurrent.assignment_status === "active" ? "active" : "archived",
  };
}

export async function upsertMonthlyQuestionAssignmentMetadata(input: {
  questionId: string;
  circleIds: string[];
  assignedBy: string;
  visibleFrom: string;
  coachIntroduction?: string | null;
  questionMonth?: number | null;
  questionYear?: number | null;
}) {
  if (input.circleIds.length === 0) return;

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("monthly_question_circle_assignments")
    .upsert(
      input.circleIds.map((circleId) => ({
        monthly_question_id: input.questionId,
        circle_id: circleId,
        assigned_by: input.assignedBy,
        assigned_at: input.visibleFrom,
        assignment_status: "active",
        visible_from: input.visibleFrom,
        archived_at: null,
        coach_introduction: input.coachIntroduction || null,
        ...(input.questionMonth !== undefined
          ? { question_month: input.questionMonth }
          : {}),
        ...(input.questionYear !== undefined
          ? { question_year: input.questionYear }
          : {}),
      })),
      { onConflict: "monthly_question_id,circle_id" }
    );

  if (error) {
    throw new Error(`Monthly Question assignment metadata could not be saved: ${error.message}`);
  }
}

export async function archiveCanonicalCircleMonthlyQuestion(
  contentItemId: string,
  circleId: string
) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("content_assignments")
    .update({
      assignment_status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("content_item_id", contentItemId)
    .eq("audience_type", "selected_circle")
    .eq("circle_id", circleId)
    .eq("placement", "circle_dashboard")
    .eq("assignment_status", "active");

  if (error) throw new Error(`Content assignment could not be archived: ${error.message}`);
}

async function archiveMonthlyQuestionAssignmentMetadata(
  questionId: string,
  circleId: string
) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("monthly_question_circle_assignments")
    .update({
      assignment_status: "archived",
      archived_at: new Date().toISOString(),
    })
    .eq("monthly_question_id", questionId)
    .eq("circle_id", circleId);

  if (error) {
    throw new Error(`Monthly Question assignment metadata could not be archived: ${error.message}`);
  }
}

async function restoreMonthlyQuestionAssignmentMetadata(
  questionId: string,
  circleId: string
) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("monthly_question_circle_assignments")
    .update({ assignment_status: "active", archived_at: null })
    .eq("monthly_question_id", questionId)
    .eq("circle_id", circleId);

  if (error) {
    throw new Error(`Monthly Question assignment metadata could not be restored: ${error.message}`);
  }
}

export async function resolveCanonicalAssignmentRows(
  rows: CanonicalAssignmentRow[]
): Promise<ResolvedCanonicalAssignment[]> {
  const rowsByKind = new Map<ContentItemKind, CanonicalAssignmentRow[]>();

  rows.forEach((row) => {
    const contentItem = normalizeContentItem(row.content_item);
    if (!contentItem) {
      throw new Error(`Canonical assignment ${row.id} has no registry record.`);
    }

    const existing = rowsByKind.get(contentItem.content_kind) || [];
    rowsByKind.set(contentItem.content_kind, [...existing, row]);
  });

  const sourceIds = new Map<string, string>();
  await Promise.all(
    Array.from(rowsByKind.entries()).map(async ([kind, kindRows]) => {
      const table = getSourceTable(kind);
      const contentItemIds = Array.from(
        new Set(kindRows.map((row) => row.content_item_id))
      );
      const supabase = createAdminSupabaseClient();
      const { data, error } = await supabase
        .from(table)
        .select("id,content_item_id")
        .in("content_item_id", contentItemIds);

      if (error) {
        throw new Error(`Canonical ${kind} sources could not be resolved: ${error.message}`);
      }

      (data || []).forEach((source) => {
        sourceIds.set(String(source.content_item_id), String(source.id));
      });
    })
  );

  return rows.map((row) => {
    const contentItem = normalizeContentItem(row.content_item);
    const sourceId = sourceIds.get(row.content_item_id);

    if (!contentItem || !sourceId) {
      throw new Error(`Canonical assignment ${row.id} has no source record.`);
    }

    if (
      row.content_type !== contentItem.content_kind ||
      row.content_id !== sourceId
    ) {
      console.warn("Canonical assignment legacy parity mismatch", {
        assignmentId: row.id,
        contentItemId: row.content_item_id,
      });
    }

    const { content_item: _contentItem, ...assignment } = row;
    void _contentItem;

    return {
      ...assignment,
      content_kind: contentItem.content_kind,
      source_id: sourceId,
    };
  });
}

export async function resolveCanonicalContentSource(
  contentItemId: string,
  expectedKind?: ContentItemKind
) {
  const supabase = createAdminSupabaseClient();
  const { data: contentItem, error: registryError } = await supabase
    .from("content_items")
    .select("id,content_kind,created_at,updated_at")
    .eq("id", contentItemId)
    .maybeSingle();

  if (registryError) {
    throw new Error(`Content registry could not be read: ${registryError.message}`);
  }
  if (!contentItem) throw new Error("Content registry item was not found.");

  const kind = parseContentItemKind(contentItem.content_kind);
  if (expectedKind && kind !== expectedKind) {
    throw new Error(`Expected ${expectedKind} content but found ${kind}.`);
  }

  const { data: source, error: sourceError } = await supabase
    .from(getSourceTable(kind))
    .select("id,content_item_id,status")
    .eq("content_item_id", contentItemId)
    .maybeSingle();

  if (sourceError) {
    throw new Error(`Canonical content source could not be read: ${sourceError.message}`);
  }
  if (!source) throw new Error("Canonical content source was not found.");

  return {
    contentItemId,
    contentKind: kind,
    sourceId: String(source.id),
    status: String(source.status || ""),
  };
}

function buildCanonicalAssignmentWrite(
  source: Awaited<ReturnType<typeof resolveCanonicalContentSource>>,
  assignedBy: string,
  assignment: CanonicalAssignmentWrite
) {
  const circleId = assignment.circleId || null;
  const profileId = assignment.profileId || null;
  validateTargetShape(assignment.audienceType, circleId, profileId);
  validateVisibilityWindow(assignment.visibleFrom, assignment.visibleUntil);

  return {
    content_item_id: source.contentItemId,
    content_type: source.contentKind,
    content_id: source.sourceId,
    audience_type: assignment.audienceType,
    circle_id: circleId,
    profile_id: profileId,
    placement: assignment.placement,
    assignment_status: assignment.assignmentStatus || "active",
    assigned_by: assignedBy,
    visible_from: assignment.visibleFrom || null,
    visible_until: assignment.visibleUntil || null,
    updated_at: new Date().toISOString(),
  };
}

function validateTargetShape(
  audienceType: CanonicalAudienceType,
  circleId: string | null,
  profileId: string | null
) {
  if (audienceType === "selected_circle") {
    if (!circleId || profileId) throw new Error("Selected Circle assignments require one Circle.");
    return;
  }

  if (audienceType === "selected_member" || audienceType === "selected_coach") {
    if (!profileId || circleId) throw new Error("Selected profile assignments require one profile.");
    return;
  }

  if (circleId || profileId) {
    throw new Error("Global assignments cannot include a Circle or profile target.");
  }
}

function validateVisibilityWindow(
  visibleFrom: string | null | undefined,
  visibleUntil: string | null | undefined
) {
  if (
    visibleFrom &&
    visibleUntil &&
    new Date(visibleUntil).getTime() > new Date(visibleFrom).getTime()
  ) {
    return;
  }
  if (!visibleFrom || !visibleUntil || visibleFrom === visibleUntil) return;

  throw new Error("Visible until cannot be before visible from.");
}

async function fetchActiveAssignmentKeys(
  contentItemId: string,
  desiredKeys: string[]
) {
  if (desiredKeys.length === 0) return new Set<string>();

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("content_assignments")
    .select("audience_type,circle_id,profile_id,placement")
    .eq("content_item_id", contentItemId)
    .eq("assignment_status", "active");

  if (error) throw new Error(`Existing assignments could not be checked: ${error.message}`);

  const desired = new Set(desiredKeys);
  return new Set(
    (data || [])
      .map((row) => getLogicalAssignmentKey(row))
      .filter((key) => desired.has(key))
  );
}

function getLogicalAssignmentKey(row: {
  audience_type: string;
  circle_id: string | null;
  profile_id: string | null;
  placement: string;
}) {
  return [
    row.audience_type,
    row.circle_id || "",
    row.profile_id || "",
    row.placement,
  ].join(":");
}

function normalizeContentItem(
  value: ContentItemRow | ContentItemRow[] | null
): ContentItemRow | null {
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function getSourceTable(kind: ContentItemKind) {
  if (kind === "monthly_question") return "monthly_questions";
  if (kind === "resource") return "resources";
  return "trainings";
}

function parseContentItemKind(value: string): ContentItemKind {
  if (
    value === "monthly_question" ||
    value === "resource" ||
    value === "training"
  ) {
    return value;
  }

  throw new Error(`Unsupported content kind: ${value}`);
}
