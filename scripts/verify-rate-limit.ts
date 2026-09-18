/**
 * Verifies src/lib/rate-limit.ts's security properties directly (no test
 * framework is set up in this project yet — this uses the `tsx` dev
 * dependency that's already installed). Run with:
 *
 *   npx tsx scripts/verify-rate-limit.ts
 *
 * If the project later adds Vitest/Jest (recommended for Phase 4 of the
 * audit), port these three assertions into proper `it()` blocks.
 */
import { rateLimit, rateLimitReset } from "../src/lib/rate-limit";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

// 1. Allows up to the limit, then blocks the next call in the same window.
{
  const key = "test:limit";
  for (let i = 0; i < 5; i++) {
    assert(rateLimit(key, 5, 60_000).allowed, `attempt ${i + 1}/5 is allowed within limit`);
  }
  assert(!rateLimit(key, 5, 60_000).allowed, "6th attempt within the window is blocked");
}

// 2. Different keys (e.g. different emails) don't interfere with each other.
{
  const a = rateLimit("test:isolation:a", 1, 60_000);
  const b = rateLimit("test:isolation:b", 1, 60_000);
  assert(a.allowed && b.allowed, "distinct keys get independent counters");
}

// 3. rateLimitReset clears a key so a legitimate user isn't stuck after success.
{
  const key = "test:reset";
  rateLimit(key, 1, 60_000);
  assert(!rateLimit(key, 1, 60_000).allowed, "second attempt is blocked before reset");
  rateLimitReset(key);
  assert(rateLimit(key, 1, 60_000).allowed, "attempt is allowed again after reset");
}

if (process.exitCode === 1) {
  console.error("\nrate-limit verification FAILED");
} else {
  console.log("\nrate-limit verification passed");
}
