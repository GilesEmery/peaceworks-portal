import {
  coachErrorResponse,
  deleteCoachProfileNote,
  requireCoachFromRequest,
  updateCoachProfileNote,
  type CoachProfileNoteInput,
} from "../../../../../../../lib/coach/dashboard";

export const dynamic = "force-dynamic";

type NoteBody = Partial<Record<keyof CoachProfileNoteInput, unknown>>;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ profileId: string; noteId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const { profileId, noteId } = await context.params;
    const body = (await request.json()) as NoteBody;
    const result = await updateCoachProfileNote(auth, profileId, noteId, {
      noteType: getString(body.noteType),
      body: getString(body.body),
      visibility: getString(body.visibility),
    });

    if (!result.ok) {
      return Response.json(
        { ok: false, code: "member_note_invalid", message: result.message },
        { status: result.status }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("Coach member note update failed", error);
    return Response.json(
      { ok: false, code: "member_note_update_failed", message: "Member note could not be updated." },
      { status: 503 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ profileId: string; noteId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const { profileId, noteId } = await context.params;
    const result = await deleteCoachProfileNote(auth, profileId, noteId);

    if (!result.ok) {
      return Response.json(
        { ok: false, code: "member_note_unavailable", message: result.message },
        { status: result.status }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("Coach member note delete failed", error);
    return Response.json(
      { ok: false, code: "member_note_delete_failed", message: "Member note could not be deleted." },
      { status: 503 }
    );
  }
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}
