import {
  coachErrorResponse,
  createCoachCircleNote,
  fetchCoachCircle,
  requireCoachFromRequest,
  type CoachCircleNoteInput,
} from "../../../../../../lib/coach/dashboard";

export const dynamic = "force-dynamic";

type NoteBody = Partial<Record<keyof CoachCircleNoteInput, unknown>>;

export async function GET(
  request: Request,
  context: { params: Promise<{ circleId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const { circleId } = await context.params;
    const payload = circleId ? await fetchCoachCircle(auth, circleId) : null;

    if (!payload) {
      return Response.json(
        { ok: false, code: "circle_unavailable", message: "Circle is not available." },
        { status: 404 }
      );
    }

    return Response.json({ ok: true, notes: payload.notes });
  } catch (error) {
    console.error("Coach Circle notes load failed", error);
    return Response.json(
      { ok: false, code: "circle_notes_unavailable", message: "Circle notes are unavailable." },
      { status: 503 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ circleId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const { circleId } = await context.params;
    const body = (await request.json()) as NoteBody;
    const result = await createCoachCircleNote(auth, circleId, {
      noteType: getString(body.noteType),
      body: getString(body.body),
      visibility: getString(body.visibility),
      audienceType: getString(body.audienceType),
      recipientIds: getStringArray(body.recipientIds),
      links: getLinks(body.links),
      meetingDate: getString(body.meetingDate),
      followUpAt: getString(body.followUpAt),
    });

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: "circle_note_save_failed",
          code: result.code,
          message: result.message,
          details: result.details,
          hint: result.hint,
        },
        { status: result.status }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("Coach Circle note create failed", error);
    return Response.json(
      {
        ok: false,
        error: "circle_note_save_failed",
        code: "unexpected_error",
        message: "Circle note could not be saved.",
      },
      { status: 503 }
    );
  }
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getLinks(value: unknown): CoachCircleNoteInput["links"] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: getString(item.id),
      label: getString(item.label),
      url: getString(item.url),
      sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : undefined,
    }));
}
