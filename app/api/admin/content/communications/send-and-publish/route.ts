import {
  CommunicationEmailSendError,
  assertCommunicationEmailAudience,
  assertCommunicationPortalAudience,
  createAdminCommunication,
  sendAdminCommunicationEmail,
  setAdminCommunicationStatus,
  updateAdminCommunication,
} from "../../../../../../lib/admin/contentStudio";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../lib/admin/authorization";
import { formatEmailDeliverySummary } from "../../../../../../lib/communications/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return adminErrorResponse(auth);

  let communicationId: string | undefined;
  let portalPublished = false;

  try {
    const body = await request.json();
    assertCommunicationEmailAudience(body);
    assertCommunicationPortalAudience(body);
    const saved = typeof body.id === "string" && body.id
      ? await updateAdminCommunication(auth.user.id, body.id, body)
      : await createAdminCommunication(auth.user.id, body);
    communicationId = saved.id;

    if (!saved.channels.includes("email") || !saved.channels.includes("my_dashboard")) {
      throw new Error("Select both Email and My Dashboard before using the combined action.");
    }

    await setAdminCommunicationStatus(auth.user.id, saved.id, "published");
    portalPublished = true;
    const communication = await sendAdminCommunicationEmail(auth.user.id, saved.id, body);

    return Response.json({
      ok: true,
      communication,
      message: `Published to the PeaceWorks portal. ${formatEmailDeliverySummary(communication.emailDelivery)}`,
    });
  } catch (error) {
    console.error("Admin communication combined delivery failed", error);
    const failedId = error instanceof CommunicationEmailSendError
      ? error.communicationId
      : communicationId;
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Communication could not be sent and published.",
        communicationId: failedId,
        emailStatus: error instanceof CommunicationEmailSendError ? "failed" : undefined,
        portalPublished,
      },
      { status: 400 }
    );
  }
}
