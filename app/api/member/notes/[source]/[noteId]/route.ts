import {
  memberErrorResponse,
  requireMemberFromRequest,
} from "../../../../../../lib/member/authorization";
import {
  fetchMemberVisibleNoteDetail,
  type MemberNoteDetailResponse,
} from "../../../../../../lib/member/dashboard";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ source: string; noteId: string }> }
) {
  const auth = await requireMemberFromRequest(request);
  if (!auth.ok) return memberErrorResponse(auth);

  const { source, noteId } = await context.params;
  if (!["circle", "member"].includes(source) || !noteId) {
    return Response.json(
      { ok: false, message: "Note not found." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const note = await fetchMemberVisibleNoteDetail(auth, source, noteId);
    if (!note) {
      return Response.json(
        { ok: false, message: "Note not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const response: MemberNoteDetailResponse = { ok: true, note };
    return Response.json(response, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Member note detail failed", error);
    return Response.json(
      { ok: false, message: "This note is temporarily unavailable." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
