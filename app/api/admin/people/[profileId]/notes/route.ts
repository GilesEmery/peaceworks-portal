import { createAdminProfileNote } from "../../../../../../lib/admin/memberProfile";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

type NoteBody = {
  noteType?: unknown;
  body?: unknown;
  visibility?: unknown;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ profileId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) {
    return adminErrorResponse(auth);
  }

  const { profileId } = await context.params;

  if (!profileId) {
    return Response.json(
      {
        ok: false,
        message: "Profile id is required.",
      },
      { status: 400 }
    );
  }

  let body: NoteBody;

  try {
    body = (await request.json()) as NoteBody;
  } catch (error) {
    console.error("Admin profile note create failed", error);

    return Response.json(
      {
        ok: false,
        message: "Request body must be valid JSON.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await createAdminProfileNote(profileId, auth.user.id, {
      noteType: typeof body.noteType === "string" ? body.noteType : "general",
      body: typeof body.body === "string" ? body.body : "",
      visibility: typeof body.visibility === "string" ? body.visibility : "admins",
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
    console.error("Admin profile note create failed", error);

    return Response.json(
      {
        ok: false,
        message: "Profile note could not be saved.",
      },
      { status: 503 }
    );
  }
}
