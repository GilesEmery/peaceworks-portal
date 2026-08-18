import assert from "node:assert/strict";
import test from "node:test";
import {
  applyFailedEmailSend,
  applySuccessfulEmailSend,
  getCommunicationPresentationStatus,
} from "../lib/communications/composer.ts";

const emptyComposer = {
  id: "",
  channels: ["email"],
  channelStatuses: {},
  subject: "",
  bodyContent: "",
  audienceScope: "none",
  profileIds: [] as string[],
  externalRecipientEmails: [] as string[],
};

test("successful email-only send immediately returns a blank composer", () => {
  const populated = {
    ...emptyComposer,
    id: "communication-1",
    subject: "Hello",
    bodyContent: "Sent body",
    audienceScope: "selected_members",
    profileIds: ["profile-1"],
    externalRecipientEmails: ["outside@example.com"],
  };

  const next = applySuccessfulEmailSend(populated, emptyComposer, {
    id: "communication-1",
    channels: ["email"],
    channelStatuses: { email: "sent" },
  });

  assert.deepEqual(next, emptyComposer);
  assert.equal(next.id, "");
  assert.equal(next.subject, "");
  assert.equal(next.bodyContent, "");
  assert.deepEqual(next.profileIds, []);
  assert.deepEqual(next.externalRecipientEmails, []);
  assert.equal("my_dashboard" in next.channelStatuses, false);
});

test("successful email-only send resets even without a returned Communication payload", () => {
  const populated = { ...emptyComposer, id: "communication-1", subject: "Hello" };
  assert.deepEqual(applySuccessfulEmailSend(populated, emptyComposer), emptyComposer);
});

test("combined send preserves an unfinished Site Message composer", () => {
  const populated = {
    ...emptyComposer,
    id: "communication-2",
    channels: ["email", "my_dashboard"],
    subject: "Hello",
  };
  const next = applySuccessfulEmailSend(populated, emptyComposer, {
    id: "communication-2",
    channels: ["email", "my_dashboard"],
    channelStatuses: { email: "sent", my_dashboard: "draft" },
  });

  assert.equal(next.id, "communication-2");
  assert.equal(next.subject, "Hello");
  assert.deepEqual(next.channelStatuses, { email: "sent", my_dashboard: "draft" });
});

test("failed email send preserves authored composer content", () => {
  const populated = {
    ...emptyComposer,
    subject: "Keep this subject",
    bodyContent: "Keep this body",
    profileIds: ["profile-1"],
    externalRecipientEmails: ["outside@example.com"],
  };
  const next = applyFailedEmailSend(populated, "persisted-after-failure");

  assert.equal(next.id, "persisted-after-failure");
  assert.equal(next.subject, populated.subject);
  assert.equal(next.bodyContent, populated.bodyContent);
  assert.deepEqual(next.profileIds, populated.profileIds);
  assert.deepEqual(next.externalRecipientEmails, populated.externalRecipientEmails);
  assert.equal((next.channelStatuses as Record<string, string>).email, "failed");
});

test("email-only sent history never resolves to generic Draft", () => {
  assert.equal(
    getCommunicationPresentationStatus({
      id: "communication-1",
      channels: ["email"],
      channelStatuses: { email: "sent" },
    }),
    "Email: Sent"
  );
});
