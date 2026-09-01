import { Resend } from "resend";

export const dynamic = "force-dynamic";

const FALLBACK_RECIPIENTS = [
  "matt.curts@peaceworks.network",
  "giles.emery@peaceworks.network",
];
const TOPICS = new Set([
  "General question",
  "PeaceWorks for Organizations",
  "Join a Circle",
  "Peace Assessment",
  "Relational ROI Calculator",
  "Speaking or partnership",
]);

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 20_000) {
      return Response.json({ message: "That message is too long." }, { status: 413 });
    }

    const body = await request.json() as Record<string, unknown>;
    const website = cleanText(body.website, 200);
    if (website) return Response.json({ ok: true });

    const name = cleanText(body.name, 120);
    const email = cleanEmail(body.email);
    const organization = cleanText(body.organization, 160);
    const requestedTopic = cleanText(body.topic, 80);
    const topic = TOPICS.has(requestedTopic) ? requestedTopic : "General question";
    const message = cleanText(body.message, 5000);

    if (!name || !email || !message) {
      return Response.json(
        { message: "Please include your name, email address, and message." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail = cleanEmail(process.env.RESEND_FROM_EMAIL);
    const fromName = cleanHeader(process.env.RESEND_FROM_NAME || "PeaceWorks");
    if (!apiKey || !fromEmail) {
      console.error("Public contact email is not configured.");
      return Response.json(
        { message: "Your message could not be sent right now. Please try again later." },
        { status: 503 }
      );
    }

    const recipients = getRecipients();
    const subject = `[PeaceWorks Website] ${topic} from ${cleanHeader(name)}`;
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: recipients,
      replyTo: email,
      subject,
      text: buildText({ name, email, organization, topic, message }),
      html: buildHtml({ name, email, organization, topic, message }),
    });

    if (error) {
      console.error("Public contact email send failed", error);
      return Response.json(
        { message: "Your message could not be sent right now. Please try again later." },
        { status: 502 }
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Public contact request failed", error);
    return Response.json(
      { message: "Your message could not be sent. Please check the form and try again." },
      { status: 400 }
    );
  }
}

type ContactMessage = {
  name: string;
  email: string;
  organization: string;
  topic: string;
  message: string;
};

function getRecipients() {
  const configured = (process.env.PEACEWORKS_CONTACT_EMAILS || "")
    .split(",")
    .map((value) => cleanEmail(value))
    .filter((value): value is string => Boolean(value));
  return configured.length > 0 ? [...new Set(configured)] : FALLBACK_RECIPIENTS;
}

function buildText(input: ContactMessage) {
  return [
    "NEW PEACEWORKS WEBSITE INQUIRY",
    "",
    `Topic: ${input.topic}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Organization: ${input.organization || "Not provided"}`,
    "",
    "Message",
    input.message,
    "",
    "Reply directly to this email to respond to the sender.",
  ].join("\n");
}

function buildHtml(input: ContactMessage) {
  const detail = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 16px 8px 0;color:#657d67;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;vertical-align:top">${escapeHtml(label)}</td>
      <td style="padding:8px 0;color:#111411;font-size:15px;line-height:1.5">${escapeHtml(value)}</td>
    </tr>`;

  return `<!doctype html>
  <html><body style="margin:0;background:#ecede5;font-family:Arial,sans-serif;color:#111411">
    <div style="padding:32px 16px">
      <div style="max-width:640px;margin:0 auto;overflow:hidden;border:1px solid #d6ddd2;border-radius:24px;background:#ffffff">
        <div style="padding:28px 32px;background:#111411;color:#f8f4eb">
          <div style="margin-bottom:10px;color:#b8ccb7;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">PeaceWorks</div>
          <h1 style="margin:0;font-size:28px;line-height:1.15">New PeaceWorks Website Inquiry</h1>
        </div>
        <div style="padding:28px 32px">
          <table role="presentation" style="width:100%;border-collapse:collapse">
            ${detail("Topic", input.topic)}
            ${detail("Name", input.name)}
            ${detail("Email", input.email)}
            ${detail("Organization", input.organization || "Not provided")}
          </table>
          <div style="margin-top:24px;padding-top:24px;border-top:1px solid #d6ddd2">
            <div style="margin-bottom:10px;color:#657d67;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Message</div>
            <div style="color:#293129;font-size:16px;line-height:1.65;white-space:pre-wrap">${escapeHtml(input.message)}</div>
          </div>
          <p style="margin:28px 0 0;color:#667066;font-size:13px;line-height:1.5">Reply directly to this email to respond to ${escapeHtml(input.name)}.</p>
        </div>
      </div>
    </div>
  </body></html>`;
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\r\n/g, "\n").trim().slice(0, maxLength)
    : "";
}

function cleanEmail(value: unknown) {
  const email = cleanText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function cleanHeader(value: string) {
  return value.replace(/[\r\n<>"]/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);
}
