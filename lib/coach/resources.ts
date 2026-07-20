import { createAdminSupabaseClient } from "../admin/authorization";
import {
  fetchAdminUsersData,
  type AdminManagedProfile,
  type AdminUsersPayload,
} from "../admin/userManagement";
import {
  canonicalAssignmentSelect,
  createCanonicalAssignments,
  resolveCanonicalAssignmentRows,
} from "../content/assignments";
import type { ResolvedCanonicalAssignment } from "../content/assignments";
import type { CoachAuthResult, CoachPersonSummary } from "./dashboard";

export type CoachResource = {
  id: string;
  title: string;
  description: string;
  resourceType: string;
  provider: string;
  externalUrl: string;
  openUrl: string;
  thumbnailUrl: string;
  coverImageUrl: string;
  category: string;
  tags: string[];
  status: "published";
  publishedAt: string | null;
};

export type CoachResourceAssignment = {
  id: string;
  resource: CoachResource;
  audience: "circle" | "member";
  audienceLabel: string;
  circleId: string;
  memberId: string;
  placement: string;
  assignedBy: CoachPersonSummary;
  assignedAt: string | null;
  visibleFrom: string | null;
  visibleUntil: string | null;
  canArchive: boolean;
};

export type CoachResourcesPayload = {
  ok: true;
  circle: {
    id: string;
    name: string;
  };
  members: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  assignedResources: CoachResourceAssignment[];
  libraryResources: CoachResource[];
};

export type CoachResourceAssignmentInput = {
  resourceId: string;
  audienceType: "circle" | "members";
  memberIds: string[];
};

type ResourceRow = {
  id: string;
  content_item_id: string;
  title: string | null;
  description: string | null;
  resource_type: string | null;
  provider: string | null;
  external_url: string | null;
  storage_path: string | null;
  thumbnail_url: string | null;
  cover_image_path: string | null;
  category: string | null;
  tags: unknown;
  status: string | null;
  published_at: string | null;
};

type ContentAssignmentRow = ResolvedCanonicalAssignment;

type ResourceContext = {
  usersPayload: AdminUsersPayload;
  circle: AdminUsersPayload["circles"][number];
  activeMembers: AdminManagedProfile[];
};

const resourceSelect =
  "id,content_item_id,title,description,resource_type,provider,external_url,storage_path,thumbnail_url,cover_image_path,category,tags,status,published_at";
const resourceStorageBucket = "peaceworks-resources";

export async function fetchCoachResourcesForCircle(
  auth: Extract<CoachAuthResult, { ok: true }>,
  circleId: string
): Promise<CoachResourcesPayload | null> {
  const context = await loadResourceContext(auth, circleId);

  if (!context) return null;

  const { resources, assignments } = await fetchResourceRows();
  const publishedResources = resources.filter((resource) => resource.status === "published");
  const resourcesById = new Map(publishedResources.map((resource) => [resource.id, resource]));
  const activeAssignments = assignments.filter(
    (assignment) =>
      assignment.content_kind === "resource" &&
      assignment.assignment_status !== "archived"
  );
  const libraryResourceIds = new Set(
    activeAssignments
      .filter(
        (assignment) =>
          (assignment.audience_type === "coach_library" ||
            assignment.audience_type === "all_coaches") &&
          assignment.placement === "coach_dashboard_library"
      )
      .map((assignment) => assignment.source_id)
  );
  const hasResourceAvailability = activeAssignments.length > 0;
  const assignedResources = await Promise.all(
    activeAssignments
      .filter((assignment) => isVisibleCircleResourceAssignment(assignment, context))
      .map((assignment) =>
        mapResourceAssignment(assignment, resourcesById, context, auth)
      )
  );
  const libraryResources = await Promise.all(
    publishedResources
      .filter(
        (resource) => !hasResourceAvailability || libraryResourceIds.has(resource.id)
      )
      .map(mapResource)
  );

  return {
    ok: true,
    circle: {
      id: context.circle.id,
      name: context.circle.name,
    },
    members: context.activeMembers.map((member) => ({
      id: member.id,
      name: formatUserName(member),
      email: member.email,
    })),
    assignedResources: assignedResources
      .filter((item): item is CoachResourceAssignment => Boolean(item))
      .sort(sortAssignments),
    libraryResources: libraryResources.sort(sortResources),
  };
}

export async function assignCoachResourceToCircle(
  auth: Extract<CoachAuthResult, { ok: true }>,
  circleId: string,
  values: CoachResourceAssignmentInput
) {
  const context = await loadResourceContext(auth, circleId);

  if (!context) return notFoundResult();

  const resource = await fetchPublishedResource(values.resourceId);

  if (!resource) return notFoundResult();

  const cleaned = cleanResourceAssignmentInput(values, context);

  if (!cleaned.ok) return cleaned;

  const timestamp = new Date().toISOString();
  const assignments =
    cleaned.audienceType === "circle"
      ? [
          {
            audienceType: "selected_circle" as const,
            circleId,
            placement: "resources_area",
            visibleFrom: timestamp,
          },
        ]
      : cleaned.memberIds.map((memberId) => ({
          audienceType: "selected_member" as const,
          profileId: memberId,
          placement: "resources_area",
          visibleFrom: timestamp,
        }));

  try {
    await createCanonicalAssignments({
      contentItemId: resource.content_item_id,
      assignedBy: auth.user.id,
      assignments,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      return validationResult("This resource assignment already exists.");
    }
    return databaseFailure("resource_assignment_save_failed", error);
  }

  return {
    ok: true as const,
    message:
      cleaned.audienceType === "selected_member"
        ? "Resource assigned. This will appear on the selected member’s My Dashboard."
        : "Resource assigned. This will appear on the dashboards of active members in this Circle.",
  };
}

async function loadResourceContext(
  auth: Extract<CoachAuthResult, { ok: true }>,
  circleId: string
) {
  const usersPayload = await fetchAdminUsersData(auth.user.id);
  const circle = usersPayload.circles.find(
    (item) =>
      item.id === circleId &&
      item.status === "active" &&
      (auth.isAdmin || item.coachIds.includes(auth.user.id))
  );

  if (!circle) return null;

  const activeMembers = circle.memberIds
    .map((memberId) => usersPayload.users.find((user) => user.id === memberId))
    .filter((member): member is AdminManagedProfile =>
      Boolean(member && member.accountStatus === "active")
    )
    .sort((a, b) => formatUserName(a).localeCompare(formatUserName(b)));

  return { usersPayload, circle, activeMembers };
}

async function fetchResourceRows() {
  const supabase = createAdminSupabaseClient();
  const [resourcesResponse, assignmentsResponse] = await Promise.all([
    supabase.from("resources").select(resourceSelect),
    supabase
      .from("content_assignments")
      .select(canonicalAssignmentSelect)
      .eq("content_item.content_kind", "resource"),
  ]);

  if (resourcesResponse.error) {
    throw schemaError("Resource Library is not configured.", resourcesResponse.error);
  }

  if (assignmentsResponse.error) {
    throw schemaError("Resource assignments are not configured.", assignmentsResponse.error);
  }

  return {
    resources: (resourcesResponse.data || []) as ResourceRow[],
    assignments: await resolveCanonicalAssignmentRows(
      (assignmentsResponse.data || []) as unknown as Parameters<
        typeof resolveCanonicalAssignmentRows
      >[0]
    ),
  };
}

async function fetchPublishedResource(resourceId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("resources")
    .select(resourceSelect)
    .eq("id", resourceId)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw schemaError("Resource Library is not configured.", error);

  return (data || null) as ResourceRow | null;
}

function isVisibleCircleResourceAssignment(
  assignment: ContentAssignmentRow,
  context: ResourceContext
) {
  if (
    assignment.audience_type === "selected_circle" &&
    assignment.circle_id === context.circle.id &&
    (assignment.placement === "resources_area" ||
      assignment.placement === "featured_dashboard")
  ) {
    return true;
  }

  if (
    assignment.audience_type === "selected_member" &&
    assignment.profile_id &&
    context.activeMembers.some((member) => member.id === assignment.profile_id) &&
    assignment.placement === "resources_area"
  ) {
    return true;
  }

  return false;
}

async function mapResourceAssignment(
  assignment: ContentAssignmentRow,
  resourcesById: Map<string, ResourceRow>,
  context: ResourceContext,
  auth: Extract<CoachAuthResult, { ok: true }>
) {
  const source = resourcesById.get(assignment.source_id);

  if (!source) return null;

  const member = assignment.profile_id
    ? context.activeMembers.find((item) => item.id === assignment.profile_id)
    : null;

  return {
    id: assignment.id,
    resource: await mapResource(source),
    audience: member ? "member" as const : "circle" as const,
    audienceLabel: member ? formatUserName(member) : context.circle.name,
    circleId: context.circle.id,
    memberId: member?.id || "",
    placement: assignment.placement || "",
    assignedBy: toPersonSummary(
      context.usersPayload.users.find((user) => user.id === assignment.assigned_by) || null
    ),
    assignedAt: assignment.created_at,
    visibleFrom: assignment.visible_from,
    visibleUntil: assignment.visible_until,
    canArchive: Boolean(assignment.assigned_by === auth.user.id || auth.isAdmin),
  };
}

async function mapResource(row: ResourceRow): Promise<CoachResource> {
  const storageUrl = row.storage_path ? await createResourceSignedUrl(row.storage_path) : "";

  return {
    id: row.id,
    title: row.title || "Untitled resource",
    description: row.description || "",
    resourceType: row.resource_type || "link",
    provider: row.provider || "",
    externalUrl: row.external_url || "",
    openUrl: row.external_url || storageUrl,
    thumbnailUrl: row.thumbnail_url || "",
    coverImageUrl: row.cover_image_path ? await createResourceSignedUrl(row.cover_image_path) : "",
    category: row.category || "",
    tags: parseTags(row.tags),
    status: "published",
    publishedAt: row.published_at,
  };
}

async function createResourceSignedUrl(path: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.storage
    .from(resourceStorageBucket)
    .createSignedUrl(path, 60 * 10);

  if (error) {
    console.warn("Coach resource signed URL could not be created", error);
    return "";
  }

  return data.signedUrl;
}

function cleanResourceAssignmentInput(
  values: CoachResourceAssignmentInput,
  context: ResourceContext
) {
  const audienceType = values.audienceType === "members" ? "members" : "circle";
  const activeMemberIds = new Set(context.activeMembers.map((member) => member.id));
  const memberIds = unique(
    (Array.isArray(values.memberIds) ? values.memberIds : [])
      .filter((memberId): memberId is string => typeof memberId === "string")
      .map((memberId) => memberId.trim())
      .filter(Boolean)
  );

  if (!values.resourceId) return validationResult("Select a resource.");
  if (audienceType === "members" && memberIds.length === 0) {
    return validationResult("Select at least one Circle member.");
  }

  const invalidMemberId = memberIds.find((memberId) => !activeMemberIds.has(memberId));

  if (invalidMemberId) {
    return validationResult("One selected member is not available in this Circle.");
  }

  return { ok: true as const, audienceType, memberIds };
}

function toPersonSummary(profile: AdminManagedProfile | null): CoachPersonSummary {
  return {
    id: profile?.id || "",
    name: profile ? formatUserName(profile) : "PeaceWorks",
    email: profile?.email || "",
  };
}

function formatUserName(profile: AdminManagedProfile) {
  return (
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.email ||
    "PeaceWorks Member"
  );
}

function parseTags(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function sortResources(first: CoachResource, second: CoachResource) {
  return String(second.publishedAt || "").localeCompare(String(first.publishedAt || ""));
}

function sortAssignments(first: CoachResourceAssignment, second: CoachResourceAssignment) {
  return String(second.visibleFrom || second.assignedAt || "").localeCompare(
    String(first.visibleFrom || first.assignedAt || "")
  );
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
    message: "This resource is not available.",
  };
}

function databaseFailure(code: string, error: unknown) {
  console.error(code, error);

  return {
    ok: false as const,
    status: 503,
    code,
    message: "Resources are not available yet.",
    details: process.env.NODE_ENV === "production" ? undefined : safeErrorDetail(error),
  };
}

function schemaError(message: string, error: unknown) {
  const wrapped = new Error(message);
  wrapped.cause = { code: "resource_schema_unavailable", detail: safeErrorDetail(error) };
  console.error(message, error);
  return wrapped;
}

function safeErrorDetail(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const source = error as Record<string, unknown>;
  return [source.code, source.message, source.details, source.hint]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");
}
