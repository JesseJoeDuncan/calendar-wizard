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
