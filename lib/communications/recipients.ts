const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeRecipientEmail(value: string) {
  const normalized = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(normalized) ? normalized : "";
}

export function cleanExternalRecipientEmails(values: string[]) {
  const invalid = values.find((value) => value.trim() && !normalizeRecipientEmail(value));
  if (invalid) throw new Error(`Invalid external email address: ${invalid.trim()}`);
  return Array.from(new Set(values.map(normalizeRecipientEmail).filter(Boolean)));
}

export function mergeRecipientEmails(internal: string[], external: string[]) {
  const requested = [...internal, ...external];
  const emails = Array.from(
    new Set(requested.map(normalizeRecipientEmail).filter(Boolean))
  );
  return { emails, skipped: requested.length - emails.length };
}

export function summarizeRecipientEmails(internal: string[], external: string[]) {
  const internalEmails = Array.from(
    new Set(internal.map(normalizeRecipientEmail).filter(Boolean))
  );
  const internalSet = new Set(internalEmails);
  const externalEmails = Array.from(
    new Set(external.map(normalizeRecipientEmail).filter(Boolean))
  ).filter((email) => !internalSet.has(email));

  return {
    internalEmails,
    externalEmails,
    total: internalEmails.length + externalEmails.length,
  };
}

export function hasExplicitInternalAudience(
  audienceScope: string,
  profileIds: string[] = [],
  circleIds: string[] = []
) {
  if (!audienceScope || audienceScope === "none") return false;
  if (audienceScope === "selected_circles") return circleIds.length > 0;
  if (audienceScope === "selected_members" || audienceScope === "selected_coaches") {
    return profileIds.length > 0;
  }
  return true;
}

export function buildEmailSendConfirmation(
  audienceScope: string,
  internalCount: number,
  externalEmails: string[]
) {
  const externalCount = externalEmails.length;
  const internalLabel = `${internalCount} PeaceWorks recipient${internalCount === 1 ? "" : "s"}`;
  const externalLabel = `${externalCount} external recipient${externalCount === 1 ? "" : "s"}`;
  const title =
    audienceScope === "all_members" && externalCount === 0
      ? `Send this email to Everyone — ${internalCount} recipients?`
      : internalCount > 0 && externalCount > 0
        ? `Send this email to ${internalLabel} and ${externalLabel}?`
        : externalCount > 0
          ? `Send this email to ${externalLabel}?`
          : `Send this email to ${internalLabel}?`;

  return {
    title,
    description:
      externalCount > 0
        ? `External email${externalCount === 1 ? "" : "s"}: ${externalEmails.join(", ")}`
        : "Confirm the recipient count before sending. Email delivery cannot be recalled.",
    confirmLabel: "Send Email",
  };
}

export function getEmailActionLabel(channelStatus: string | undefined, isSending: boolean) {
  if (isSending) return "Sending...";
  if (channelStatus === "sent") return "Sent";
  if (channelStatus === "failed") return "Retry Email";
  return "Send Email";
}
