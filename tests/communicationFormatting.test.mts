import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPeaceWorksEmailHtml,
  buildPeaceWorksEmailText,
  parseCommunicationBody,
  renderCommunicationBodyHtml,
} from "../lib/communications/formatting.ts";

const paragraphs = "Paragraph one.\n\nParagraph two.\n\nParagraph three.";

test("plain-text blank lines become semantic paragraphs for portal and email rendering", () => {
  const blocks = parseCommunicationBody(paragraphs);
  const html = renderCommunicationBodyHtml(paragraphs);
  const email = buildPeaceWorksEmailHtml({ title: "Example", body: paragraphs });

  assert.equal(blocks.length, 3);
  assert.ok(blocks.every((block) => block.type === "paragraph"));
  assert.equal(html.match(/<p /g)?.length, 3);
  assert.equal(email.match(/<p /g)?.length, 3);
});

test("a single line break remains a line break inside one paragraph", () => {
  const html = renderCommunicationBodyHtml("First line\nSecond line");
  assert.equal(html.match(/<p /g)?.length, 1);
  assert.match(html, /First line<br \/>Second line/);
});

test("authored HTML is escaped rather than executed", () => {
  const html = renderCommunicationBodyHtml('<script>alert("test")</script>');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(&quot;test&quot;\)&lt;\/script&gt;/);
});

test("safe formatting supports headings, emphasis, links, and both list types", () => {
  const html = renderCommunicationBodyHtml(
    "## Heading\n\n**Bold** and *italic* with [PeaceWorks](https://peaceworks.network/about).\n\n- One\n- Two\n\n1. First\n2. Second"
  );
  assert.match(html, /<h3 /);
  assert.match(html, /<strong>Bold<\/strong>/);
  assert.match(html, /<em>italic<\/em>/);
  assert.match(html, /href="https:\/\/peaceworks\.network\/about"/);
  assert.match(html, /<ul /);
  assert.match(html, /<ol /);
});

test("legacy plain text remains readable without requiring edits", () => {
  const text = buildPeaceWorksEmailText({ title: "Legacy", body: paragraphs });
  assert.match(text, /Paragraph one\.\n\nParagraph two\.\n\nParagraph three\./);
});

test("email shell includes branding, absolute logo, metadata, configured CTA, and footer", () => {
  const html = buildPeaceWorksEmailHtml({
    title: "The Problems I Invent",
    body: paragraphs,
    authorName: "PeaceWorks Team",
    category: "Founder Circle",
    cta: { label: "Read more", url: "https://peaceworks.network/my-dashboard?from=email" },
  });
  assert.match(html, /The Problems I Invent/);
  assert.match(html, /By PeaceWorks Team · Founder Circle/);
  assert.match(html, /https:\/\/peaceworks\.network\/brand\/peaceworks-email-logo\.png/);
  assert.match(html, /href="https:\/\/peaceworks\.network\/my-dashboard\?from=email"/);
  assert.match(html, />Read more<\/a>/);
  assert.match(html, /align="left" style="padding:4px 0 24px"/);
  assert.match(html, /Peace Made Practical/);
  assert.match(
    html,
    /You received this message because of your PeaceWorks account, Circle participation, or are a friend of PeaceWorks\./
  );
});

test("email shell renders an escaped HTTPS header image before body content", () => {
  const html = buildPeaceWorksEmailHtml({
    title: "Image example",
    body: "Body copy",
    headerImageUrl: "https://example.com/header.png?token=signed",
    headerImageAlt: 'A gathering of people <listening> & learning "together"',
  });

  assert.match(html, /<img src="https:\/\/example\.com\/header\.png\?token=signed"/);
  assert.match(html, /alt="A gathering of people &lt;listening&gt; &amp; learning &quot;together&quot;"/);
  assert.ok(html.indexOf("header.png") < html.indexOf("Body copy"));
});

test("email shell omits unsafe image URLs and uses blank alt text when requested", () => {
  const unsafeHtml = buildPeaceWorksEmailHtml({
    title: "Unsafe image",
    body: "Body copy",
    headerImageUrl: "javascript:alert(1)",
  });
  const decorativeHtml = buildPeaceWorksEmailHtml({
    title: "Decorative image",
    body: "Body copy",
    headerImageUrl: "https://example.com/decorative.png",
  });

  assert.doesNotMatch(unsafeHtml, /javascript:alert/);
  assert.match(decorativeHtml, /src="https:\/\/example\.com\/decorative\.png" alt=""/);
});
