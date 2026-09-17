// The administrator's Supabase session never changes. Every delegated operation
// is authorized again by the database, using the selected account's current scope.
export function createWorkspaceSession(directRpc, onChange) {
  let current = null;
  return {
    current: () => current,
    async start(userId, allowWrites = false) {
      const next = await directRpc('compass_admin_start_workspace', { target_user: userId, allow_writes: allowWrites });
      current = next;
      onChange();
      return next;
    },
    async end() {
      if (!current) return;
      await directRpc('compass_admin_end_workspace', { workspace_session: current.id });
      current = null;
      onChange();
    },
    clear() { current = null; },
    call(name, args = {}) {
      if (!current) return directRpc(name, args);
      return directRpc('compass_admin_workspace_call', { workspace_session: current.id, operation: name, arguments: args });
    },
  };
}
