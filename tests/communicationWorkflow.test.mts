import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentStudioUrl = new URL("../lib/admin/contentStudio.ts", import.meta.url);
const emailUrl = new URL("../lib/communications/email.ts", import.meta.url);
const portalUrl = new URL("../lib/messaging/service.ts", import.meta.url);
const adminDashboardUrl = new URL("../components/admin/AdminDashboard.tsx", import.meta.url);

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

test("new composer state has no audience while edit restores the saved audience", async () => {
  const source = await readFile(adminDashboardUrl, "utf8");
  assert.match(source, /const emptyForm = \{[\s\S]*?audienceScope: "none"/);
  assert.match(source, /audienceScope: communication\.audienceScope/);
  assert.doesNotMatch(source, /audienceScope: "all_members"/);
});

test("email send is confirmed and channel actions have independent audience gates", async () => {
  const source = await readFile(adminDashboardUrl, "utf8");
  assert.match(source, /requestConfirmation\(confirmation\)/);
  assert.match(
    source,
    /disabled=\{!canSendEmail \|\| isSendingEmail \|\| form\.channelStatuses\.email === "sent"\}/
  );
  assert.match(source, /disabled=\{!canPublishToPortal\}/);
  assert.match(source, /isSendingEmail/);
  assert.match(source, /form\.channelStatuses\.email === "sent"/);
  assert.match(source, /getEmailActionLabel\(form\.channelStatuses\.email, isSendingEmail\)/);
});

test("canonical sent state is loaded on edit and preserved by later saves", async () => {
  const source = await readFile(adminDashboardUrl, "utf8");
  assert.match(source, /channelStatuses: communication\.channelStatuses \|\| \{\}/);
  const studioSource = await readFile(contentStudioUrl, "utf8");
  assert.match(studioSource, /statusByChannel\.get\(channel\) \|\| "draft"/);
});
