/**
 * Migration registry for persisted documents (schemaVersion: 1)
 */
export function migrateDocument<T extends { schemaVersion?: number }>(doc: T): T {
  const version = doc.schemaVersion ?? 1;
  if (version === 1) {
    return { ...doc, schemaVersion: 1 };
  }
  return doc;
}
