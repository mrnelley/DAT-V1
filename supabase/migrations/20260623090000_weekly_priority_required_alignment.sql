alter table public.weekly_action_entries
  drop constraint if exists weekly_action_entries_required_alignment;

alter table public.weekly_action_entries
  add constraint weekly_action_entries_required_alignment
  check (
    priority_id is not null
    or workplan_id is not null
    or key_objective_id is not null
  ) not valid;

comment on constraint weekly_action_entries_required_alignment on public.weekly_action_entries is
  'Weekly Tracker priorities must align to either a Department Workplan/Objective or an Enterprise Priority. Existing rows are not backfilled by this migration.';
