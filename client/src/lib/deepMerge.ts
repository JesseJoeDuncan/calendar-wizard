/**
 * Recursively merges `overrides` onto `base`, keyed off base's own keys: any field present in
 * base but missing (or not a plain object where base has one) in overrides falls back to base's
 * value. Unlike a hand-rolled per-field merge, this means adding a new field to a defaults shape
 * automatically reaches existing saved data without merge logic needing to be updated in lockstep
 * every time that shape changes — the cause of previously-saved defaults silently losing fields.
 */
export function deepMergeDefaults<T>(base: T, overrides: unknown): T {
  if (base === null || typeof base !== "object" || Array.isArray(base)) {
    return overrides !== undefined ? (overrides as T) : base;
  }
  if (overrides === null || typeof overrides !== "object" || Array.isArray(overrides)) {
    return base;
  }
  const result = { ...(base as Record<string, unknown>) };
  const overridesObj = overrides as Record<string, unknown>;
  for (const key of Object.keys(base as Record<string, unknown>)) {
    result[key] = deepMergeDefaults((base as Record<string, unknown>)[key], overridesObj[key]);
  }
  return result as T;
}

/**
 * The symmetric counterpart to deepMergeDefaults: recursively compares `before` and `after`
 * (same shape) and returns a sparse object containing only the leaves that actually changed —
 * undefined if nothing did. Plain objects are compared key-by-key; anything else (primitives,
 * arrays) is compared by JSON equality and included wholesale if different. The result is meant
 * to be fed back into deepMergeDefaults(someOtherObjectOfTheSameShape, diff) to apply only the
 * changes that were actually made, without touching fields that were never edited.
 */
export function diffAgainstBase(before: unknown, after: unknown): unknown {
  if (before === after) return undefined;
  const bothPlainObjects =
    before !== null && typeof before === "object" && !Array.isArray(before) && after !== null && typeof after === "object" && !Array.isArray(after);
  if (!bothPlainObjects) {
    return JSON.stringify(before) === JSON.stringify(after) ? undefined : after;
  }
  const result: Record<string, unknown> = {};
  let changed = false;
  const keys = new Set([...Object.keys(before as Record<string, unknown>), ...Object.keys(after as Record<string, unknown>)]);
  for (const key of keys) {
    const sub = diffAgainstBase((before as Record<string, unknown>)[key], (after as Record<string, unknown>)[key]);
    if (sub !== undefined) {
      result[key] = sub;
      changed = true;
    }
  }
  return changed ? result : undefined;
}
