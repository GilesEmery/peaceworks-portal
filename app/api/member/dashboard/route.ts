import {
  memberErrorResponse,
  requireMemberFromRequest,
} from "../../../../lib/member/authorization";
import { fetchMemberDashboard } from "../../../../lib/member/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMemberFromRequest(request);
  if (!auth.ok) return memberErrorResponse(auth);

  try {
    const dashboard = await fetchMemberDashboard(auth);
    return Response.json(dashboard, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Member dashboard aggregation failed", error);
    return Response.json(
      {
        ok: false,
        error: "member_dashboard_unavailable",
        code: "member_dashboard_unavailable",
        message: "Your dashboard is temporarily unavailable.",
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
