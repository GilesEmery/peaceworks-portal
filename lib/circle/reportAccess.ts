import "server-only";

import { createAdminSupabaseClient } from "../admin/authorization";
import {
  requireCircleAccessFromRequest,
  type CircleAuthResult,
} from "./authorization";

export const FOUNDERS_CIRCLE_ID = "a658f5e2-f87f-4a4c-9082-593e966e745a";
export const CIRCLE_REPORT_BUCKET = "peaceworks-circle-reports";
export const NOVEMBER_2026_REPORT_KEY = "founders/2026-11.html";

export async function requireFoundersCircleReportAccess(
  request: Request
): Promise<CircleAuthResult> {
  const auth = await requireCircleAccessFromRequest(request);
  if (!auth.ok || auth.isAdmin) return auth;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("circle_memberships")
    .select("id")
    .eq("circle_id", FOUNDERS_CIRCLE_ID)
    .eq("profile_id", auth.user.id)
    .eq("status", "active")
    .is("ended_at", null)
    .limit(1);

  if (error) {
    console.error("Founders Circle report membership lookup failed", error);
    return {
      ok: false,
      status: 503,
      code: "report_access_lookup_failed",
      message: "Report access could not be verified.",
    };
  }

  if (!data?.length) {
    return {
      ok: false,
      status: 403,
      code: "founders_circle_access_required",
      message: "This report is available only to active Founders Circle members.",
    };
  }

  return auth;
}
