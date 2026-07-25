import "server-only";

import { Resend } from "resend";

import { createAdminSupabaseClient } from "../admin/authorization";
import { resolveCommunicationAudienceProfileIds } from "../messaging/service";

const SITE_URL = "https://peaceworks.network";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEND_CONCURRENCY = 5;

type CommunicationEmailRow = {
  id: string;
  title: string | null;
  summary: string | null;
  body_content: string | null;
  audience_scope: string | null;
  reply_to_email: string | null;
  status: string | null;
};

export type CommunicationEmailDeliveryResult = {
  requested: number;
  accepted: number;
  skipped: number;
  failed: number;
};

let resendClient: Resend | null = null;

export async function deliverCommunicationEmail(
  communicationId: string
): Promise<CommunicationEmailDeliveryResult | null> {
  const supabase = createAdminSupabaseClient();
  const [{ data: communication, error }, { data: channels, error: channelError }] =
    await Promise.all([
      supabase
        .from("communications")
        .select("id,title,summary,body_content,audience_scope,reply_to_email,status")
        .eq("id", communicationId)
        .single(),
      supabase
        .from("communication_channels")
        .select("channel")
        .eq("communication_id", communicationId),
    ]);

  if (error || channelError) {
    throw new Error(
      error?.message || channelError?.message || "Email communication could not be loaded."
    );
  }
  if (!(channels || []).some((row) => row.channel === "email")) return null;
  if (communication.status !== "published") return null;

  const profileIds = await resolveCommunicationAudienceProfileIds(
    communicationId,
    communication.audience_scope || "all_members"
  );
  const emails = await resolveAuthEmails(profileIds);

  return sendPeaceWorksEmails(
    emails,
    communication as CommunicationEmailRow
  );
}

export async function sendCommunicationTestEmail(input: {
  recipientEmail: string;
  title: string;
  message: string;
}) {
  const recipient = normalizeEmail(input.recipientEmail);
  if (!recipient) throw new Error("Your Admin account does not have a valid email address.");

  return sendPeaceWorksEmails([recipient], {
    id: "test",
    title: input.title,
    summary: null,
    body_content: input.message,
    audience_scope: "admins",
    reply_to_email: null,
    status: "published",
  });
}

export function formatEmailDeliverySummary(result: CommunicationEmailDeliveryResult) {
  const parts = [
    `Email accepted for sending to ${result.accepted} recipient${result.accepted === 1 ? "" : "s"}.`,
  ];
  if (result.skipped > 0) {
    parts.push(
      `${result.skipped} recipient${result.skipped === 1 ? " was" : "s were"} skipped because the email address was missing, invalid, or duplicated.`
    );
  }
  if (result.failed > 0) {
    parts.push(
      `${result.failed} email submission${result.failed === 1 ? "" : "s"} failed.`
    );
  }
  return parts.join(" ");
}

async function sendPeaceWorksEmails(
  recipientEmails: string[],
  communication: CommunicationEmailRow
): Promise<CommunicationEmailDeliveryResult> {
  const client = getResendClient();
  const sender = getSenderIdentity();
  const title = cleanText(communication.title) || "A message from PeaceWorks";
  const message = cleanText(communication.body_content || communication.summary) || title;
  const uniqueRecipients = Array.from(
    new Set(recipientEmails.map(normalizeEmail).filter(Boolean))
  ) as string[];
  const skipped = recipientEmails.length - uniqueRecipients.length;
  let accepted = 0;
  let failed = 0;

  for (let index = 0; index < uniqueRecipients.length; index += SEND_CONCURRENCY) {
    const batch = uniqueRecipients.slice(index, index + SEND_CONCURRENCY);
    const results = await Promise.all(
      batch.map((recipient) =>
        client.emails.send({
          from: sender,
          to: recipient,
          subject: title,
          text: buildPlainText(title, message),
          html: buildHtml(title, message),
          replyTo: normalizeEmail(communication.reply_to_email || "") || undefined,
        })
      )
    );

    results.forEach((result) => {
      if (result.error) failed += 1;
      else accepted += 1;
    });
  }

  return {
    requested: recipientEmails.length,
    accepted,
    skipped,
    failed,
  };
}

async function resolveAuthEmails(profileIds: string[]) {
  const requestedIds = new Set(profileIds);
  const resolved = new Map<string, string>();
  if (requestedIds.size === 0) return [];

  const supabase = createAdminSupabaseClient();
  const perPage = 1000;
  for (let page = 1; page < 20 && resolved.size < requestedIds.size; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error("Recipient email addresses could not be resolved.");
    data.users.forEach((user) => {
      if (requestedIds.has(user.id) && user.email) resolved.set(user.id, user.email);
    });
    if (data.users.length < perPage) break;
  }

  return profileIds.map((profileId) => resolved.get(profileId) || "");
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("Resend email delivery is not configured.");
  resendClient ||= new Resend(apiKey);
  return resendClient;
}

function getSenderIdentity() {
  const email = normalizeEmail(process.env.RESEND_FROM_EMAIL || "");
  const name = cleanText(process.env.RESEND_FROM_NAME) || "PeaceWorks";
  if (!email) throw new Error("RESEND_FROM_EMAIL is not configured with a valid address.");
  return `${name} <${email}>`;
}

function buildPlainText(title: string, message: string) {
  return `${title}\n\n${message}\n\nVisit PeaceWorks: ${SITE_URL}\n\nYou received this message because of your PeaceWorks account or Circle participation.`;
}

function buildHtml(title: string, message: string) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  return `<!doctype html><html><body style="margin:0;background:#f5f3ec;color:#191d1a;font-family:Arial,sans-serif"><div style="max-width:640px;margin:0 auto;padding:40px 24px"><p style="color:#3a5b40;font-size:14px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">PeaceWorks</p><div style="background:#fff;border-radius:24px;padding:32px"><h1 style="margin:0 0 20px;font-size:32px;line-height:1.15">${safeTitle}</h1><p style="font-size:17px;line-height:1.65">${safeMessage}</p><p style="margin:28px 0 0"><a href="${SITE_URL}" style="display:inline-block;padding:13px 22px;border-radius:999px;background:#3a5b40;color:#fff;text-decoration:none;font-weight:700">Visit PeaceWorks</a></p></div><p style="margin:20px 0 0;color:#667068;font-size:13px;line-height:1.5">You received this message because of your PeaceWorks account or Circle participation.</p></div></body></html>`;
}

function normalizeEmail(value: string) {
  const normalized = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(normalized) ? normalized : "";
}

function cleanText(value: string | null | undefined) {
  return (value || "").replace(/\r\n/g, "\n").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
