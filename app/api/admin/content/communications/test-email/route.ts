import { sendCommunicationTestEmail, formatEmailDeliverySummary } from "../../../../../../lib/communications/email";
import { adminErrorResponse, requireAdminFromRequest } from "../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const body = (await request.json()) as {
      title?: string;
      subject?: string;
      previewText?: string;
      message?: string;
      senderId?: string;
      replyToEmails?: string[];
      headerImagePath?: string;
      imageAltText?: string;
      authorName?: string;
      category?: string;
      links?: Array<{ label?: string; url?: string; linkStyle?: string }>;
    };
    const title = body.title?.trim();
    const subject = body.subject?.trim();
    const message = body.message?.trim();
    if (!title) {
      return Response.json({ ok: false, message: "Enter a title before sending a test email." }, { status: 400 });
    }
    if (!subject) {
      return Response.json({ ok: false, message: "Enter a subject before sending a test email." }, { status: 400 });
    }
    if (!message) {
      return Response.json({ ok: false, message: "Enter a message before sending a test email." }, { status: 400 });
    }
    if (!body.senderId) {
      return Response.json({ ok: false, message: "Choose a sender before sending a test email." }, { status: 400 });
    }
    const delivery = await sendCommunicationTestEmail({
      recipientEmail: auth.email,
      title,
      subject,
      previewText: body.previewText?.trim() || "",
      message,
      senderId: body.senderId,
      replyToEmails: body.replyToEmails || [],
      headerImagePath: body.headerImagePath?.trim() || "",
      imageAltText: body.imageAltText?.trim() || "",
      authorName: body.authorName?.trim() || "",
      category: body.category?.trim() || "",
      links: Array.isArray(body.links) ? body.links : [],
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
