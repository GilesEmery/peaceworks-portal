import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanExternalRecipientEmails,
  mergeRecipientEmails,
  normalizeRecipientEmail,
} from "../lib/communications/recipients.ts";

test("external recipient addresses are normalized and deduplicated", () => {
  assert.deepEqual(cleanExternalRecipientEmails([" Outside@Example.com ", "outside@example.com"]), [
    "outside@example.com",
  ]);
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
