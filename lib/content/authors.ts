import "server-only";

import { createAdminSupabaseClient } from "../admin/authorization";

const MAX_AUTHOR_NAME_LENGTH = 140;

export async function resolveContentAuthor(input: {
  authorProfileId?: string | null;
  authorName?: string | null;
}) {
  const profileId = (input.authorProfileId || "").trim();
  if (profileId) {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id,first_name,last_name,account_status")
      .eq("id", profileId)
      .eq("account_status", "active")
      .maybeSingle();
    if (error) throw new Error(`Author could not be verified: ${error.message}`);
    if (!data) throw new Error("The selected Author is not available.");

    const name = cleanAuthorName([data.first_name, data.last_name].filter(Boolean).join(" "));
    if (!name) throw new Error("The selected Author does not have a usable name.");
    return { authorProfileId: data.id, authorName: name };
  }

  return { authorProfileId: "", authorName: cleanAuthorName(input.authorName) };
}

function cleanAuthorName(value: string | null | undefined) {
  const name = (value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (name.length > MAX_AUTHOR_NAME_LENGTH) {
    throw new Error(`Author must be ${MAX_AUTHOR_NAME_LENGTH} characters or fewer.`);
  }
  return name;
}
