import {
  deleteAdminCommunication,
  setAdminCommunicationStatus,
  updateAdminCommunication,
  type AdminContentStatus,
} from "../../../../../../lib/admin/contentStudio";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ communicationId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { communicationId } = await context.params;
    const body = await request.json();
    const communication =
      typeof body.status === "string"
        ? await setAdminCommunicationStatus(
            auth.user.id,
            communicationId,
            body.status as AdminContentStatus
          )
        : await updateAdminCommunication(auth.user.id, communicationId, body);

    return Response.json({ ok: true, communication });
  } catch (error) {
    console.error("Admin communication update failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Communication could not be updated." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ communicationId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { communicationId } = await context.params;
    await deleteAdminCommunication(communicationId);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin communication delete failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Communication could not be deleted." },
      { status: 400 }
    );
  }
}
