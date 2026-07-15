import { createClient, type User } from "@supabase/supabase-js";

import { createAdminSupabaseClient } from "../admin/authorization";

export type ProjectAuthResult =
  | {
      ok: true;
      user: User;
      email: string;
      isProjectManager: true;
    }
  | {
      ok: false;
      status: 401 | 403 | 503;
      code: string;
      message: string;
    };

export async function requireProjectManagerFromRequest(
  request: Request
): Promise<ProjectAuthResult> {
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

  const profileStatus = await getProjectProfileStatus(user.id);

  if (!profileStatus.ok) return profileStatus;

  const isProjectManager = await hasRole(user.id, "project_manager").catch((error) => {
    console.error("Project authorization role lookup failed", error);
    return null;
  });

  if (isProjectManager === null) {
    return {
      ok: false,
      status: 503,
      code: "role_lookup_failed",
      message: "Project Dashboard authorization could not be verified.",
    };
  }

  if (!isProjectManager) {
    return {
      ok: false,
      status: 403,
      code: "project_access_required",
      message: "Project Manager access is required.",
    };
  }

  return {
    ok: true,
    user,
    email,
    isProjectManager: true,
  };
}

export function projectErrorResponse(
  auth: Exclude<ProjectAuthResult, { ok: true }>
) {
  return Response.json(
    {
      ok: false,
      error: auth.code,
      code: auth.code,
      message: auth.message,
    },
    {
      status: auth.status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

async function getProjectProfileStatus(userId: string): Promise<
  | { ok: true; accountStatus: "active" }
  | { ok: false; status: 503; code: string; message: string }
  | { ok: false; status: 403; code: string; message: string }
> {
  const adminSupabase = createAdminSupabaseClient();
  const { data: profile, error } = await adminSupabase
    .from("profiles")
    .select("id, account_status")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingLifecycleColumnError(error)) {
      console.error(
        "Project authorization lifecycle columns are missing. Apply supabase/migrations/20260713000000_add_profile_lifecycle_fields.sql.",
        error
      );

      return {
        ok: false,
        status: 503,
        code: "profile_lifecycle_schema_missing",
        message:
          "Project Dashboard authorization requires the profile lifecycle migration.",
      };
    }

    console.error("Project authorization profile status check failed", error);

    return {
      ok: false,
      status: 503,
      code: "profile_status_lookup_failed",
      message: "Project Dashboard authorization could not be verified.",
    };
  }

  if (!profile || normalizeAccountStatus(profile.account_status) !== "active") {
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

async function hasRole(profileId: string, roleName: string) {
  const adminSupabase = createAdminSupabaseClient();
  const [rolesResponse, profileRolesResponse] = await Promise.all([
    adminSupabase.from("roles").select("id, name").eq("name", roleName).maybeSingle(),
    adminSupabase
      .from("profile_roles")
      .select("profile_id, role_id")
      .eq("profile_id", profileId),
  ]);

  if (rolesResponse.error || profileRolesResponse.error) {
    console.error("Project authorization role check failed", {
      roleError: rolesResponse.error,
      profileRoleError: profileRolesResponse.error,
    });
    throw new Error("Project Dashboard authorization could not be verified.");
  }

  const role = rolesResponse.data as { id: string; name: string } | null;

  if (!role) return false;

  return ((profileRolesResponse.data || []) as Array<{ role_id: string }>).some(
    (profileRole) => profileRole.role_id === role.id
  );
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

function isMissingLifecycleColumnError(error: { code?: string; message?: string }) {
  return (
    error.code === "42703" ||
    Boolean(
      error.message?.includes("account_status") &&
        error.message?.includes("does not exist")
    )
  );
}
