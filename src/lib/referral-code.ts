import { customAlphabet } from "nanoid";

const gen = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  8,
);

export function generateReferralCode(): string {
  return gen();
}
