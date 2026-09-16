import {spawnSync} from 'node:child_process';
import {writeFileSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID,randomBytes} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const ref='vbkjyiurvcnwnjxqvajr',url=`https://${ref}.supabase.co`;
function cli(args){const out=spawnSync('npx.cmd',['supabase',...args],{encoding:'utf8',shell:true,windowsHide:true});if(out.status!==0)throw new Error('Supabase CLI operation failed.');return out.stdout;}
// Keys remain inside this process and are never logged or written to files.
const raw=cli(['projects','api-keys','--project-ref',ref,'--output','json']);
const parsed=JSON.parse(raw.slice(raw.indexOf('[')));
const serviceKey=parsed.find(k=>k.name==='service_role')?.api_key;
const anonKey=parsed.find(k=>k.name==='anon')?.api_key;
if(!serviceKey||!anonKey)throw new Error('Expected API keys were unavailable.');
const client=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const sessionClient=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
const nonce=randomUUID(),callerEmail=`compass-test-${nonce}@example.invalid`,createdEmail=`compass-created-${nonce}@example.invalid`;
const ids=[];let callerId;const teamId=randomUUID(),propertyId=randomUUID();const sqlFile=join(tmpdir(),`compass-admin-${nonce}.sql`);
const runSql=sql=>{writeFileSync(sqlFile,sql);cli(['db','query','--linked','--file','"'+sqlFile+'"']);};
try{
 const password=randomBytes(36).toString('base64url');
 const created=await client.auth.admin.createUser({email:callerEmail,password,email_confirm:true,app_metadata:{compass_test:nonce}});
 if(created.error)throw new Error('Could not create isolated test caller.');callerId=created.data.user.id;ids.push(callerId);
 if(!/^[a-f0-9-]{36}$/.test(callerId))throw new Error('Invalid test identifier.');
 runSql(`insert into compass_private.members(user_id,position_title,roles,departments) values('${callerId}','Test caller ${nonce}',array['admin'],array['Finance']);`);
 const signed=await sessionClient.auth.signInWithPassword({email:callerEmail,password});if(signed.error)throw new Error('Could not authenticate test caller.');
 const headers={apikey:anonKey,Authorization:`Bearer ${signed.data.session.access_token}`,'Content-Type':'application/json'};
 const payload={action:'create',email:createdEmail,positionTitle:`Test created ${nonce}`,roles:['staff'],departments:['Finance'],requestId:randomUUID()};
 const response=await fetch(`${url}/functions/v1/compass-admin-users`,{method:'POST',headers,body:JSON.stringify(payload)});
 const result=await response.json();if(!response.ok)throw new Error(`Deployed function returned ${response.status}: ${result.error||result.message||'request rejected'}`);
 if(!/^[a-f0-9-]{36}$/.test(result.userId))throw new Error('Missing created user ID.');ids.push(result.userId);
 const account=await client.auth.admin.getUserById(result.userId);if(account.error||account.data.user.email_confirmed_at)throw new Error('New account verification state is wrong.');
 const retry=await fetch(`${url}/functions/v1/compass-admin-users`,{method:'POST',headers,body:JSON.stringify(payload)});const second=await retry.json();if(!retry.ok||second.userId!==result.userId)throw new Error('Idempotent retry failed.');
 const rpc=async(name,args)=>{const response=await sessionClient.rpc(name,args);if(response.error)throw new Error(`HTTP ${name}: ${response.error.message}`);return response.data;};
 await rpc('compass_set_metric_member',{payload:{userId:result.userId,positionTitle:payload.positionTitle,roles:['staff'],departments:['Finance'],active:true,readWeekly:false,positions:[]}});
 await rpc('compass_admin_save_team',{payload:{id:teamId,name:`Test team ${nonce}`,members:[result.userId]}});
 await rpc('compass_admin_save_team',{payload:{id:teamId,name:`Test team ${nonce}`,members:[result.userId],description:'Updated through HTTP',expectedRevision:1}});
 await rpc('compass_admin_save_property',{payload:{id:propertyId,name:`Test property ${nonce}`,units:0,managerId:result.userId}});
 await rpc('compass_admin_save_property',{payload:{id:propertyId,name:`Test property ${nonce}`,units:1,managerId:result.userId,expectedRevision:1}});
 await rpc('compass_admin_set_feature',{target_user:result.userId,feature:'annual',enabled_value:false});
 const workspace=await rpc('compass_admin_workspace');
 if(!workspace.features.some(f=>f.userId===result.userId&&f.enabled===false)||!workspace.teams.some(t=>t.id===teamId&&t.revision===2)||!workspace.properties.some(p=>p.id===propertyId&&p.revision===2))throw new Error('HTTP persistence verification failed.');
 await rpc('compass_admin_set_feature',{target_user:result.userId,feature:'*',enabled_value:null});
 const anonymous=await fetch(`${url}/functions/v1/compass-admin-users`,{method:'POST',headers:{apikey:anonKey,'Content-Type':'application/json'},body:JSON.stringify(payload)});if(![401,403].includes(anonymous.status))throw new Error('Anonymous request was not rejected.');
 console.log('PASS: deployed user creation and retry, unconfirmed email, anonymous rejection, member editing, team/property revisions, feature overrides and reset. No invitation email sent.');
}finally{
 // Recover a newly created identity after an uncertain response; only this unique test email is selected.
 if(callerId){const lookup=await sessionClient.rpc('compass_admin_user_lookup',{target_email:createdEmail});if(lookup.data?.id&&!ids.includes(lookup.data.id))ids.push(lookup.data.id);}
 if(ids.length){
  if(ids.some(id=>!/^[a-f0-9-]{36}$/.test(id)))throw new Error('Refusing cleanup for an invalid identifier.');
  const list=ids.map(id=>`'${id}'`).join(',');
  runSql(`begin;
delete from compass_private.admin_events where actor_id in (${list}) or subject in (${list});
delete from compass_private.member_audit where actor_id in (${list}) or target_id in (${list});
delete from compass_private.member_features where user_id in (${list});
delete from compass_private.team_members where team_id='${teamId}';
delete from compass_private.teams where id='${teamId}' and name='Test team ${nonce}';
delete from compass_private.properties where id='${propertyId}' and name='Test property ${nonce}';
delete from compass_private.position_assignments where user_id in (${list});
delete from compass_private.members where user_id in (${list});
delete from compass_private.positions where title in ('Test caller ${nonce}','Test created ${nonce}') and not exists(select 1 from compass_private.position_assignments where position_id=compass_private.positions.id);
commit;`);
  for(const id of ids){const deleted=await client.auth.admin.deleteUser(id);if(deleted.error)throw new Error('Test account cleanup failed.');}
  console.log('PASS: isolated test accounts and assignments removed.');
 }
 try{unlinkSync(sqlFile);}catch{/* No file was created if setup failed early. */}
}
