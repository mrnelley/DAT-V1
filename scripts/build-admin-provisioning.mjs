import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync('supabase/releases/20260918_rollups_admin.sql','utf8');
const extract=(text,name)=>{const start=text.indexOf(`create or replace function ${name}(`);if(start<0)throw new Error(name);const end=text.indexOf('$$;',start)+3;return text.slice(start,end);};
let roster=extract(source,'public.compass_admin_members').replace("'userId',u.id,'email',u.email", "'userId',u.id,'email',u.email,'confirmed',u.email_confirmed_at is not null").replace(' where u.email_confirmed_at is not null','');
let save=extract(source,'public.compass_set_metric_member').replace('where id=target and email_confirmed_at is not null','where id=target').replace('A confirmed sign-in is required first','Create an account before assigning access');
const weekly=readFileSync('supabase/releases/20260917_weekly_accountability.sql','utf8');
let maintain=extract(weekly,'compass_private.weekly_maintain').replace("where a.position_id=p.id and m.active and m.roles", "where a.position_id=p.id and m.active and exists(select 1 from auth.users u where u.id=m.user_id and u.email_confirmed_at is not null) and m.roles");
writeFileSync('supabase/releases/20260919_user_provisioning.sql',`begin;\n${roster}\n${save}\n${maintain}\ninsert into compass_private.releases(version) values('20260919_user_provisioning') on conflict do nothing;\nnotify pgrst,'reload schema';\ncommit;\n`);
const scopedSave=save.replace('target uuid :=',"prior_position_ids text[]; target uuid :=")
 .replace('select * into prior from compass_private.members where user_id=target for update;', 'select * into prior from compass_private.members where user_id=target for update;\n select array_agg(position_id) into prior_position_ids from compass_private.position_assignments where user_id=target;')
 .replace("where a.position_id=p.id and m.active and m.roles && array['executive','elt','director']);", "where a.position_id=p.id and m.active and m.roles && array['executive','elt','director'])\n where p.id=any(coalesce(prior_position_ids,'{}')) or exists(select 1 from compass_private.position_assignments a where a.position_id=p.id and a.user_id=target);");
if(scopedSave===save)throw new Error('Scope guard was not generated');
writeFileSync('supabase/releases/20260919_provisioning_scope.sql',`begin;\n${scopedSave}\ninsert into compass_private.releases(version) values('20260919_provisioning_scope') on conflict do nothing;\nnotify pgrst,'reload schema';\ncommit;\n`);
