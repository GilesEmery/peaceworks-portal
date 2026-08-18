import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanExternalRecipientEmails,
  buildEmailSendConfirmation,
  hasExplicitInternalAudience,
  getEmailActionLabel,
  mergeRecipientEmails,
  normalizeRecipientEmail,
  shouldResetComposerAfterEmailSend,
  summarizeRecipientEmails,
} from "../lib/communications/recipients.ts";

test("composer resets after email only or when every selected channel is complete", () => {
  assert.equal(shouldResetComposerAfterEmailSend(["email"], { email: "sent" }), true);
  assert.equal(
    shouldResetComposerAfterEmailSend(["email", "my_dashboard"], {
      email: "sent",
      my_dashboard: "active",
    }),
    true
  );
});

test("composer stays on a communication with unfinished portal work", () => {
  assert.equal(
    shouldResetComposerAfterEmailSend(["email", "my_dashboard"], {
      email: "sent",
      my_dashboard: "draft",
    }),
    false
  );
});

test("external-only email uses the same email-only reset decision", () => {
  const recipients = summarizeRecipientEmails([], ["outside@example.com"]);
  assert.equal(recipients.total, 1);
  assert.equal(shouldResetComposerAfterEmailSend(["email"], { email: "sent" }), true);
});

test("external recipient addresses are normalized and deduplicated", () => {
  assert.deepEqual(cleanExternalRecipientEmails([" Outside@Example.com ", "outside@example.com"]), [
    "outside@example.com",
  ]);
});

test("email action labels distinguish ready, sending, sent, and failed states", () => {
  assert.equal(getEmailActionLabel("draft", false), "Send Email");
  assert.equal(getEmailActionLabel("draft", true), "Sending...");
  assert.equal(getEmailActionLabel("sent", false), "Sent");
  assert.equal(getEmailActionLabel("failed", false), "Retry Email");
});

test("send confirmation identifies external-only, mixed, and Everyone audiences", () => {
  assert.deepEqual(buildEmailSendConfirmation("none", 0, ["outside@example.com"]), {
    title: "Send this email to 1 external recipient?",
    description: "External email: outside@example.com",
    confirmLabel: "Send Email",
  });
  assert.match(
    buildEmailSendConfirmation("selected_members", 2, ["outside@example.com"]).title,
    /2 PeaceWorks recipients and 1 external recipient/
  );
  assert.equal(
    buildEmailSendConfirmation("all_members", 127, []).title,
    "Send this email to Everyone — 127 recipients?"
  );
});

test("new communications have no implicit internal audience", () => {
  assert.equal(hasExplicitInternalAudience("none"), false);
  assert.equal(hasExplicitInternalAudience(""), false);
  assert.equal(hasExplicitInternalAudience("all_members"), true);
});

test("selected internal audiences require explicit targets", () => {
  assert.equal(hasExplicitInternalAudience("selected_members", []), false);
  assert.equal(hasExplicitInternalAudience("selected_members", ["profile-1"]), true);
  assert.equal(hasExplicitInternalAudience("selected_circles", [], []), false);
  assert.equal(hasExplicitInternalAudience("selected_circles", [], ["circle-1"]), true);
});

test("external-only and mixed summaries keep counts separate after deduplication", () => {
  assert.deepEqual(summarizeRecipientEmails([], ["outside@example.com"]), {
    internalEmails: [],
    externalEmails: ["outside@example.com"],
    total: 1,
  });
  assert.deepEqual(
    summarizeRecipientEmails(
      ["member@peaceworks.network"],
      ["MEMBER@peaceworks.network", "outside@example.com"]
    ),
    {
      internalEmails: ["member@peaceworks.network"],
      externalEmails: ["outside@example.com"],
      total: 2,
    }
  );
});

test("invalid external recipient addresses are rejected", () => {
  assert.throws(() => cleanExternalRecipientEmails(["not-an-email"]), /Invalid external email/);
  assert.equal(normalizeRecipientEmail("not-an-email"), "");
});

test("internal and external addresses are deduplicated case-insensitively", () => {
  assert.deepEqual(
    mergeRecipientEmails(["member@peaceworks.network"], [" MEMBER@peaceworks.network ", "guest@example.com"]),
    { emails: ["member@peaceworks.network", "guest@example.com"], skipped: 1 }
  );
});
