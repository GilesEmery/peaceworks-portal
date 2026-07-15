import { createClient, type User } from "@supabase/supabase-js";

import type { IdentityType, ProcessingStyle, ResponseType } from "../peaceAssessmentScoring";

export type AdminAuthResult =
  | {
      ok: true;
      user: User;
      email: string;
    }
  | {
      ok: false;
      status: 401 | 403 | 503;
      message: string;
    };

export type AdminAssessmentRow = {
  id: string;
  user_id: string;
  created_at: string | null;
  completed_at?: string | null;
  peace_profile: string | null;
  base_pattern: string | null;
  identity_type: IdentityType | null;
  secondary_identity_type: IdentityType | null;
  response_type: ResponseType | null;
  processing_style: ProcessingStyle | null;
  capacity_stage: string | null;
  scores: unknown;
  answers: unknown;
};

export type AdminProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

export function getAdminEmails() {
  return new Set(
    (process.env.PEACEWORKS_ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string) {
  const adminEmails = getAdminEmails();

  if (adminEmails.size === 0) return false;

  return adminEmails.has(email.trim().toLowerCase());
}

export async function requireAdminFromRequest(
  request: Request
): Promise<AdminAuthResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return {
      ok: false,
      status: 503,
      message: "Authentication is not configured.",
    };
  }

  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
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
      message: "Authentication is required.",
    };
  }

  if (!isAdminEmail(email)) {
    return {
      ok: false,
      status: 403,
      message: "Admin access is required.",
    };
  }

  const profileStatus = await getAdminProfileStatus(user.id);

  if (!profileStatus.ok) return profileStatus;

  if (profileStatus.accountStatus !== "active") {
    return {
      ok: false,
      status: 403,
      message: "This admin account is not active.",
    };
  }

  return {
    ok: true,
    user,
    email,
  };
}

async function getAdminProfileStatus(userId: string): Promise<
  | { ok: true; accountStatus: "active" | "deactivated" | "archived" }
  | { ok: false; status: 503; message: string }
  | { ok: false; status: 403; message: string }
> {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id, account_status")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      if (isMissingLifecycleColumnError(profileError)) {
        console.warn(
          "Admin authorization lifecycle columns are not available yet; requiring profile existence only."
        );

        return getAdminProfileExistenceStatus(userId);
      }

      console.error("Admin authorization profile status check failed", profileError);

      return {
        ok: false,
        status: 503,
        message: "Admin authorization could not be verified.",
      };
    }

    if (!profile) {
      return {
        ok: false,
        status: 403,
        message: "Admin profile is required.",
      };
    }

    return {
      ok: true,
      accountStatus: normalizeAccountStatus(profile.account_status),
    };
  } catch (error) {
    console.error("Admin authorization status check failed", error);

    return {
      ok: false,
      status: 503,
      message: "Admin authorization could not be verified.",
    };
  }
}

async function getAdminProfileExistenceStatus(userId: string): Promise<
  | { ok: true; accountStatus: "active" }
  | { ok: false; status: 503; message: string }
  | { ok: false; status: 403; message: string }
> {
  const adminSupabase = createAdminSupabaseClient();
  const { data: profile, error } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Admin authorization profile existence check failed", error);

    return {
      ok: false,
      status: 503,
      message: "Admin authorization could not be verified.",
    };
  }

  if (!profile) {
    return {
      ok: false,
      status: 403,
      message: "Admin profile is required.",
    };
  }

  return {
    ok: true,
    accountStatus: "active",
  };
}

export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin environment is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function adminErrorResponse(auth: Exclude<AdminAuthResult, { ok: true }>) {
  return Response.json(
    {
      ok: false,
      message: auth.message,
    },
    { status: auth.status }
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

function isMissingLifecycleColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const values = Object.values(error as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return values.includes("account_status") && values.includes("column");
}
