import "server-only";

import { createClient, type User } from "@supabase/supabase-js";

import { createAdminSupabaseClient } from "../admin/authorization";

export type MemberAuthResult =
  | {
      ok: true;
      user: User;
      email: string;
    }
  | {
      ok: false;
      status: 401 | 403 | 404 | 503;
      code: string;
      message: string;
    };

export async function requireMemberFromRequest(
  request: Request
): Promise<MemberAuthResult> {
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

  const authClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);
  const email = user?.email?.trim().toLowerCase();

  if (error || !user || !email) {
    return {
      ok: false,
      status: 401,
      code: "auth_required",
      message: "Authentication is required.",
    };
  }

  const adminClient = createAdminSupabaseClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id,account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Member profile authorization failed", profileError);
    return {
      ok: false,
      status: 503,
      code: "profile_lookup_failed",
      message: "Member access could not be verified.",
    };
  }

  if (!profile) {
    return {
      ok: false,
      status: 404,
      code: "profile_not_found",
      message: "A member profile was not found.",
    };
  }

  if (profile.account_status !== "active") {
    return {
      ok: false,
      status: 403,
      code: "active_profile_required",
      message: "An active member profile is required.",
    };
  }

  return { ok: true, user, email };
}

export function memberErrorResponse(
  auth: Exclude<MemberAuthResult, { ok: true }>
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
      headers: { "Cache-Control": "no-store" },
    }
  );
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.toLowerCase().startsWith("bearer ")) return "";
  return authorization.slice("bearer ".length).trim();
}
