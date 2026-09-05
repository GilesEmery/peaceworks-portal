import "server-only";

import { createAdminSupabaseClient } from "../admin/authorization";

export const communicationStorageBucket = "peaceworks-communications";

const ADMIN_PREVIEW_EXPIRY_SECONDS = 60 * 60;
const EMAIL_IMAGE_EXPIRY_SECONDS = 60 * 60 * 24 * 365;

export function createCommunicationImagePreviewUrl(storagePath: string) {
  return createSignedCommunicationImageUrl(storagePath, ADMIN_PREVIEW_EXPIRY_SECONDS);
}

export function createCommunicationEmailImageUrl(storagePath: string) {
  return createSignedCommunicationImageUrl(storagePath, EMAIL_IMAGE_EXPIRY_SECONDS);
}

async function createSignedCommunicationImageUrl(
  storagePath: string,
  expiresIn: number
) {
  const path = storagePath.trim();
  if (!path) return "";

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.storage
    .from(communicationStorageBucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    console.warn("Communication image signed URL could not be created", error);
    return "";
  }

  return data.signedUrl;
}
