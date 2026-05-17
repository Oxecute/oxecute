import { customAlphabet } from "nanoid";

const suffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 4);

export function suggestUsernameFromStartup(startupName: string): string {
  const base = startupName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 14);
  const safe = base.length >= 3 ? base : "founder";
  return `${safe}-${suffix()}`;
}
