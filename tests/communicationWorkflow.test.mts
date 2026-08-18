import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentStudioUrl = new URL("../lib/admin/contentStudio.ts", import.meta.url);
const emailUrl = new URL("../lib/communications/email.ts", import.meta.url);
const portalUrl = new URL("../lib/messaging/service.ts", import.meta.url);

test("email send persists first and does not require global publication", async () => {
  const source = await readFile(contentStudioUrl, "utf8");
  assert.match(source, /sendAdminCommunicationEmail[\s\S]*updateAdminCommunication[\s\S]*createAdminCommunication/);
  assert.match(source, /deliverCommunicationEmail\(saved\.id, \{ allowDraft: true \}\)/);
});

test("portal publication no longer triggers email delivery", async () => {
  const source = await readFile(contentStudioUrl, "utf8");
  const statusFunction = source.slice(
    source.indexOf("export async function setAdminCommunicationStatus"),
    source.indexOf("export async function sendAdminCommunicationEmail")
  );
  assert.match(statusFunction, /deliverCommunicationToPortal/);
  assert.doesNotMatch(statusFunction, /deliverCommunicationEmail\(/);
});

test("external recipients are isolated to email resolution", async () => {
  const [emailSource, portalSource] = await Promise.all([
    readFile(emailUrl, "utf8"),
    readFile(portalUrl, "utf8"),
  ]);
  assert.match(emailSource, /communication_external_recipients/);
  assert.doesNotMatch(portalSource, /communication_external_recipients/);
});

test("editing preserves the existing per-channel delivery state", async () => {
  const source = await readFile(contentStudioUrl, "utf8");
  assert.match(source, /statusByChannel\.get\(channel\) \|\| "draft"/);
});
