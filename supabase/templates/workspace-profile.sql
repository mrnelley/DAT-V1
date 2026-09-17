create or replace function compass_private.workspace_enabled() returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce((public.compass_access_context()->'features'->>'myDashboard')::boolean,false);
$$;

create or replace function public.compass_my_workspace() returns jsonb
language plpgsql security definer set search_path='' as $$
declare ctx jsonb:=public.compass_access_context(); person jsonb;
begin
 if not compass_private.workspace_enabled() then raise exception 'Your working dashboard has not been enabled yet' using errcode='42501'; end if;
 select jsonb_build_object('displayName',coalesce(nullif(p.display_name,''),u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',u.email),
 'email',u.email,'bio',coalesce(p.bio,''),'photo',p.photo,'revision',p.revision) into person
 from auth.users u left join compass_private.profiles p on p.user_id=u.id where u.id=auth.uid();
 return jsonb_build_object('profile',person,'access',ctx,
 'weekly',case when (ctx->>'weekly')::boolean then public.compass_weekly_context() else null end,
 'properties',(select coalesce(jsonb_agg(to_jsonb(p) order by p.name),'[]') from compass_private.properties p where p.active
 and (compass_private.is_admin() or p.manager_id=auth.uid() or p.resident_lead_id=auth.uid())));
end; $$;

create or replace function public.compass_save_profile(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare prior compass_private.profiles; saved compass_private.profiles; photo_value text:=nullif(payload->>'photo','');
begin
 if not compass_private.workspace_enabled() then raise exception 'Your working dashboard has not been enabled yet' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,23));
 select * into prior from compass_private.profiles where user_id=auth.uid() for update;
 if prior.revision is distinct from (payload->>'expectedRevision')::integer then raise exception 'Your profile changed; reload before saving'; end if;
 if length(trim(coalesce(payload->>'displayName',''))) not between 1 and 150 then raise exception 'Enter your display name'; end if;
 if photo_value is not null and (length(photo_value)>180000 or photo_value !~ '^data:image/jpeg;base64,/9j/[A-Za-z0-9+/=]+$') then raise exception 'Choose a JPEG profile photo under 130 KB'; end if;
 insert into compass_private.profiles(user_id,display_name,bio,photo)
 values(auth.uid(),trim(payload->>'displayName'),coalesce(payload->>'bio',''),photo_value)
 on conflict(user_id) do update set display_name=excluded.display_name,bio=excluded.bio,photo=excluded.photo,revision=compass_private.profiles.revision+1 returning * into saved;
 return jsonb_build_object('displayName',saved.display_name,'bio',saved.bio,'photo',saved.photo,'revision',saved.revision);
end; $$;
revoke all on function compass_private.workspace_enabled(),public.compass_my_workspace(),public.compass_save_profile(jsonb) from public,anon;
grant execute on function public.compass_my_workspace(),public.compass_save_profile(jsonb) to authenticated;
