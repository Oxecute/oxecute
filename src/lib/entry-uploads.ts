import type { SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

export const ENTRY_UPLOADS_BUCKET = "entry-uploads";
export const ENTRY_UPLOAD_MAX_FILES = 3;
export const ENTRY_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export const ENTRY_UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

/** Server-side: paths returned from Storage for this user only. */
export function assertValidUploadPathsForUser(
  paths: string[] | undefined,
  userId: string,
): string[] | null {
  if (!paths?.length) return null;
  if (paths.length > ENTRY_UPLOAD_MAX_FILES) {
    throw new Error(`At most ${ENTRY_UPLOAD_MAX_FILES} attachments.`);
  }
  const prefix = `${userId}/`;
  for (const p of paths) {
    if (
      typeof p !== "string" ||
      p.length > 512 ||
      p.includes("..") ||
      !p.startsWith(prefix)
    ) {
      throw new Error("Invalid attachment reference.");
    }
  }
  return paths;
}

export async function uploadEntryDeclarationFiles(
  supabase: SupabaseClient,
  userId: string,
  files: File[],
  labelPrefix: string,
): Promise<string[]> {
  if (files.length > ENTRY_UPLOAD_MAX_FILES) {
    throw new Error(`At most ${ENTRY_UPLOAD_MAX_FILES} files.`);
  }
  const paths: string[] = [];
  for (const file of files) {
    if (file.size > ENTRY_UPLOAD_MAX_BYTES) {
      throw new Error("Each file must be 5MB or smaller.");
    }
    const mime = file.type || "application/octet-stream";
    if (!ALLOWED_MIME.has(mime)) {
      throw new Error("Use JPG, PNG, WebP, GIF, or PDF.");
    }
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const objectPath = `${userId}/${labelPrefix}-${nanoid()}-${safe}`;
    const { error } = await supabase.storage.from(ENTRY_UPLOADS_BUCKET).upload(objectPath, file, {
      contentType: mime,
      upsert: false,
    });
    if (error) throw new Error(error.message);
    paths.push(objectPath);
  }
  return paths;
}
