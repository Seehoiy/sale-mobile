import crypto from "crypto";

/**
 * Hash a plain text password using PBKDF2 with SHA-512 and a random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a plain text password against a stored hash string.
 * Also supports plain text fallback for initial seed data migration.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  // Support salt:hash format
  if (storedHash.includes(":")) {
    const [salt, originalHash] = storedHash.split(":");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
  }

  // Fallback check for legacy seed plain-text passwords
  return password === storedHash;
}
