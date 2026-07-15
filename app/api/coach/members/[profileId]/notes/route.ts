import {
  coachErrorResponse,
  createCoachProfileNote,
  fetchCoachMember,
  requireCoachFromRequest,
  type CoachProfileNoteInput,
} from "../../../../../../lib/coach/dashboard";

export const dynamic = "force-dynamic";

type NoteBody = Partial<Record<keyof CoachProfileNoteInput, unknown>>;

export async function GET(
  request: Request,
  context: { params: Promise<{ profileId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const { profileId } = await context.params;
    const payload = profileId ? await fetchCoachMember(auth, profileId) : null;

    if (!payload) {
      return Response.json(
        { ok: false, code: "member_unavailable", message: "Member is not available." },
        { status: 404 }
      );
    }

    return Response.json({ ok: true, notes: payload.notes });
  } catch (error) {
    console.error("Coach member notes load failed", error);
    return Response.json(
      { ok: false, code: "member_notes_unavailable", message: "Member notes are unavailable." },
      { status: 503 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ profileId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const { profileId } = await context.params;
    const body = (await request.json()) as NoteBody;
    const result = await createCoachProfileNote(auth, profileId, {
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
    console.error("Coach member note create failed", error);
    return Response.json(
      { ok: false, code: "member_note_save_failed", message: "Member note could not be saved." },
      { status: 503 }
    );
  }
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}
