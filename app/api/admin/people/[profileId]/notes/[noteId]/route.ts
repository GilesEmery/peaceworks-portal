import {
  deleteAdminProfileNote,
  updateAdminProfileNote,
} from "../../../../../../../lib/admin/memberProfile";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

type NoteBody = {
  noteType?: unknown;
  body?: unknown;
  isPrivate?: unknown;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ profileId: string; noteId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) {
    return adminErrorResponse(auth);
  }

  const { profileId, noteId } = await context.params;

  if (!profileId || !noteId) {
    return Response.json(
      {
        ok: false,
        message: "Profile id and note id are required.",
      },
      { status: 400 }
    );
  }

  let body: NoteBody;

  try {
    body = (await request.json()) as NoteBody;
  } catch (error) {
    console.error("Admin profile note update failed", error);

    return Response.json(
      {
        ok: false,
        message: "Request body must be valid JSON.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await updateAdminProfileNote(profileId, noteId, {
      noteType: typeof body.noteType === "string" ? body.noteType : "general",
      body: typeof body.body === "string" ? body.body : "",
      isPrivate: body.isPrivate !== false,
    });

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          message: result.message,
        },
        { status: result.status }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("Admin profile note update failed", error);

    return Response.json(
      {
        ok: false,
        message: "Profile note could not be updated.",
      },
      { status: 503 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ profileId: string; noteId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) {
    return adminErrorResponse(auth);
  }

  const { profileId, noteId } = await context.params;

  if (!profileId || !noteId) {
    return Response.json(
      {
        ok: false,
        message: "Profile id and note id are required.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await deleteAdminProfileNote(profileId, noteId);

    return Response.json(result);
  } catch (error) {
    console.error("Admin profile note delete failed", error);

    return Response.json(
      {
        ok: false,
        message: "Profile note could not be deleted.",
      },
      { status: 503 }
    );
  }
}
