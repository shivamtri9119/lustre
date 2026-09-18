import { randomBytes, createHash } from "node:crypto";

/**
 * Generates a password-reset token pair: the raw token (goes in the emailed
 * URL, never touches the database) and its SHA-256 hash (goes in the
 * database, never sent anywhere). Mirrors the standard "store only a hash"
 * pattern already used for passwords via bcrypt — the difference here is
 * SHA-256 rather than bcrypt because this is a high-entropy random token
 * (32 bytes), not a low-entropy human-chosen password, so it doesn't need
 * a slow, salted KDF to resist guessing.
 */
export function generateResetToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  return { rawToken, tokenHash };
}

export function hashResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
