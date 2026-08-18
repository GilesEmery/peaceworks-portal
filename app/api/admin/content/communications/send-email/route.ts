import {
  sendAdminCommunicationEmail,
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

  try {
    const body = await request.json();
    const communication = await sendAdminCommunicationEmail(
      auth.user.id,
      typeof body.id === "string" && body.id ? body.id : null,
      body
    );
    return Response.json({
      ok: true,
      communication,
      message: formatEmailDeliverySummary(communication.emailDelivery),
    });
  } catch (error) {
    console.error("Admin communication email send failed", error);
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Email could not be sent." },
      { status: 400 }
    );
  }
}
