import { sendCommunicationTestEmail, formatEmailDeliverySummary } from "../../../../../../lib/communications/email";
import { adminErrorResponse, requireAdminFromRequest } from "../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const body = (await request.json()) as { title?: string; message?: string };
    const title = body.title?.trim() || "PeaceWorks test email";
    const message = body.message?.trim();
    if (!message) {
      return Response.json({ ok: false, message: "Enter a message before sending a test email." }, { status: 400 });
    }
    const delivery = await sendCommunicationTestEmail({
      recipientEmail: auth.email,
      title,
      message,
    });
    if (delivery.failed > 0 || delivery.accepted !== 1) {
      return Response.json({ ok: false, message: formatEmailDeliverySummary(delivery) }, { status: 502 });
    }
    return Response.json({ ok: true, message: formatEmailDeliverySummary(delivery), delivery });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Test email could not be submitted." },
      { status: 400 }
    );
  }
}
