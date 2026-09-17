begin;
create table if not exists compass_private.workspace_sessions (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references auth.users(id),
 target_id uuid not null references compass_private.members(user_id),
 allow_writes boolean not null default false,
 started_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null default (clock_timestamp()+interval '1 hour'),
 ended_at timestamptz
);
alter table compass_private.workspace_sessions enable row level security;
revoke all on compass_private.workspace_sessions from public,anon,authenticated;

create or replace function public.compass_admin_start_workspace(target_user uuid, allow_writes boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s compass_private.workspace_sessions; m compass_private.members; u auth.users;
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 if target_user=auth.uid() then raise exception 'You are already in your own workspace'; end if;
 select * into m from compass_private.members where user_id=target_user and active;
 if not found then raise exception 'Choose an active account with assigned access'; end if;
 select * into u from auth.users where id=target_user;
 insert into compass_private.workspace_sessions(actor_id,target_id,allow_writes)
 values(auth.uid(),target_user,coalesce(allow_writes,false)) returning * into s;
 insert into compass_private.admin_events(actor_id,action,subject,after_record)
 values(auth.uid(),'workspace_opened',target_user::text,jsonb_build_object('sessionId',s.id,'allowWrites',s.allow_writes,'expiresAt',s.expires_at));
 return jsonb_build_object('id',s.id,'userId',target_user,'email',u.email,
  'name',coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',u.email),
  'positionTitle',m.position_title,'allowWrites',s.allow_writes,'expiresAt',s.expires_at);
end; $$;

create or replace function public.compass_admin_end_workspace(workspace_session uuid)
returns void language plpgsql security definer set search_path='' as $$
declare s compass_private.workspace_sessions;
begin
 -- The initiating account can always close its own session, even after Admin removal.
 select * into s from compass_private.workspace_sessions where id=workspace_session and actor_id=auth.uid() for update;
 if not found then raise exception 'Workspace session not found' using errcode='42501'; end if;
 if s.ended_at is null then
  update compass_private.workspace_sessions set ended_at=clock_timestamp() where id=s.id;
  insert into compass_private.admin_events(actor_id,action,subject,after_record)
  values(auth.uid(),'workspace_closed',s.target_id::text,jsonb_build_object('sessionId',s.id));
 end if;
end; $$;

create or replace function public.compass_admin_workspace_call(workspace_session uuid, operation text, arguments jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare s compass_private.workspace_sessions; actor uuid:=auth.uid(); result jsonb;
 old_claims text:=current_setting('request.jwt.claims',true);
 old_sub text:=current_setting('request.jwt.claim.sub',true);
 writing boolean:=operation in ('compass_save_metric_entry','compass_save_weekly');
begin
 if not compass_private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 select * into s from compass_private.workspace_sessions where id=workspace_session and actor_id=actor for share;
 if not found or s.ended_at is not null or s.expires_at<=clock_timestamp() then
  raise exception 'Workspace session ended. Return to Admin and open it again.' using errcode='42501';
 end if;
 if not exists(select 1 from compass_private.members where user_id=s.target_id and active) then
  raise exception 'This account is no longer active' using errcode='42501';
 end if;
 if operation is null or operation not in ('compass_access_context','compass_metric_context','compass_metric_entries',
  'compass_scorecard_data','compass_scorecard_targets','compass_weekly_context','compass_save_metric_entry','compass_save_weekly') then
  raise exception 'Return to your Admin account to use management controls' using errcode='42501';
 end if;
 if writing and not s.allow_writes then raise exception 'Viewing only. Reopen this workspace with saving enabled to make changes.' using errcode='42501'; end if;
 -- Scope identity to this transaction and only to the explicit operations below.
 -- Both claim representations are restored before returning or propagating errors.
 perform set_config('request.jwt.claim.sub',s.target_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',s.target_id,'role','authenticated')::text,true);
 begin
  case operation
   when 'compass_access_context' then result:=public.compass_access_context()||jsonb_build_object('admin',false);
   when 'compass_metric_context' then result:=public.compass_metric_context();
   when 'compass_metric_entries' then result:=public.compass_metric_entries(arguments->>'target_department');
   when 'compass_scorecard_data' then result:=public.compass_scorecard_data((arguments->>'report_month')::date);
   when 'compass_scorecard_targets' then result:=public.compass_scorecard_targets((arguments->>'target_year')::integer);
   when 'compass_weekly_context' then result:=public.compass_weekly_context((arguments->>'week_date')::date);
   when 'compass_save_metric_entry' then result:=public.compass_save_metric_entry(arguments->'payload');
   when 'compass_save_weekly' then result:=public.compass_save_weekly(arguments->'payload',coalesce((arguments->>'finalizing')::boolean,false));
  end case;
 exception when others then
  perform set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);
  perform set_config('request.jwt.claims',coalesce(old_claims,''),true);
  raise;
 end;
 perform set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);
 perform set_config('request.jwt.claims',coalesce(old_claims,''),true);
 if writing then
  insert into compass_private.admin_events(actor_id,action,subject,after_record)
  values(actor,'workspace_saved',s.target_id::text,jsonb_build_object('sessionId',s.id,'operation',operation,'result',result));
 end if;
 return result;
end; $$;
revoke all on function public.compass_admin_start_workspace(uuid,boolean),public.compass_admin_end_workspace(uuid),public.compass_admin_workspace_call(uuid,text,jsonb) from public,anon;
grant execute on function public.compass_admin_start_workspace(uuid,boolean),public.compass_admin_end_workspace(uuid),public.compass_admin_workspace_call(uuid,text,jsonb) to authenticated;
insert into compass_private.releases(version) values('20260920_admin_view_as') on conflict do nothing;
notify pgrst,'reload schema';
commit;
