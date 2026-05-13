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

/** First-entry “Upload” path: larger files + Office formats (bucket limit raised in migration). */
export const FIRST_PROOF_MAX_BYTES = 10 * 1024 * 1024;

const FIRST_PROOF_MIME = new Set([
  ...ALLOWED_MIME,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-powerpoint",
  "application/vnd.ms-excel",
]);

export const FIRST_PROOF_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx";

function inferMimeFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (n.endsWith(".doc")) return "application/msword";
  if (n.endsWith(".pptx"))
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (n.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
  if (n.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (n.endsWith(".xls")) return "application/vnd.ms-excel";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  return "";
}

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

/** First entry: file-as-proof (1–3 files, 10MB each, PDF / Office / images). */
export async function uploadFirstProofFiles(
  supabase: SupabaseClient,
  userId: string,
  files: File[],
): Promise<string[]> {
  if (files.length < 1) {
    throw new Error("Choose at least one file.");
  }
  if (files.length > ENTRY_UPLOAD_MAX_FILES) {
    throw new Error(`At most ${ENTRY_UPLOAD_MAX_FILES} files.`);
  }
  const paths: string[] = [];
  for (const file of files) {
    if (file.size > FIRST_PROOF_MAX_BYTES) {
      throw new Error("Each file must be 10MB or smaller.");
    }
    const mime = file.type || inferMimeFromName(file.name);
    if (!FIRST_PROOF_MIME.has(mime)) {
      throw new Error("Use PDF, DOCX, PPTX, XLSX, PNG, JPG, WebP, or GIF.");
    }
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const objectPath = `${userId}/first-proof-${nanoid()}-${safe}`;
    const { error } = await supabase.storage.from(ENTRY_UPLOADS_BUCKET).upload(objectPath, file, {
      contentType: mime,
      upsert: false,
    });
    if (error) throw new Error(error.message);
    paths.push(objectPath);
  }
  return paths;
}
