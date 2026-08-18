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
