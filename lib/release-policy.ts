import { articleSchema } from './guide-model.ts';
import { tokenHash } from './passwords.ts';

export async function matchesReviewedBaseline(raw: string, expectedHash: string) {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return false;
  }
  const parsed = articleSchema.safeParse(value);
  return parsed.success && (await tokenHash(JSON.stringify(parsed.data))) === expectedHash;
}
