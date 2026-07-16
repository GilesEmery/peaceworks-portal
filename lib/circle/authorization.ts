import { createClient, type User } from "@supabase/supabase-js";

import {
  createAdminSupabaseClient,
  isAdminEmail,
} from "../admin/authorization";

export type CircleAuthResult =
  | {
      ok: true;
      user: User;
      email: string;
      isAdmin: boolean;
      isCircleMember: boolean;
    }
  | {
      ok: false;
      status: 401 | 403 | 503;
      code: string;
      message: string;
    };

export async function requireCircleAccessFromRequest(
  request: Request
): Promise<CircleAuthResult> {
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

  const profileStatus = await getCircleProfileStatus(user.id);

  if (!profileStatus.ok) return profileStatus;

  const isAdmin = isAdminEmail(email);
  const [hasCircleRole, hasActiveMembership] = await Promise.all([
    hasRole(user.id, "circle_member"),
    hasActiveCircleMembership(user.id),
  ]).catch((lookupError) => {
    console.error("Circle authorization lookup failed", lookupError);
    return [null, null] as const;
  });

  if (hasCircleRole === null || hasActiveMembership === null) {
    return {
      ok: false,
      status: 503,
      code: "circle_access_lookup_failed",
      message: "Circle access could not be verified.",
    };
  }

  const isCircleMember = hasCircleRole && hasActiveMembership;

  if (!isAdmin && !isCircleMember) {
    return {
      ok: false,
      status: 403,
      code: "circle_access_required",
      message: "Circle membership is required.",
    };
  }

  return {
    ok: true,
    user,
    email,
    isAdmin,
    isCircleMember,
  };
}

export function circleErrorResponse(
  auth: Exclude<CircleAuthResult, { ok: true }>
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

async function getCircleProfileStatus(userId: string): Promise<
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
      return getCircleProfileExistenceStatus(userId);
    }

    console.error("Circle authorization profile status check failed", error);

    return {
      ok: false,
      status: 503,
      code: "profile_status_lookup_failed",
      message: "Circle access could not be verified.",
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

async function getCircleProfileExistenceStatus(userId: string): Promise<
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
    console.error("Circle authorization profile existence check failed", error);

    return {
      ok: false,
      status: 503,
      code: "profile_lookup_failed",
      message: "Circle access could not be verified.",
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

async function hasRole(profileId: string, roleName: "circle_member") {
  const adminSupabase = createAdminSupabaseClient();
  const [roleResponse, profileRolesResponse] = await Promise.all([
    adminSupabase.from("roles").select("id, name").eq("name", roleName).maybeSingle(),
    adminSupabase
      .from("profile_roles")
      .select("profile_id, role_id")
      .eq("profile_id", profileId),
  ]);

  if (roleResponse.error || profileRolesResponse.error) {
    console.error("Circle authorization role check failed", {
      roleError: roleResponse.error,
      profileRoleError: profileRolesResponse.error,
    });
    throw new Error("Circle role check failed.");
  }

  const role = roleResponse.data as { id: string; name: string } | null;
  if (!role) return false;

  return ((profileRolesResponse.data || []) as Array<{ role_id: string }>).some(
    (profileRole) => profileRole.role_id === role.id
  );
}

async function hasActiveCircleMembership(profileId: string) {
  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from("circle_memberships")
    .select("id")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .limit(1);

  if (error) {
    console.error("Circle authorization membership check failed", error);
    throw new Error("Circle membership check failed.");
  }

  return Boolean(data?.length);
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

function isMissingLifecycleColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const values = Object.values(error as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return values.includes("account_status") && values.includes("column");
}
