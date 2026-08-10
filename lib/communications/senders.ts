import "server-only";

import { createAdminSupabaseClient, isAdminEmail } from "../admin/authorization";

const EMAIL_PATTERN = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+$/i;
export const MAX_REPLY_TO_RECIPIENTS = 5;
const ELIGIBLE_SENDER_ROLES = new Set(["admin", "coach", "project_manager"]);

export type ResolvedCommunicationSender = {
  id: string;
  displayName: string;
  email: string;
  profileId: string;
  isDefault: boolean;
};

export function profileSenderValue(profileId: string) {
  return `profile:${profileId}`;
}

export function normalizeReplyToEmails(values: unknown, fallback = "") {
  const candidates = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? parseStoredReplyToEmails(values)
      : [];
  const normalized = Array.from(
    new Set(candidates.map((value) => String(value).trim().toLowerCase()).filter(Boolean))
  );

  if (normalized.length === 0 && fallback) normalized.push(fallback.trim().toLowerCase());
  if (normalized.length > MAX_REPLY_TO_RECIPIENTS) {
    throw new Error(`Choose no more than ${MAX_REPLY_TO_RECIPIENTS} Reply-To recipients.`);
  }
  if (normalized.some((email) => email.length > 254 || !EMAIL_PATTERN.test(email))) {
    throw new Error("Enter only valid Reply-To email addresses.");
  }

  return normalized;
}

export function parseStoredReplyToEmails(value: string | null | undefined) {
  const stored = (value || "").trim();
  if (!stored) return [];

  if (stored.startsWith("[")) {
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  return [stored];
}

export function serializeReplyToEmails(emails: string[]) {
  return emails.length <= 1 ? emails[0] || "" : JSON.stringify(emails);
}

export async function fetchEligibleCommunicationSenders() {
  const supabase = createAdminSupabaseClient();
  const [{ data: profiles, error: profileError }, { data: legacy, error: legacyError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,first_name,last_name,account_status,profile_roles(roles(name))")
        .eq("account_status", "active"),
      supabase
        .from("communication_senders")
        .select("id,display_name,reply_to_email,profile_id,is_default")
        .eq("is_active", true),
    ]);

  if (profileError || legacyError) {
    throw new Error(
      `Communication senders could not be loaded: ${profileError?.message || legacyError?.message}`
    );
  }

  const authEmails = await fetchAuthEmailMap();
  const legacyByProfile = new Map(
    (legacy || []).filter((row) => row.profile_id).map((row) => [row.profile_id as string, row])
  );
  const profileSenders = (profiles || [])
    .map((profile) => {
      const email = authEmails.get(profile.id) || "";
      const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
      const saved = legacyByProfile.get(profile.id);
      if ((!hasEligibleRole(profile.profile_roles) && !isAdminEmail(email)) || !email || !displayName) {
        return null;
      }

      return {
        id: saved?.id || profileSenderValue(profile.id),
        displayName,
        email,
        profileId: profile.id,
        isDefault: Boolean(saved?.is_default),
      } satisfies ResolvedCommunicationSender;
    })
    .filter((sender): sender is ResolvedCommunicationSender => Boolean(sender));
  const representedIds = new Set(profileSenders.map((sender) => sender.id));
  const legacySenders = (legacy || [])
    .filter((row) => !row.profile_id && !representedIds.has(row.id))
    .map((row) => ({
      id: row.id,
      displayName: row.display_name || "PeaceWorks",
      email: parseStoredReplyToEmails(row.reply_to_email)[0] || "",
      profileId: "",
      isDefault: Boolean(row.is_default),
    }));

  return [...profileSenders, ...legacySenders].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault) || a.displayName.localeCompare(b.displayName)
  );
}

export async function resolveCommunicationSender(senderValue: string) {
  if (senderValue.startsWith("profile:")) {
    return ensureProfileSender(senderValue.slice("profile:".length));
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("communication_senders")
    .select("id,display_name,reply_to_email,profile_id,is_default")
    .eq("id", senderValue)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(`Communication sender could not be verified: ${error.message}`);
  if (!data) return null;

  if (data.profile_id) return resolveEligibleProfile(data.profile_id, data.id);

  return {
    id: data.id,
    displayName: data.display_name || "PeaceWorks",
    email: parseStoredReplyToEmails(data.reply_to_email)[0] || "",
    profileId: "",
    isDefault: Boolean(data.is_default),
  } satisfies ResolvedCommunicationSender;
}

async function ensureProfileSender(profileId: string) {
  const resolved = await resolveEligibleProfile(profileId);
  if (!resolved) return null;

  const supabase = createAdminSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from("communication_senders")
    .select("id")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .maybeSingle();
  if (existingError) throw new Error(`Communication sender could not be verified: ${existingError.message}`);
  if (existing) return { ...resolved, id: existing.id };

  const configuredFrom = (process.env.RESEND_FROM_EMAIL || "").trim().toLowerCase();
  const { data: created, error: createError } = await supabase
    .from("communication_senders")
    .insert({
      display_name: resolved.displayName,
      verified_from_email: configuredFrom || resolved.email,
      reply_to_email: resolved.email,
      sender_type: "person",
      profile_id: profileId,
      is_active: true,
      is_default: false,
    })
    .select("id")
    .single();
  if (createError) throw new Error(`Communication sender could not be prepared: ${createError.message}`);

  return { ...resolved, id: created.id };
}

async function resolveEligibleProfile(profileId: string, senderId = profileSenderValue(profileId)) {
  const supabase = createAdminSupabaseClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,account_status,profile_roles(roles(name))")
    .eq("id", profileId)
    .eq("account_status", "active")
    .maybeSingle();
  if (error) throw new Error(`Communication sender could not be verified: ${error.message}`);
  if (!profile) return null;

  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profileId);
  const email = authUser.user?.email?.trim().toLowerCase() || "";
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  if (
    authError ||
    (!hasEligibleRole(profile.profile_roles) && !isAdminEmail(email)) ||
    !email ||
    !EMAIL_PATTERN.test(email) ||
    !displayName
  ) return null;

  return { id: senderId, displayName, email, profileId, isDefault: false };
}

function hasEligibleRole(profileRoles: unknown) {
  if (!Array.isArray(profileRoles)) return false;
  return profileRoles.some((row) => {
    const roles = (row as { roles?: { name?: string } | Array<{ name?: string }> }).roles;
    const name = Array.isArray(roles) ? roles[0]?.name : roles?.name;
    return Boolean(name && ELIGIBLE_SENDER_ROLES.has(name));
  });
}

async function fetchAuthEmailMap() {
  const supabase = createAdminSupabaseClient();
  const emails = new Map<string, string>();
  for (let page = 1; page < 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("Communication sender emails could not be loaded.");
    data.users.forEach((user) => {
      if (user.email) emails.set(user.id, user.email.trim().toLowerCase());
    });
    if (data.users.length < 1000) break;
  }
  return emails;
}
