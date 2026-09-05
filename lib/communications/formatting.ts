export type CommunicationInline =
  | { type: "text"; value: string }
  | { type: "bold" | "italic"; value: string }
  | { type: "link"; value: string; url: string };

export type CommunicationBlock =
  | { type: "paragraph"; lines: CommunicationInline[][] }
  | { type: "heading"; level: 2 | 3 | 4; content: CommunicationInline[] }
  | { type: "list"; ordered: boolean; items: CommunicationInline[][] };

const BLOCK_START = /^(#{1,3})\s+|^\s*(?:[-*]\s+|\d+[.)]\s+)/;
const INLINE_MARKUP = /(\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_)/g;

export function parseCommunicationBody(value: string): CommunicationBlock[] {
  const lines = normalizeCommunicationText(value).split("\n");
  const blocks: CommunicationBlock[] = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: (heading[1].length + 1) as 2 | 3 | 4,
        content: parseInlineFormatting(heading[2]),
      });
      index += 1;
      continue;
    }

    const listItem = line.match(/^\s*(?:(\d+)[.)]|([-*]))\s+(.+)$/);
    if (listItem) {
      const ordered = Boolean(listItem[1]);
      const items: CommunicationInline[][] = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*(?:(\d+)[.)]|([-*]))\s+(.+)$/);
        if (!item || Boolean(item[1]) !== ordered) break;
        items.push(parseInlineFormatting(item[3]));
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraphLines: CommunicationInline[][] = [];
    while (index < lines.length && lines[index].trim() && !BLOCK_START.test(lines[index])) {
      paragraphLines.push(parseInlineFormatting(lines[index].trim()));
      index += 1;
    }
    if (paragraphLines.length === 0) {
      paragraphLines.push(parseInlineFormatting(line.trim()));
      index += 1;
    }
    blocks.push({ type: "paragraph", lines: paragraphLines });
  }

  return blocks;
}

export function renderCommunicationBodyHtml(value: string) {
  return parseCommunicationBody(value).map(renderBlockHtml).join("");
}

export function normalizeCommunicationText(value: string) {
  return value.replace(/\r\n?/g, "\n").trim();
}

function parseInlineFormatting(value: string): CommunicationInline[] {
  const output: CommunicationInline[] = [];
  let cursor = 0;
  for (const match of value.matchAll(INLINE_MARKUP)) {
    const position = match.index ?? 0;
    if (position > cursor) output.push({ type: "text", value: value.slice(cursor, position) });
    const token = match[0];
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link) output.push({ type: "link", value: link[1], url: link[2] });
    else if (token.startsWith("**") || token.startsWith("__")) {
      output.push({ type: "bold", value: token.slice(2, -2) });
    } else output.push({ type: "italic", value: token.slice(1, -1) });
    cursor = position + token.length;
  }
  if (cursor < value.length) output.push({ type: "text", value: value.slice(cursor) });
  return output.length ? output : [{ type: "text", value }];
}

function renderBlockHtml(block: CommunicationBlock) {
  if (block.type === "heading") {
    return `<h${block.level} style="margin:28px 0 12px;color:#1f2922;font-family:Georgia,'Times New Roman',serif;font-size:${block.level === 2 ? "24" : "20"}px;line-height:1.3">${renderInlineHtml(block.content)}</h${block.level}>`;
  }
  if (block.type === "list") {
    const tag = block.ordered ? "ol" : "ul";
    return `<${tag} style="margin:0 0 20px;padding-left:24px;color:#28322b;font-size:17px;line-height:1.65">${block.items.map((item) => `<li style="margin:0 0 8px">${renderInlineHtml(item)}</li>`).join("")}</${tag}>`;
  }
  return `<p style="margin:0 0 20px;color:#28322b;font-size:17px;line-height:1.7">${block.lines.map(renderInlineHtml).join("<br />")}</p>`;
}

function renderInlineHtml(items: CommunicationInline[]) {
  return items.map((item) => {
    const value = escapeHtml(item.value);
    if (item.type === "bold") return `<strong>${value}</strong>`;
    if (item.type === "italic") return `<em>${value}</em>`;
    if (item.type === "link") {
      return `<a href="${escapeHtml(item.url)}" style="color:#355f40;text-decoration:underline">${value}</a>`;
    }
    return value;
  }).join("");
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export type PeaceWorksEmailTemplateInput = {
  title: string;
  body: string;
  authorName?: string;
  category?: string;
  previewText?: string;
  cta?: { label: string; url: string };
  siteUrl?: string;
  headerImageUrl?: string;
  headerImageAlt?: string;
};

export function buildPeaceWorksEmailHtml(input: PeaceWorksEmailTemplateInput) {
  const configuredSiteUrl = safeHttpsUrl(input.siteUrl || "");
  const siteUrl = configuredSiteUrl
    ? new URL(configuredSiteUrl).origin
    : "https://peaceworks.network";
  const logoUrl = `${siteUrl}/brand/peaceworks-email-logo.png`;
  const ctaUrl = input.cta ? safeHttpsUrl(input.cta.url) : "";
  const cta = input.cta && ctaUrl
    ? { ...input.cta, url: ctaUrl }
    : { label: "Visit PeaceWorks", url: siteUrl };
  const metadata = [input.authorName ? `By ${input.authorName}` : "", input.category || ""]
    .filter(Boolean)
    .join(" · ");
  const preview = input.previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(input.previewText)}</div>`
    : "";
  const headerImageUrl = safeHttpsUrl(input.headerImageUrl || "");
  const headerImage = headerImageUrl
    ? `<img src="${escapeHtml(headerImageUrl)}" alt="${escapeHtml(input.headerImageAlt || "")}" width="554" style="display:block;width:100%;max-width:554px;height:auto;margin:0 0 28px;border:0;border-radius:16px">`
    : "";

  return `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head><body style="margin:0;padding:0;background:#f3f1e9;color:#1f2922;font-family:Arial,Helvetica,sans-serif">${preview}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3f1e9"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px"><tr><td align="left" style="padding:4px 0 24px"><a href="${escapeHtml(siteUrl)}" style="text-decoration:none"><img src="${escapeHtml(logoUrl)}" width="210" alt="PeaceWorks — Peace Made Practical" style="display:block;width:210px;max-width:100%;height:auto;border:0"></a></td></tr><tr><td style="background:#ffffff;border:1px solid #e2ded2;border-radius:22px;padding:40px 42px"><h1 style="margin:0 0 12px;color:#1f2922;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.18;font-weight:700">${escapeHtml(input.title)}</h1>${metadata ? `<p style="margin:0 0 28px;color:#69746c;font-size:14px;line-height:1.5">${escapeHtml(metadata)}</p>` : ""}${headerImage}${renderCommunicationBodyHtml(input.body)}<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px"><tr><td bgcolor="#355f40" style="border-radius:999px"><a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:14px 24px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:999px">${escapeHtml(cta.label || "Visit PeaceWorks")}</a></td></tr></table></td></tr><tr><td align="center" style="padding:22px 18px 0;color:#6b746d;font-size:12px;line-height:1.6"><strong style="color:#355f40">PeaceWorks</strong><br>Peace Made Practical<br><a href="${escapeHtml(siteUrl)}" style="color:#526b57;text-decoration:underline">peaceworks.network</a><br><span style="color:#858c86">You received this message because of your PeaceWorks account, Circle participation, or are a friend of PeaceWorks.</span></td></tr></table></td></tr></table></body></html>`;
}

export function buildPeaceWorksEmailText(input: PeaceWorksEmailTemplateInput) {
  const configuredSiteUrl = safeHttpsUrl(input.siteUrl || "");
  const siteUrl = configuredSiteUrl
    ? new URL(configuredSiteUrl).origin
    : "https://peaceworks.network";
  const ctaUrl = input.cta ? safeHttpsUrl(input.cta.url) : "";
  const cta = input.cta && ctaUrl
    ? { ...input.cta, url: ctaUrl }
    : { label: "Visit PeaceWorks", url: siteUrl };
  const metadata = [input.authorName ? `By ${input.authorName}` : "", input.category || ""]
    .filter(Boolean)
    .join(" · ");
  return [
    input.title,
    metadata,
    normalizeCommunicationText(input.body),
    `${cta.label || "Visit PeaceWorks"}: ${cta.url}`,
    "PeaceWorks · Peace Made Practical",
    siteUrl,
    "You received this message because of your PeaceWorks account, Circle participation, or are a friend of PeaceWorks.",
  ].filter(Boolean).join("\n\n");
}

function safeHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
