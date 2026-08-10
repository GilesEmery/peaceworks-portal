import {
  memberErrorResponse,
  requireMemberFromRequest,
} from "../../../../../lib/member/authorization";
import { fetchMemberDashboardPostDetail } from "../../../../../lib/member/dashboard";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ communicationId: string }> }
) {
  const auth = await requireMemberFromRequest(request);
  if (!auth.ok) return memberErrorResponse(auth);

  try {
    const { communicationId } = await context.params;
    const post = await fetchMemberDashboardPostDetail(auth, communicationId);
    if (!post) {
      return Response.json(
        { ok: false, message: "This post is not available." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }
    return Response.json({ ok: true, post }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Member post detail failed", error);
    return Response.json(
      { ok: false, message: "This post could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
