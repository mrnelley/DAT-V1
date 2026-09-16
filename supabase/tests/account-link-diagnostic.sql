select u.email, u.email_confirmed_at is not null as confirmed,
 u.last_sign_in_at, m.active, m.position_title, m.roles,
 (select array_agg(i.provider) from auth.identities i where i.user_id=u.id) as providers,
 (select count(*) from auth.sessions s where s.user_id=u.id) as sessions
from auth.users u left join compass_private.members m on m.user_id=u.id
where lower(u.email)='pkelley@hdcweb.org';

select provider_type, created_at, auth_code_issued_at,
 user_id is not null as user_linked,
 split_part(split_part(referrer,'?',1),'#',1) as return_address
from auth.flow_state where provider_type='azure'
order by created_at desc limit 5;
