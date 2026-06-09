alter table public.weekly_action_entries
  drop constraint if exists weekly_action_entries_rank_check,
  drop constraint if exists weekly_action_entries_previous_rank_check,
  drop constraint if exists weekly_action_entries_alignment_type_check;

alter table public.weekly_action_entries
  add constraint weekly_action_entries_rank_check check (rank > 0),
  add constraint weekly_action_entries_previous_rank_check check (previous_rank is null or previous_rank > 0),
  add constraint weekly_action_entries_alignment_type_check check (alignment_type in ('enterprise', 'department', 'both'));

alter table public.weekly_action_tasks
  drop column if exists action_item_id;

alter table public.stucks
  drop constraint if exists stucks_source_type_check,
  drop constraint if exists stucks_source_pair_check;

update public.stucks
set source_type = case source_type
  when 'action_item' then 'queued_task'
  when 'weekly_action_task' then 'weekly_action_item'
  else source_type
end;

alter table public.stucks
  add constraint stucks_source_type_check
  check (source_type is null or source_type in ('queued_task', 'weekly_action_item')),
  add constraint stucks_source_pair_check
  check (
    (source_type is null and source_id is null)
    or (source_type is not null and source_id is not null)
  );

create or replace function public.validate_stuck_source()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.source_type is null and new.source_id is null then
    return new;
  end if;

  if new.source_type is null or new.source_id is null then
    raise exception 'A stuck source requires both source_type and source_id';
  end if;

  if new.source_type = 'queued_task' and not exists (
    select 1 from public.action_items where id = new.source_id
  ) then
    raise exception 'Stuck source queued_task % does not exist', new.source_id;
  end if;

  if new.source_type = 'weekly_action_item' and not exists (
    select 1 from public.weekly_action_tasks where id = new.source_id
  ) then
    raise exception 'Stuck source weekly_action_item % does not exist', new.source_id;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_stuck_source_reference on public.stucks;
create trigger validate_stuck_source_reference
before insert or update of source_type, source_id on public.stucks
for each row execute function public.validate_stuck_source();

-- Revalidate existing linked stucks so the migration cannot leave old dangling references behind.
update public.stucks
set source_id = source_id
where source_id is not null;

create or replace function public.prevent_deleting_referenced_stuck_source()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.stucks
    where source_type = tg_argv[0]
      and source_id = old.id
  ) then
    raise exception 'Cannot delete % % while a stuck references it', tg_argv[0], old.id;
  end if;

  return old;
end;
$$;

drop trigger if exists prevent_deleting_referenced_action_item on public.action_items;
create trigger prevent_deleting_referenced_action_item
before delete on public.action_items
for each row execute function public.prevent_deleting_referenced_stuck_source('queued_task');

drop trigger if exists prevent_deleting_referenced_weekly_action_task on public.weekly_action_tasks;
create trigger prevent_deleting_referenced_weekly_action_task
before delete on public.weekly_action_tasks
for each row execute function public.prevent_deleting_referenced_stuck_source('weekly_action_item');

create index if not exists idx_stucks_source on public.stucks(source_type, source_id);
