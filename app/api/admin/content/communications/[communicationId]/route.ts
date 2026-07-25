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
import { formatEmailDeliverySummary } from "../../../../../../lib/communications/email";

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

    const portalDelivery =
      "portalDelivery" in communication
        ? (communication.portalDelivery as { created: boolean } | null)
        : null;
    const emailDelivery =
      "emailDelivery" in communication
        ? (communication.emailDelivery as Parameters<typeof formatEmailDeliverySummary>[0] | null)
        : null;
    const deliveryMessages = [
      portalDelivery
        ? portalDelivery.created
          ? "Site Message created."
          : "Site Message was already available."
        : "",
      emailDelivery ? formatEmailDeliverySummary(emailDelivery) : "",
    ].filter(Boolean);

    return Response.json({
      ok: true,
      communication,
      message: deliveryMessages.join(" ") || "Communication was updated.",
    });
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
