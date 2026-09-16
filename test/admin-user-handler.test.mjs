import test from 'node:test';
import assert from 'node:assert/strict';
import {createUserHandler} from '../supabase/functions/compass-admin-users/handler.js';
const payload={action:'create',email:'new@example.invalid',positionTitle:'Director, Finance',roles:['director'],departments:['Finance'],requestId:'12345678-1234-4234-8234-123456789012'};
const setup=(options={})=>{
 const calls=[];let account=options.account||null;
 const user={auth:{getUser:async()=>options.invalid?{error:{}}:{data:{user:{id:'caller'}}}},rpc:async(name,args)=>{
  calls.push({name,args});if(name==='compass_access_context')return {data:{admin:!options.notAdmin}};
  if(name==='compass_admin_user_lookup')return {data:account};
  if(name==='compass_set_metric_member'){if(options.assignmentFailure)return {error:{message:'Denied'}};account.assigned=true;return {data:null};}
  return {data:null};
 }};
 const admin={auth:{admin:{createUser:async data=>{calls.push({name:'createUser',data});account={id:'new-id',requestId:data.app_metadata.compass_provisioning_id,assigned:false,confirmed:false};return {data:{user:{id:'new-id'}}};},inviteUserByEmail:async(email,options)=>{calls.push({name:'invite',email,options});return {data:{}};}}}};
 const handler=createUserHandler({createClient:(_url,key)=>key==='server-only'?admin:user,env:key=>({SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server-only'})[key]});
 const send=(data=payload,headers={authorization:'Bearer verified','origin':'http://127.0.0.1:4174'})=>handler(new Request('https://example/functions/admin',{method:'POST',headers,body:JSON.stringify(data)}));
 return {send,calls};
};
test('user creation never confirms email or sends an invitation implicitly',async()=>{const {send,calls}=setup();const response=await send();assert.equal(response.status,200);assert.equal(calls.find(c=>c.name==='createUser').data.email_confirm,false);assert.equal(calls.filter(c=>c.name==='invite').length,0);assert.deepEqual(calls.find(c=>c.name==='compass_set_metric_member').args.payload.roles,['director']);});
test('same request retry returns the created account without replacing access',async()=>{const {send,calls}=setup();await send();await send();assert.equal(calls.filter(c=>c.name==='createUser').length,1);assert.equal(calls.filter(c=>c.name==='compass_set_metric_member').length,1);});
test('different request cannot overwrite an existing account',async()=>{const {send,calls}=setup({account:{id:'existing',requestId:'different',assigned:true}});assert.equal((await send()).status,409);assert.equal(calls.filter(c=>c.name==='createUser'||c.name==='compass_set_metric_member').length,0);});
test('missing authentication, invalid sessions, non-Admins and unknown origins cannot create users',async()=>{for(const option of [{invalid:true},{notAdmin:true}]){const {send,calls}=setup(option);assert.ok([401,403].includes((await send()).status));assert.equal(calls.filter(c=>c.name==='createUser').length,0);}const {send}=setup();assert.equal((await send(payload,{})).status,401);assert.equal((await send(payload,{authorization:'Bearer token',origin:'https://other.invalid'})).status,403);});
test('invalid roles and departments are rejected before account creation',async()=>{for(const change of [{roles:['superuser']},{departments:['Operations']},{positionTitle:''}]){const {send,calls}=setup();assert.equal((await send({...payload,...change})).status,400);assert.equal(calls.filter(c=>c.name==='createUser').length,0);}});
test('assignment failures leave a recoverable account and report failure',async()=>{const {send}=setup({assignmentFailure:true});const response=await send();assert.equal(response.status,422);assert.match((await response.json()).error,/access could not be saved/);});
test('invitations require an existing assigned unconfirmed account',async()=>{const {send,calls}=setup({account:{id:'new-id',assigned:true,confirmed:false}});assert.equal((await send({action:'invite',email:payload.email})).status,200);assert.equal(calls.filter(c=>c.name==='invite').length,1);const missing=setup();assert.equal((await missing.send({action:'invite',email:payload.email})).status,404);});
