/**
 * The AsyncStorage `isAlive` key is written in two shapes:
 *  - a plain JSON boolean (`'true'` / `'false'`) by the splash defaults,
 *    logout cleanup, respawn, and `updateisAlive`
 *  - an object (`'{"isAlive": true}'`) by `getisAlive`
 * Readers that assume the object shape see `undefined` for the boolean form
 * and wrongly treat the player as dead. Always parse through this helper.
 */
export function parseStoredIsAlive(raw: string | null): boolean | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'boolean') return parsed;
    if (parsed && typeof parsed === 'object' && typeof parsed.isAlive === 'boolean') {
      return parsed.isAlive;
    }
  } catch {
    // fall through — unknown format
  }
  return null;
}
