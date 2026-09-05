import "server-only";

import { Resend } from "resend";

import { createAdminSupabaseClient } from "../admin/authorization";
import { resolveCommunicationAudienceProfileIds } from "../messaging/service";
import {
  buildPeaceWorksEmailHtml,
  buildPeaceWorksEmailText,
} from "./formatting";
import {
  normalizeReplyToEmails,
  parseStoredReplyToEmails,
  resolveCommunicationSender,
} from "./senders";
import { mergeRecipientEmails, normalizeRecipientEmail } from "./recipients";
import { createCommunicationEmailImageUrl } from "./images";

const SITE_URL = "https://peaceworks.network";
const SEND_CONCURRENCY = 5;

type CommunicationEmailRow = {
  id: string;
  title: string | null;
  subject: string | null;
  summary: string | null;
  body_content: string | null;
  preview_text: string | null;
  author_name: string | null;
  visible_author_name: string | null;
  category: string | null;
  audience_scope: string | null;
  sender_id: string | null;
  reply_to_email: string | null;
  header_image_path: string | null;
  image_alt_text: string | null;
  status: string | null;
  links: Array<{ label: string | null; url: string | null; link_style: string | null }>;
};

export type CommunicationEmailDeliveryResult = {
  requested: number;
  accepted: number;
  skipped: number;
  failed: number;
};

let resendClient: Resend | null = null;

export async function deliverCommunicationEmail(
  communicationId: string,
  options: { allowDraft?: boolean } = {}
): Promise<CommunicationEmailDeliveryResult | null> {
  const supabase = createAdminSupabaseClient();
  const [
    { data: communication, error },
    { data: channels, error: channelError },
    { data: links, error: linkError },
  ] =
    await Promise.all([
      supabase
        .from("communications")
        .select("id,title,subject,summary,body_content,preview_text,author_name,visible_author_name,category,audience_scope,sender_id,reply_to_email,header_image_path,image_alt_text,status")
        .eq("id", communicationId)
        .single(),
      supabase
        .from("communication_channels")
        .select("channel")
        .eq("communication_id", communicationId),
      supabase
        .from("communication_links")
        .select("label,url,link_style")
        .eq("communication_id", communicationId)
        .order("sort_order", { ascending: true }),
    ]);

  if (error || channelError || linkError) {
    throw new Error(
      error?.message || channelError?.message || linkError?.message || "Email communication could not be loaded."
    );
  }
  if (!(channels || []).some((row) => row.channel === "email")) return null;
  if (!options.allowDraft && communication.status !== "published") return null;

  const profileIds = await resolveCommunicationAudienceProfileIds(
    communicationId,
    communication.audience_scope || "all_members"
  );
  const [{ data: externalRows, error: externalError }, internalEmails] = await Promise.all([
    supabase
      .from("communication_external_recipients")
      .select("email")
      .eq("communication_id", communicationId),
    resolveAuthEmails(profileIds),
  ]);
  if (externalError) throw new Error(`External recipients could not be loaded: ${externalError.message}`);
  const { emails, skipped } = mergeRecipientEmails(
    internalEmails,
    (externalRows || []).map((row) => row.email)
  );
  if (emails.length === 0) {
    throw new Error("Choose at least one valid internal or external email recipient.");
  }

  const result = await sendPeaceWorksEmails(
    emails,
    { ...communication, links: links || [] } as CommunicationEmailRow
  );
  result.requested += skipped;
  result.skipped += skipped;
  return result;
}

export async function sendCommunicationTestEmail(input: {
  recipientEmail: string;
  title: string;
  subject?: string;
  previewText?: string;
  message: string;
  senderId: string;
  replyToEmails: string[];
  headerImagePath?: string;
  imageAltText?: string;
  authorName?: string;
  category?: string;
  links?: Array<{ label?: string; url?: string; linkStyle?: string }>;
}) {
  const recipient = normalizeEmail(input.recipientEmail);
  if (!recipient) throw new Error("Your Admin account does not have a valid email address.");

  return sendPeaceWorksEmails([recipient], {
    id: "test",
    title: input.title,
    subject: input.subject || input.title,
    summary: null,
    body_content: input.message,
    preview_text: input.previewText || null,
    author_name: input.authorName || null,
    visible_author_name: null,
    category: input.category || null,
    audience_scope: "admins",
    sender_id: input.senderId,
    reply_to_email: JSON.stringify(normalizeReplyToEmails(input.replyToEmails)),
    header_image_path: input.headerImagePath || null,
    image_alt_text: input.imageAltText || null,
    status: "published",
    links: (input.links || []).map((link) => ({
      label: cleanText(link.label),
      url: cleanText(link.url),
      link_style:
        link.linkStyle === "button" || link.linkStyle === "featured" ? link.linkStyle : "text",
    })),
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
  const selectedSender = communication.sender_id
    ? await resolveCommunicationSender(communication.sender_id)
    : null;
  if (!selectedSender) throw new Error("The selected email sender is no longer eligible.");
  const sender = getSenderIdentity(selectedSender.displayName);
  const title = cleanText(communication.title) || "A message from PeaceWorks";
  const subject = cleanText(communication.subject) || title;
  const message = cleanText(communication.body_content || communication.summary) || title;
  const headerImageUrl = communication.header_image_path
    ? await createCommunicationEmailImageUrl(communication.header_image_path)
    : "";
  const ctaLink = communication.links.find(
    (link) => link.url && (link.link_style === "button" || link.link_style === "featured")
  );
  const templateInput = {
    title,
    body: message,
    previewText: cleanText(communication.preview_text),
    authorName: cleanText(communication.author_name || communication.visible_author_name),
    category: cleanText(communication.category),
    cta: ctaLink?.url
      ? { label: cleanText(ctaLink.label) || "Visit PeaceWorks", url: ctaLink.url }
      : undefined,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || SITE_URL,
    headerImageUrl,
    headerImageAlt: cleanText(communication.image_alt_text),
  };
  const { emails: uniqueRecipients, skipped } = mergeRecipientEmails(recipientEmails, []);
  let accepted = 0;
  let failed = 0;

  for (let index = 0; index < uniqueRecipients.length; index += SEND_CONCURRENCY) {
    const batch = uniqueRecipients.slice(index, index + SEND_CONCURRENCY);
    const results = await Promise.all(
      batch.map((recipient) =>
        client.emails.send({
          from: sender,
          to: recipient,
          subject,
          text: buildPeaceWorksEmailText(templateInput),
          html: buildPeaceWorksEmailHtml(templateInput),
          replyTo: normalizeReplyToEmails(
            parseStoredReplyToEmails(communication.reply_to_email),
            selectedSender.email
          ),
        })
      )
    );

    const textSnapshot = buildPeaceWorksEmailText(templateInput);
    const htmlSnapshot = buildPeaceWorksEmailHtml(templateInput);
    const deliveryRows = results.map((result, resultIndex) => {
      const error = result.error ? String(result.error.message || result.error) : null;
      if (error) failed += 1;
      else accepted += 1;
      return {
        communication_id: communication.id,
        recipient_email: batch[resultIndex],
        provider_message_id: result.data?.id || null,
        delivery_status: error ? "failed" : "accepted",
        subject_snapshot: subject,
        body_text_snapshot: textSnapshot,
        body_html_snapshot: htmlSnapshot,
        error_message: error,
      };
    });
    if (communication.id !== "test") {
      const supabase = createAdminSupabaseClient();
      const { error } = await supabase.from("communication_email_deliveries").insert(deliveryRows);
      if (error) throw new Error(`Email delivery history could not be recorded: ${error.message}`);
    }
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
  if (!apiKey) {
    throw new Error(
      "Email delivery is not configured for this environment. Add the Resend variables to .env.local and restart the development server."
    );
  }
  resendClient ||= new Resend(apiKey);
  return resendClient;
}

function getSenderIdentity(displayName: string) {
  const email = normalizeEmail(process.env.RESEND_FROM_EMAIL || "");
  const name = cleanHeaderDisplayName(displayName || process.env.RESEND_FROM_NAME) || "PeaceWorks";
  if (!email) {
    throw new Error(
      "Email delivery is not configured for this environment. Add a valid RESEND_FROM_EMAIL to .env.local and restart the development server."
    );
  }
  return `${name} <${email}>`;
}

function cleanHeaderDisplayName(value: string | null | undefined) {
  return cleanText(value).replace(/[\r\n<>\"]/g, "").replace(/\s+/g, " ").slice(0, 140);
}

const normalizeEmail = normalizeRecipientEmail;

function cleanText(value: string | null | undefined) {
  return (value || "").replace(/\r\n/g, "\n").trim();
}
