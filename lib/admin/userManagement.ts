import type { User } from "@supabase/supabase-js";

import { createAdminSupabaseClient } from "./authorization";

export type AdminRoleName =
  | "member"
  | "circle_member"
  | "coach"
  | "project_manager"
  | "admin";
export type AdminAccountStatus = "active" | "deactivated" | "archived";
export type AdminLifecycleAction =
  | "deactivate"
  | "reactivate"
  | "archive"
  | "restore";

export type AdminManagedProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  jobTitle: string;
  timezone: string;
  roles: AdminRoleName[];
  circleIds: string[];
  coachIds: string[];
  primaryCoachId: string | null;
  accountStatus: AdminAccountStatus;
  statusChangedAt: string | null;
  deactivatedAt: string | null;
  archivedAt: string | null;
  statusReason: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminProfileUpdate = {
  firstName: string;
  lastName: string;
  organization: string;
  jobTitle: string;
  timezone: string;
};

export type AdminCircleOption = {
  id: string;
  name: string;
  description: string;
  status: string;
  memberIds: string[];
  coachIds: string[];
};

export type AdminCoachOption = {
  id: string;
  name: string;
  email: string;
  organization: string;
  accountStatus: AdminAccountStatus;
};

export type AdminUsersPayload = {
  ok: true;
  currentAdminId: string;
  roleOptions: Array<{
    name: AdminRoleName;
    label: string;
  }>;
  circles: AdminCircleOption[];
  coaches: AdminCoachOption[];
  users: AdminManagedProfile[];
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  organization: string | null;
  job_title: string | null;
  timezone: string | null;
  account_status: string | null;
  status_changed_at: string | null;
  deactivated_at: string | null;
  archived_at: string | null;
  status_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type RoleRow = {
  id: string;
  name: string;
  label: string | null;
};

type ProfileRoleRow = {
  profile_id: string;
  role_id: string;
};

type CircleRow = {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
};

type CircleMembershipRow = {
  id: string;
  circle_id: string;
  profile_id: string;
  status: string | null;
  ended_at: string | null;
};

type CircleCoachRow = {
  id: string;
  circle_id: string;
  coach_id: string;
  status: string | null;
  ended_at: string | null;
};

type CoachAssignmentRow = {
  id: string;
  coach_id: string;
  member_id: string;
  status: string | null;
  ended_at: string | null;
  is_primary: boolean;
};

type AdminUserSummary = {
  id: string;
  email: string;
};

const managedRoleNames: AdminRoleName[] = [
  "member",
  "circle_member",
  "coach",
  "project_manager",
  "admin",
];

const fallbackRoleLabels: Record<AdminRoleName, string> = {
  member: "Member",
  circle_member: "Circle Member",
  coach: "Coach",
  project_manager: "Project Manager",
  admin: "Admin",
};

export async function fetchAdminUsersData(
  currentAdminId = ""
): Promise<AdminUsersPayload> {
  const supabase = createAdminSupabaseClient();
  const profilesPromise = fetchProfilesForAdminUsers(supabase);
  const [
    users,
    profilesResponse,
    rolesResponse,
    profileRolesResponse,
    circlesResponse,
    membershipsResponse,
    circleCoachesResponse,
    assignmentsResponse,
  ] = await Promise.all([
    fetchAllAuthUsers(),
    profilesPromise,
    supabase.from("roles").select("id, name, label"),
    supabase.from("profile_roles").select("profile_id, role_id"),
    supabase
      .from("circles")
      .select("id, name, description, status")
      .order("name", { ascending: true }),
    supabase
      .from("circle_memberships")
      .select("id, circle_id, profile_id, status, ended_at"),
    supabase
      .from("circle_coaches")
      .select("id, circle_id, coach_id, status, ended_at"),
    supabase
      .from("coach_assignments")
      .select("id, coach_id, member_id, status, ended_at, is_primary"),
  ]);

  const responses = [
    rolesResponse,
    profileRolesResponse,
    circlesResponse,
    membershipsResponse,
    circleCoachesResponse,
    assignmentsResponse,
  ];

  if (responses.some((response) => response.error)) {
    logSupabaseErrors("fetchAdminUsersData", responses);
    throw new Error("Unable to load admin user management data.");
  }

  return buildAdminUsersPayload({
    users,
    profiles: profilesResponse,
    roles: (rolesResponse.data || []) as RoleRow[],
    profileRoles: (profileRolesResponse.data || []) as ProfileRoleRow[],
    circles: (circlesResponse.data || []) as CircleRow[],
    memberships: (membershipsResponse.data || []) as CircleMembershipRow[],
    circleCoaches: (circleCoachesResponse.data || []) as CircleCoachRow[],
    assignments: (assignmentsResponse.data || []) as CoachAssignmentRow[],
    currentAdminId,
  });
}

async function fetchProfilesForAdminUsers(
  supabase: ReturnType<typeof createAdminSupabaseClient>
): Promise<ProfileRow[]> {
  const fullResponse = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, organization, job_title, timezone, account_status, status_changed_at, deactivated_at, archived_at, status_reason, created_at, updated_at"
    )
    .order("last_name", { ascending: true });

  if (!fullResponse.error) {
    return (fullResponse.data || []) as ProfileRow[];
  }

  if (!isMissingLifecycleColumnError(fullResponse.error)) {
    console.error(
      "Admin Supabase query failed: fetch profiles with lifecycle fields",
      fullResponse.error
    );
    throw new Error("Unable to load profile data.");
  }

  console.warn(
    "Profile lifecycle columns are not available yet; loading admin profiles with active defaults."
  );

  const fallbackResponse = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, organization, job_title, timezone, created_at, updated_at"
    )
    .order("last_name", { ascending: true });

  if (fallbackResponse.error) {
    console.error(
      "Admin Supabase query failed: fetch profiles without lifecycle fields",
      fallbackResponse.error
    );
    throw new Error("Unable to load profile data.");
  }

  return ((fallbackResponse.data || []) as Array<
    Omit<
      ProfileRow,
      | "account_status"
      | "status_changed_at"
      | "deactivated_at"
      | "archived_at"
      | "status_reason"
    >
  >).map((profile) => ({
    ...profile,
    account_status: "active",
    status_changed_at: null,
    deactivated_at: null,
    archived_at: null,
    status_reason: null,
  }));
}

export async function updateAdminManagedUser(
  profileId: string,
  values: {
    profile: AdminProfileUpdate;
    roleNames: AdminRoleName[];
    circleIds: string[];
    coachIds: string[];
    primaryCoachId: string | null;
    adminRemovalConfirmation?: string;
  }
) {
  const supabase = createAdminSupabaseClient();
  const timestamp = new Date().toISOString();

  const [
    profileResponse,
    rolesResponse,
    circlesResponse,
    coachRoleResponse,
    currentRolesResponse,
    currentMembershipsResponse,
    currentAssignmentsResponse,
    currentCircleCoachRelationshipsResponse,
    currentOutgoingCoachAssignmentsResponse,
  ] = await Promise.all([
    supabase.from("profiles").select("id").eq("id", profileId).maybeSingle(),
    supabase.from("roles").select("id, name, label"),
    supabase.from("circles").select("id").eq("status", "active"),
    supabase.from("roles").select("id").eq("name", "coach").maybeSingle(),
    supabase.from("profile_roles").select("profile_id, role_id").eq("profile_id", profileId),
    supabase
      .from("circle_memberships")
      .select("id, circle_id, profile_id, status, ended_at")
      .eq("profile_id", profileId),
    supabase
      .from("coach_assignments")
      .select("id, coach_id, member_id, status, ended_at, is_primary")
      .eq("member_id", profileId),
    supabase
      .from("circle_coaches")
      .select("id, circle_id, coach_id, status, ended_at")
      .eq("coach_id", profileId),
    supabase
      .from("coach_assignments")
      .select("id, coach_id, member_id, status, ended_at, is_primary")
      .eq("coach_id", profileId),
  ]);

  const responses = [
    profileResponse,
    rolesResponse,
    circlesResponse,
    coachRoleResponse,
    currentRolesResponse,
    currentMembershipsResponse,
    currentAssignmentsResponse,
    currentCircleCoachRelationshipsResponse,
    currentOutgoingCoachAssignmentsResponse,
  ];

  if (responses.some((response) => response.error)) {
    logSupabaseErrors("updateAdminManagedUser validation", responses);
    throw new Error("Unable to validate user management changes.");
  }

  if (!profileResponse.data) {
    return {
      ok: false as const,
      status: 404,
      message: "User profile was not found.",
    };
  }

  const cleanedProfile = cleanProfileUpdate(values.profile);
  const profileValidationError = validateProfileUpdate(cleanedProfile);

  if (profileValidationError) {
    return {
      ok: false as const,
      status: 400,
      message: profileValidationError,
    };
  }

  const roles = (rolesResponse.data || []) as RoleRow[];
  const roleByName = new Map(roles.map((role) => [role.name, role]));
  const requestedRoles = unique(values.roleNames);
  const currentRoles = (currentRolesResponse.data || []) as ProfileRoleRow[];
  const unmanagedRole = requestedRoles.find(
    (roleName) => !managedRoleNames.includes(roleName)
  );

  if (unmanagedRole) {
    return {
      ok: false as const,
      status: 400,
      code: "role_not_managed",
      error: "role_not_available",
      message: `Role is not managed by this admin tool: ${unmanagedRole}.`,
    };
  }

  const unavailableRole = requestedRoles.find((roleName) => !roleByName.has(roleName));

  if (unavailableRole) {
    return {
      ok: false as const,
      status: 400,
      code:
        unavailableRole === "project_manager"
          ? "project_manager_role_missing"
          : "role_missing",
      error: "role_not_available",
      message:
        unavailableRole === "project_manager"
          ? "The Project Manager role has not been configured."
          : `Role is not available: ${unavailableRole}.`,
    };
  }

  if (!requestedRoles.includes("coach")) {
    const hasActiveCircleCoachRelationship = (
      (currentCircleCoachRelationshipsResponse.data || []) as CircleCoachRow[]
    ).some(isActiveRelationship);
    const hasActiveDirectMemberAssignment = (
      (currentOutgoingCoachAssignmentsResponse.data || []) as CoachAssignmentRow[]
    ).some(
      (assignment) =>
        isActiveRelationship(assignment) &&
        assignment.coach_id !== assignment.member_id
    );

    if (hasActiveCircleCoachRelationship || hasActiveDirectMemberAssignment) {
      return {
        ok: false as const,
        status: 409,
        code: "active_coaching_relationships_exist",
        message:
          "End this profile's active Circle and direct coaching relationships before removing the coach role.",
      };
    }
  }

  const adminRoleId = roleByName.get("admin")?.id || "";
  const currentlyHasAdminRole = Boolean(
    adminRoleId && currentRoles.some((role) => role.role_id === adminRoleId)
  );
  const removingAdminRole =
    currentlyHasAdminRole && !requestedRoles.includes("admin");

  if (
    removingAdminRole &&
    values.adminRemovalConfirmation?.trim() !== "REMOVE ADMIN"
  ) {
    return {
      ok: false as const,
      status: 400,
      message: 'Type "REMOVE ADMIN" before removing Admin access.',
    };
  }

  const activeCircleIds = new Set(
    ((circlesResponse.data || []) as Array<{ id: string }>).map((circle) => circle.id)
  );
  const requestedCircleIds = unique(values.circleIds);
  const invalidCircleId = requestedCircleIds.find(
    (circleId) => !activeCircleIds.has(circleId)
  );

  if (invalidCircleId) {
    return {
      ok: false as const,
      status: 400,
      message: "One selected Circle is no longer active.",
    };
  }

  const coachRole = coachRoleResponse.data as { id: string } | null;
  const requestedCoachIds = unique(values.coachIds);
  const currentActiveCoachIds = (
    (currentAssignmentsResponse.data || []) as CoachAssignmentRow[]
  )
    .filter(
      (assignment) =>
        isActiveRelationship(assignment) &&
        assignment.coach_id !== assignment.member_id
    )
    .map((assignment) => assignment.coach_id);
  const currentActiveAssignments = (
    (currentAssignmentsResponse.data || []) as CoachAssignmentRow[]
  ).filter(
    (assignment) =>
      isActiveRelationship(assignment) &&
      assignment.coach_id !== assignment.member_id
  );
  const prospectiveCoachIds = requestedRoles.includes("coach") ? [profileId] : [];
  const validCoachIds = await getActiveCoachIds(
    coachRole?.id || "",
    unique([...prospectiveCoachIds, ...currentActiveCoachIds])
  );
  const invalidCoachId = requestedCoachIds.find(
    (coachId) => !validCoachIds.has(coachId)
  );

  if (invalidCoachId) {
    return {
      ok: false as const,
      status: 400,
      message: "One selected coach is no longer available.",
    };
  }

  if (
    requestedCoachIds.includes(profileId)
  ) {
    return {
      ok: false as const,
      status: 400,
      code: "self_assignment_not_allowed",
      message: "A coach cannot be directly assigned to themselves.",
    };
  }

  const primaryCoachId = values.primaryCoachId?.trim() || null;

  if (primaryCoachId === profileId) {
    return {
      ok: false as const,
      status: 400,
      code: "self_primary_coach_not_allowed",
      message: "A person cannot be their own primary coach.",
    };
  }

  if (primaryCoachId && !requestedCoachIds.includes(primaryCoachId)) {
    return {
      ok: false as const,
      status: 400,
      code: "primary_coach_must_be_assigned",
      message: "The primary coach must also be an active assigned coach.",
    };
  }

  const currentPrimaryCoachId =
    currentActiveAssignments.find((assignment) => assignment.is_primary)?.coach_id ||
    null;

  if (
    currentPrimaryCoachId &&
    primaryCoachId &&
    currentPrimaryCoachId !== primaryCoachId
  ) {
    return {
      ok: false as const,
      status: 409,
      code: "primary_coach_conflict",
      message:
        "Clear the current primary coach before selecting a different primary coach.",
    };
  }

  await updateProfileInformation({
    profileId,
    profile: cleanedProfile,
    timestamp,
  });

  await updateProfileRoles({
    profileId,
    requestedRoleIds: requestedRoles.map((roleName) => roleByName.get(roleName)!.id),
    currentRoles,
    timestamp,
  });

  await updateCircleMemberships({
    profileId,
    requestedCircleIds,
    currentMemberships:
      (currentMembershipsResponse.data || []) as CircleMembershipRow[],
    timestamp,
  });

  await updateCoachAssignments({
    profileId,
    requestedCoachIds,
    primaryCoachId,
    currentAssignments:
      (currentAssignmentsResponse.data || []) as CoachAssignmentRow[],
    timestamp,
  });

  return {
    ok: true as const,
    message: "User access was updated.",
    roleNames: requestedRoles,
  };
}

export async function updateAdminUserLifecycle(
  profileId: string,
  adminProfileId: string,
  values: {
    action: AdminLifecycleAction;
    reason?: string;
  }
) {
  const supabase = createAdminSupabaseClient();
  const timestamp = new Date().toISOString();

  if (profileId === adminProfileId) {
    return {
      ok: false as const,
      status: 400,
      message: "You cannot change the status of your own active administrator account.",
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, account_status")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    console.error("Admin Supabase query failed: lifecycle profile lookup", error);
    throw new Error("Unable to load the selected profile.");
  }

  if (!profile) {
    return {
      ok: false as const,
      status: 404,
      message: "User profile was not found.",
    };
  }

  const reason = values.reason?.trim() || null;

  if (values.action === "deactivate") {
    await updateProfileLifecycleStatus({
      profileId,
      accountStatus: "deactivated",
      adminProfileId,
      timestamp,
      reason,
      deactivatedAt: timestamp,
      archivedAt: null,
    });
    await setAuthUserAccess(profileId, false);

    return {
      ok: true as const,
      message: "User account was deactivated.",
    };
  }

  if (values.action === "reactivate") {
    await updateProfileLifecycleStatus({
      profileId,
      accountStatus: "active",
      adminProfileId,
      timestamp,
      reason: null,
      deactivatedAt: null,
      archivedAt: null,
    });
    await setAuthUserAccess(profileId, true);

    return {
      ok: true as const,
      message: "User account was reactivated.",
    };
  }

  if (values.action === "archive") {
    await updateProfileLifecycleStatus({
      profileId,
      accountStatus: "archived",
      adminProfileId,
      timestamp,
      reason,
      deactivatedAt: null,
      archivedAt: timestamp,
    });
    await endProfileRelationships({ profileId, timestamp });
    await setAuthUserAccess(profileId, false);

    return {
      ok: true as const,
      message: "User account was archived and active relationships were ended.",
    };
  }

  if (values.action === "restore") {
    await updateProfileLifecycleStatus({
      profileId,
      accountStatus: "active",
      adminProfileId,
      timestamp,
      reason: null,
      deactivatedAt: null,
      archivedAt: null,
    });
    await setAuthUserAccess(profileId, true);

    return {
      ok: true as const,
      message: "User account was restored. Previous relationships were not restored.",
    };
  }

  return {
    ok: false as const,
    status: 400,
    message: "Lifecycle action is not available.",
  };
}

export async function deleteAdminManagedUser(
  profileId: string,
  adminProfileId: string
) {
  const supabase = createAdminSupabaseClient();

  if (profileId === adminProfileId) {
    return {
      ok: false as const,
      status: 400,
      message: "You cannot permanently delete your own active administrator account.",
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    console.error("Admin Supabase query failed: delete profile lookup", error);
    throw new Error("Unable to load the selected profile.");
  }

  if (!profile) {
    return {
      ok: false as const,
      status: 404,
      message: "User profile was not found.",
    };
  }

  const authDelete = await supabase.auth.admin.deleteUser(profileId);

  if (authDelete.error) {
    console.error("Admin Supabase auth mutation failed: delete user", authDelete.error);
    throw new Error("Unable to delete the authentication user.");
  }

  const profileDelete = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId);

  if (profileDelete.error) {
    console.error("Admin Supabase mutation failed: delete profile", profileDelete.error);
    throw new Error("Authentication user was deleted, but the profile row could not be deleted.");
  }

  return {
    ok: true as const,
    message: "User account was permanently deleted.",
  };
}

async function updateProfileLifecycleStatus({
  profileId,
  accountStatus,
  adminProfileId,
  timestamp,
  reason,
  deactivatedAt,
  archivedAt,
}: {
  profileId: string;
  accountStatus: AdminAccountStatus;
  adminProfileId: string;
  timestamp: string;
  reason: string | null;
  deactivatedAt: string | null;
  archivedAt: string | null;
}) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      account_status: accountStatus,
      status_changed_at: timestamp,
      status_changed_by: adminProfileId,
      status_reason: reason,
      deactivated_at: deactivatedAt,
      archived_at: archivedAt,
      updated_at: timestamp,
    })
    .eq("id", profileId);

  if (error) {
    console.error("Admin Supabase mutation failed: lifecycle profile update", error);
    throw new Error("Unable to update the profile lifecycle status.");
  }
}

async function endProfileRelationships({
  profileId,
  timestamp,
}: {
  profileId: string;
  timestamp: string;
}) {
  const supabase = createAdminSupabaseClient();
  const membershipsResponse = await supabase
    .from("circle_memberships")
    .update({
      status: "inactive",
      ended_at: timestamp,
    })
    .eq("profile_id", profileId)
    .eq("status", "active")
    .is("ended_at", null);

  if (membershipsResponse.error) {
    console.error(
      "Admin Supabase mutation failed: archive Circle memberships",
      membershipsResponse.error
    );
    throw new Error("Unable to end active Circle memberships.");
  }

  const circleCoachesResponse = await supabase
    .from("circle_coaches")
    .update({
      status: "inactive",
      ended_at: timestamp,
    })
    .eq("coach_id", profileId)
    .eq("status", "active")
    .is("ended_at", null);

  if (circleCoachesResponse.error) {
    console.error(
      "Admin Supabase mutation failed: archive Circle coach relationships",
      circleCoachesResponse.error
    );
    throw new Error("Unable to end active Circle coach relationships.");
  }

  const activeAssignmentsResponse = await supabase
    .from("coach_assignments")
    .select("id, coach_id, member_id")
    .or(`member_id.eq.${profileId},coach_id.eq.${profileId}`)
    .eq("status", "active")
    .is("ended_at", null);

  if (activeAssignmentsResponse.error) {
    console.error(
      "Admin Supabase query failed: load coach assignments for archival",
      activeAssignmentsResponse.error
    );
    throw new Error("Unable to end active coach assignments.");
  }

  const assignmentIds = (activeAssignmentsResponse.data || [])
    .filter((assignment) => assignment.coach_id !== assignment.member_id)
    .map((assignment) => assignment.id);

  if (assignmentIds.length === 0) return;

  const assignmentsResponse = await supabase
    .from("coach_assignments")
    .update({
      status: "inactive",
      ended_at: timestamp,
      is_primary: false,
    })
    .in("id", assignmentIds);

  if (assignmentsResponse.error) {
    console.error(
      "Admin Supabase mutation failed: archive coach assignments",
      assignmentsResponse.error
    );
    throw new Error("Unable to end active coach assignments.");
  }
}

async function setAuthUserAccess(profileId: string, isAllowed: boolean) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.auth.admin.updateUserById(profileId, {
    ban_duration: isAllowed ? "none" : "876000h",
  });

  if (error) {
    console.error("Admin Supabase auth mutation failed: update user access", error);
    throw new Error("Unable to update authentication access.");
  }
}

async function updateProfileInformation({
  profileId,
  profile,
  timestamp,
}: {
  profileId: string;
  profile: AdminProfileUpdate;
  timestamp: string;
}) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: profile.firstName,
      last_name: profile.lastName,
      organization: profile.organization || null,
      job_title: profile.jobTitle || null,
      timezone: profile.timezone || null,
      updated_at: timestamp,
    })
    .eq("id", profileId);

  if (error) {
    console.error("Admin Supabase mutation failed: update profile", error);
    throw new Error("Unable to update profile information.");
  }
}

export async function updateAdminCircle(
  circleId: string,
  values: {
    memberIds: string[];
    coachIds: string[];
  }
) {
  const supabase = createAdminSupabaseClient();
  const timestamp = new Date().toISOString();

  const [
    circleResponse,
    profilesResponse,
    coachRoleResponse,
    coachProfilesResponse,
    currentMembershipsResponse,
    currentCircleCoachesResponse,
  ] =
    await Promise.all([
      supabase.from("circles").select("id").eq("id", circleId).maybeSingle(),
      supabase.from("profiles").select("id, account_status"),
      supabase.from("roles").select("id").eq("name", "coach").maybeSingle(),
      supabase
        .from("profile_roles")
        .select("profile_id, role_id"),
      supabase
        .from("circle_memberships")
        .select("id, circle_id, profile_id, status, ended_at")
        .eq("circle_id", circleId),
      supabase
        .from("circle_coaches")
        .select("id, circle_id, coach_id, status, ended_at")
        .eq("circle_id", circleId),
    ]);

  const responses = [
    circleResponse,
    profilesResponse,
    coachRoleResponse,
    coachProfilesResponse,
    currentMembershipsResponse,
    currentCircleCoachesResponse,
  ];

  if (responses.some((response) => response.error)) {
    logSupabaseErrors("updateAdminCircle validation", responses);
    throw new Error("Unable to validate Circle management changes.");
  }

  if (!circleResponse.data) {
    return {
      ok: false as const,
      status: 404,
      message: "Circle was not found.",
    };
  }

  const profileIds = new Set(
    ((profilesResponse.data || []) as Array<{ id: string }>).map(
      (profile) => profile.id
    )
  );
  const requestedMemberIds = unique(values.memberIds);
  const invalidMemberId = requestedMemberIds.find(
    (profileId) => !profileIds.has(profileId)
  );

  if (invalidMemberId) {
    return {
      ok: false as const,
      status: 400,
      message: "One selected Circle member is no longer available.",
    };
  }

  const coachRole = coachRoleResponse.data as { id: string } | null;
  const activeProfileIds = new Set(
    ((profilesResponse.data || []) as Array<{
      id: string;
      account_status: string | null;
    }>)
      .filter((profile) => normalizeAccountStatus(profile.account_status) === "active")
      .map((profile) => profile.id)
  );
  const coachProfileIds = new Set(
    ((coachProfilesResponse.data || []) as ProfileRoleRow[])
      .filter((row) => row.role_id === coachRole?.id)
      .map((row) => row.profile_id)
  );
  const requestedCoachIds = unique(values.coachIds);
  const invalidCoachId = requestedCoachIds.find(
    (profileId) =>
      !activeProfileIds.has(profileId) || !coachProfileIds.has(profileId)
  );

  if (invalidCoachId) {
    return {
      ok: false as const,
      status: 400,
      message: "One selected Circle coach is not an active coach-role profile.",
    };
  }

  await updateCircleMembersForCircle({
    circleId,
    requestedMemberIds,
    currentMemberships:
      (currentMembershipsResponse.data || []) as CircleMembershipRow[],
    timestamp,
  });

  await updateCircleCoachesForCircle({
    circleId,
    requestedCoachIds,
    currentCircleCoaches:
      (currentCircleCoachesResponse.data || []) as CircleCoachRow[],
    timestamp,
  });

  return {
    ok: true as const,
    message: "Circle members and coaches were updated.",
  };
}

function buildAdminUsersPayload({
  users,
  profiles,
  roles,
  profileRoles,
  circles,
  memberships,
  circleCoaches,
  assignments,
  currentAdminId,
}: {
  users: AdminUserSummary[];
  profiles: ProfileRow[];
  roles: RoleRow[];
  profileRoles: ProfileRoleRow[];
  circles: CircleRow[];
  memberships: CircleMembershipRow[];
  circleCoaches: CircleCoachRow[];
  assignments: CoachAssignmentRow[];
  currentAdminId: string;
}): AdminUsersPayload {
  const emailByUserId = new Map(users.map((user) => [user.id, user.email]));
  const roleById = new Map(roles.map((role) => [role.id, role]));
  const rolesByProfileId = groupBy(profileRoles, (row) => row.profile_id);
  const activeMembershipsByProfileId = groupBy(
    memberships.filter(isActiveRelationship),
    (row) => row.profile_id
  );
  const activeAssignmentsByMemberId = groupBy(
    // Legacy self-assignments are compatibility data, not direct coaching.
    assignments.filter(
      (assignment) =>
        isActiveRelationship(assignment) &&
        assignment.coach_id !== assignment.member_id
    ),
    (row) => row.member_id
  );
  const activeMembershipsByCircleId = groupBy(
    memberships.filter(isActiveRelationship),
    (row) => row.circle_id
  );
  const activeCircleCoachesByCircleId = groupBy(
    circleCoaches.filter(isActiveRelationship),
    (row) => row.circle_id
  );
  const coachProfileIds = new Set(
    profileRoles
      .filter((row) => roleById.get(row.role_id)?.name === "coach")
      .map((row) => row.profile_id)
  );
  const activeProfileIds = new Set(
    profiles
      .filter((profile) => normalizeAccountStatus(profile.account_status) === "active")
      .map((profile) => profile.id)
  );
  const managedProfiles = profiles.map((profile) => {
    const profileRoles = (rolesByProfileId.get(profile.id) || [])
      .map((row) => roleById.get(row.role_id)?.name)
      .filter(isAdminRoleName);

    return {
      id: profile.id,
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      email: emailByUserId.get(profile.id) || "",
      organization: profile.organization || "",
      jobTitle: profile.job_title || "",
      timezone: profile.timezone || "",
      roles: profileRoles,
      circleIds: (activeMembershipsByProfileId.get(profile.id) || []).map(
        (membership) => membership.circle_id
      ),
      coachIds: (activeAssignmentsByMemberId.get(profile.id) || []).map(
        (assignment) => assignment.coach_id
      ),
      primaryCoachId:
        (activeAssignmentsByMemberId.get(profile.id) || []).find(
          (assignment) => assignment.is_primary
        )?.coach_id || null,
      accountStatus: normalizeAccountStatus(profile.account_status),
      statusChangedAt: profile.status_changed_at,
      deactivatedAt: profile.deactivated_at,
      archivedAt: profile.archived_at,
      statusReason: profile.status_reason || "",
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  });

  return {
    ok: true,
    currentAdminId,
    roleOptions: managedRoleNames
      .map((roleName) => {
        const role = roleByName(roles, roleName);

        if (!role) return null;

        return {
          name: roleName,
          label: role.label || fallbackRoleLabels[roleName],
        };
      })
      .filter((role): role is { name: AdminRoleName; label: string } =>
        Boolean(role)
      ),
    circles: circles.map((circle) => ({
      id: circle.id,
      name: circle.name,
      description: circle.description || "",
      status: circle.status || "",
      memberIds: (activeMembershipsByCircleId.get(circle.id) || []).map(
        (membership) => membership.profile_id
      ),
      coachIds: (activeCircleCoachesByCircleId.get(circle.id) || [])
        .map((relationship) => relationship.coach_id)
        .filter(
          (profileId) =>
            coachProfileIds.has(profileId) && activeProfileIds.has(profileId)
        ),
    })),
    coaches: profiles
      .filter((profile) => coachProfileIds.has(profile.id))
      .map((profile) => ({
        id: profile.id,
        name: formatProfileName(profile, emailByUserId.get(profile.id) || "Unknown"),
        email: emailByUserId.get(profile.id) || "",
        organization: profile.organization || "",
        accountStatus: normalizeAccountStatus(profile.account_status),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    users: managedProfiles,
  };
}

async function updateCircleMembersForCircle({
  circleId,
  requestedMemberIds,
  currentMemberships,
  timestamp,
}: {
  circleId: string;
  requestedMemberIds: string[];
  currentMemberships: CircleMembershipRow[];
  timestamp: string;
}) {
  const supabase = createAdminSupabaseClient();
  const activeMemberships = currentMemberships.filter(isActiveRelationship);
  const activeMemberIds = new Set(
    activeMemberships.map((membership) => membership.profile_id)
  );
  const requestedMemberIdSet = new Set(requestedMemberIds);
  const memberIdsToAdd = requestedMemberIds.filter(
    (profileId) => !activeMemberIds.has(profileId)
  );
  const membershipIdsToEnd = activeMemberships
    .filter((membership) => !requestedMemberIdSet.has(membership.profile_id))
    .map((membership) => membership.id);

  if (memberIdsToAdd.length > 0) {
    const { error } = await supabase.from("circle_memberships").insert(
      memberIdsToAdd.map((profileId) => ({
        circle_id: circleId,
        profile_id: profileId,
        status: "active",
        joined_at: timestamp,
      }))
    );

    if (error) {
      console.error("Admin Supabase mutation failed: add Circle members", error);
      throw new Error("Unable to add selected Circle members.");
    }
  }

  if (membershipIdsToEnd.length > 0) {
    const { error } = await supabase
      .from("circle_memberships")
      .update({
        status: "completed",
        ended_at: timestamp,
      })
      .in("id", membershipIdsToEnd);

    if (error) {
      console.error("Admin Supabase mutation failed: end Circle members", error);
      throw new Error("Unable to end deselected Circle members.");
    }
  }
}

async function updateCircleCoachesForCircle({
  circleId,
  requestedCoachIds,
  currentCircleCoaches,
  timestamp,
}: {
  circleId: string;
  requestedCoachIds: string[];
  currentCircleCoaches: CircleCoachRow[];
  timestamp: string;
}) {
  const supabase = createAdminSupabaseClient();
  const activeRelationships = currentCircleCoaches.filter(isActiveRelationship);
  const activeCoachIds = new Set(
    activeRelationships.map((relationship) => relationship.coach_id)
  );
  const requestedCoachIdSet = new Set(requestedCoachIds);
  const coachIdsToAdd = requestedCoachIds.filter(
    (coachId) => !activeCoachIds.has(coachId)
  );
  const relationshipIdsToEnd = activeRelationships
    .filter((relationship) => !requestedCoachIdSet.has(relationship.coach_id))
    .map((relationship) => relationship.id);

  if (coachIdsToAdd.length > 0) {
    const { error } = await supabase.from("circle_coaches").insert(
      coachIdsToAdd.map((coachId) => ({
        circle_id: circleId,
        coach_id: coachId,
        status: "active",
        assigned_at: timestamp,
      }))
    );

    if (error) {
      console.error("Admin Supabase mutation failed: add Circle coaches", error);
      throw new Error("Unable to add selected Circle coaches.");
    }
  }

  if (relationshipIdsToEnd.length > 0) {
    const { error } = await supabase
      .from("circle_coaches")
      .update({
        status: "completed",
        ended_at: timestamp,
      })
      .in("id", relationshipIdsToEnd);

    if (error) {
      console.error("Admin Supabase mutation failed: end Circle coaches", error);
      throw new Error("Unable to end deselected Circle coaches.");
    }
  }
}

async function updateProfileRoles({
  profileId,
  requestedRoleIds,
  currentRoles,
  timestamp,
}: {
  profileId: string;
  requestedRoleIds: string[];
  currentRoles: ProfileRoleRow[];
  timestamp: string;
}) {
  const supabase = createAdminSupabaseClient();
  const currentRoleIds = new Set(currentRoles.map((row) => row.role_id));
  const requestedRoleIdSet = new Set(requestedRoleIds);
  const roleIdsToAdd = requestedRoleIds.filter((roleId) => !currentRoleIds.has(roleId));
  const roleIdsToRemove = currentRoles
    .map((row) => row.role_id)
    .filter((roleId) => !requestedRoleIdSet.has(roleId));

  if (roleIdsToAdd.length > 0) {
    const { error } = await supabase
      .from("profile_roles")
      .upsert(
        roleIdsToAdd.map((roleId) => ({
          profile_id: profileId,
          role_id: roleId,
          assigned_at: timestamp,
        })),
        { onConflict: "profile_id,role_id", ignoreDuplicates: true }
      );

    if (error) {
      console.error("Admin Supabase mutation failed: add profile roles", error);
      throw new Error("Unable to add selected roles.");
    }
  }

  if (roleIdsToRemove.length > 0) {
    const { error } = await supabase
      .from("profile_roles")
      .delete()
      .eq("profile_id", profileId)
      .in("role_id", roleIdsToRemove);

    if (error) {
      console.error("Admin Supabase mutation failed: remove profile roles", error);
      throw new Error("Unable to remove deselected roles.");
    }
  }
}

async function updateCircleMemberships({
  profileId,
  requestedCircleIds,
  currentMemberships,
  timestamp,
}: {
  profileId: string;
  requestedCircleIds: string[];
  currentMemberships: CircleMembershipRow[];
  timestamp: string;
}) {
  const supabase = createAdminSupabaseClient();
  const activeMemberships = currentMemberships.filter(isActiveRelationship);
  const activeCircleIds = new Set(
    activeMemberships.map((membership) => membership.circle_id)
  );
  const requestedCircleIdSet = new Set(requestedCircleIds);
  const circleIdsToAdd = requestedCircleIds.filter(
    (circleId) => !activeCircleIds.has(circleId)
  );
  const membershipIdsToEnd = activeMemberships
    .filter((membership) => !requestedCircleIdSet.has(membership.circle_id))
    .map((membership) => membership.id);

  if (circleIdsToAdd.length > 0) {
    const { error } = await supabase.from("circle_memberships").insert(
      circleIdsToAdd.map((circleId) => ({
        circle_id: circleId,
        profile_id: profileId,
        status: "active",
        joined_at: timestamp,
      }))
    );

    if (error) {
      console.error("Admin Supabase mutation failed: add Circle memberships", error);
      throw new Error("Unable to add selected Circle memberships.");
    }
  }

  if (membershipIdsToEnd.length > 0) {
    const { error } = await supabase
      .from("circle_memberships")
      .update({
        status: "completed",
        ended_at: timestamp,
      })
      .in("id", membershipIdsToEnd);

    if (error) {
      console.error("Admin Supabase mutation failed: end Circle memberships", error);
      throw new Error("Unable to end deselected Circle memberships.");
    }
  }
}

async function updateCoachAssignments({
  profileId,
  requestedCoachIds,
  primaryCoachId,
  currentAssignments,
  timestamp,
}: {
  profileId: string;
  requestedCoachIds: string[];
  primaryCoachId: string | null;
  currentAssignments: CoachAssignmentRow[];
  timestamp: string;
}) {
  const supabase = createAdminSupabaseClient();
  const activeAssignments = currentAssignments.filter(isActiveRelationship);
  // Do not expose or mutate the known compatibility self-assignment. A later
  // controlled migration will retire it after circle_coaches verification.
  const managedActiveAssignments = activeAssignments.filter(
    (assignment) => assignment.coach_id !== assignment.member_id
  );
  const activeCoachIds = new Set(
    managedActiveAssignments.map((assignment) => assignment.coach_id)
  );
  const requestedCoachIdSet = new Set(requestedCoachIds);
  const coachIdsToAdd = requestedCoachIds.filter(
    (coachId) => !activeCoachIds.has(coachId)
  );
  const assignmentIdsToEnd = managedActiveAssignments
    .filter((assignment) => !requestedCoachIdSet.has(assignment.coach_id))
    .map((assignment) => assignment.id);

  if (coachIdsToAdd.length > 0) {
    const { error } = await supabase.from("coach_assignments").insert(
      coachIdsToAdd.map((coachId) => ({
        coach_id: coachId,
        member_id: profileId,
        status: "active",
        assigned_at: timestamp,
        is_primary: coachId === primaryCoachId,
      }))
    );

    if (error) {
      console.error("Admin Supabase mutation failed: add coach assignments", error);
      throw new Error("Unable to add selected coach assignments.");
    }
  }

  const existingAssignmentPrimaryUpdates = managedActiveAssignments.filter(
    (assignment) =>
      requestedCoachIdSet.has(assignment.coach_id) &&
      assignment.is_primary !== (assignment.coach_id === primaryCoachId)
  );

  for (const assignment of existingAssignmentPrimaryUpdates) {
    const { error } = await supabase
      .from("coach_assignments")
      .update({
        is_primary: assignment.coach_id === primaryCoachId,
      })
      .eq("id", assignment.id);

    if (error) {
      console.error(
        "Admin Supabase mutation failed: update primary coach",
        error
      );
      throw new Error("Unable to update the primary coach.");
    }
  }

  if (assignmentIdsToEnd.length > 0) {
    const { error } = await supabase
      .from("coach_assignments")
      .update({
        status: "completed",
        ended_at: timestamp,
        is_primary: false,
      })
      .in("id", assignmentIdsToEnd);

    if (error) {
      console.error("Admin Supabase mutation failed: end coach assignments", error);
      throw new Error("Unable to end deselected coach assignments.");
    }
  }
}

async function getActiveCoachIds(coachRoleId: string, extraCoachIds: string[] = []) {
  if (!coachRoleId) return new Set(extraCoachIds);

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("profile_roles")
    .select("profile_id")
    .eq("role_id", coachRoleId);

  if (error) {
    console.error("Admin Supabase query failed: validate selected coaches", error);
    throw new Error("Unable to validate selected coaches.");
  }

  return new Set([
    ...(data || []).map((row) => row.profile_id as string),
    ...extraCoachIds,
  ]);
}

async function fetchAllAuthUsers() {
  const supabase = createAdminSupabaseClient();
  const perPage = 1000;
  const users: AdminUserSummary[] = [];

  for (let page = 1; page < 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error("Admin Supabase auth query failed: list users", error);
      throw new Error("Unable to load registered users.");
    }

    users.push(...data.users.map(formatAuthUser));

    if (data.users.length < perPage) break;
  }

  return users;
}

function formatAuthUser(user: User): AdminUserSummary {
  return {
    id: user.id,
    email: user.email || "",
  };
}

function roleByName(roles: RoleRow[], roleName: AdminRoleName) {
  return roles.find((role) => role.name === roleName);
}

function formatProfileName(profile: ProfileRow, fallback: string) {
  const name = [profile.first_name, profile.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  return name || fallback;
}

function cleanProfileUpdate(profile: AdminProfileUpdate) {
  return {
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    organization: profile.organization.trim(),
    jobTitle: profile.jobTitle.trim(),
    timezone: profile.timezone.trim(),
  };
}

function validateProfileUpdate(profile: AdminProfileUpdate) {
  if (!profile.firstName) return "First name is required.";
  if (!profile.lastName) return "Last name is required.";
  if (profile.timezone && !isValidTimeZone(profile.timezone)) {
    return "Timezone must be a valid IANA timezone, such as America/New_York.";
  }

  return "";
}

function normalizeAccountStatus(value: string | null): AdminAccountStatus {
  if (value === "deactivated" || value === "archived") return value;
  return "active";
}

function isMissingLifecycleColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const values = Object.values(error as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return values.includes("account_status") && values.includes("column");
}

function isValidTimeZone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function isAdminRoleName(value: string | undefined): value is AdminRoleName {
  return managedRoleNames.includes(value as AdminRoleName);
}

function isActiveRelationship(row: {
  status: string | null;
  ended_at: string | null;
}) {
  return row.status === "active" && !row.ended_at;
}

function logSupabaseErrors(label: string, responses: Array<{ error: unknown }>) {
  responses.forEach((response, index) => {
    if (!response.error) return;

    console.error(`Admin Supabase query failed: ${label} [${index}]`, response.error);
  });
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
    return groups;
  }, new Map<string, T[]>());
}

function unique<T extends string>(values: T[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
