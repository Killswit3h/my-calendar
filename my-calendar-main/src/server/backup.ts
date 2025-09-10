// Minimal stubs for backup utilities used in API routes.
// These implementations avoid pulling in the heavy AWS SDK during
// build time while still providing the expected interfaces.

export async function uploadJson(_key: string, _payload: unknown): Promise<void> {
  // noop – backups are disabled in this environment
}

export function buildEventBackupKey(
  _eventId: string,
  _action: "create" | "update" | "delete" | "upsert"
): string {
  return "";
}

export function buildFullExportKey(): string {
  return "";
}

