-- Strategic pillars are intentionally name-only organizational labels.

drop table if exists public.strategic_success_metrics cascade;

alter table public.strategic_pillars
  drop column if exists description;

comment on table public.strategic_pillars is
  'Name-only strategic categories used to align enterprise priorities and workplans.';

