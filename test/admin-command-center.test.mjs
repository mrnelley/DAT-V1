import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildSync} from 'esbuild';
import {JSDOM} from 'jsdom';
const source=buildSync({entryPoints:['src/features/scorecards/app.js'],bundle:true,write:false,format:'iife'}).outputFiles[0].text;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function setup(){
 const dom=new JSDOM(readFileSync('index.html','utf8'),{url:'http://localhost/#admin',runScripts:'outside-only'}),w=dom.window;
 const roster={members:[{userId:'admin',email:'admin@example.invalid',positionTitle:'Manager, Enterprise Initiatives',roles:['admin'],departments:['Finance'],active:true,confirmed:true,positions:[],readMetrics:null,writeMetrics:null,readWeekly:null,writeWeekly:null}],departments:['Finance','Property Management'],positions:[]};
 const workspace={teams:[],properties:[],features:[],audit:[]},calls=[];
 const store={session:async()=>({}),access:async()=>({admin:true,weekly:true,metrics:true,positionTitle:roster.members[0].positionTitle}),members:async()=>roster,targets:async()=>[],adminWorkspace:async()=>workspace,
  manageUser:async p=>{calls.push({type:'create',payload:p});const member={userId:'created',email:p.email,positionTitle:p.positionTitle,roles:p.roles,departments:p.departments,positions:[],confirmed:false,active:true};roster.members.push(member);return {userId:'created',message:'Account created.'};},
  saveTeam:async p=>{calls.push({type:'team',payload:p});workspace.teams.push({...p,id:'team',revision:1});},
  saveProperty:async p=>{calls.push({type:'property',payload:p});workspace.properties.push({...p,id:'property',revision:1});},
  setFeature:async(userId,key,value)=>{calls.push({type:'feature',userId,key,value});workspace.features=key==='*'?[]:[{userId,key,enabled:value}];},
  adminRecords:async()=>[],saveMember:async()=>{},saveTarget:async()=>{},
 };
 w.CompassMetricStore=store;w.confirm=()=>true;w.eval(source);await tick();return {dom,w,d:w.document,store,calls};
}
const selectTab=async(d,w,name)=>{d.querySelector(`[data-admin-tab="${name}"]`).click();await tick();};
test('command center includes the prior controls and creates a user with assigned roles',async()=>{
 const {dom,w,d,calls}=await setup();assert.equal(d.querySelectorAll('[data-admin-tab]').length,8);
 const form=d.querySelector('#create-user-form');form.elements.email.value='person@example.invalid';form.elements.positionTitle.value='Director of Finance';form.querySelector('[name="departments"][value="Finance"]').checked=true;
 form.dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(calls[0].type,'create');assert.deepEqual([...calls[0].payload.roles],['staff']);assert.deepEqual([...calls[0].payload.departments],['Finance']);assert.ok(calls[0].payload.requestId);assert.match(d.querySelector('#create-user-result').textContent,/created/);assert.equal(d.querySelector('#admin-user').value,'created');assert.ok(d.querySelector('#send-invitation'));dom.window.close();
});
test('uncertain create responses preserve the request ID and entered values for retry',async()=>{
 const {dom,w,d,store}=await setup(),seen=[];store.manageUser=async p=>{seen.push(p.requestId);throw new Error('Network response unavailable');};const form=d.querySelector('#create-user-form');form.elements.email.value='person@example.invalid';form.elements.positionTitle.value='Director';
 form.dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();form.dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(seen.length,2);assert.equal(seen[0],seen[1]);assert.equal(form.elements.positionTitle.value,'Director');assert.match(d.querySelector('#create-user-result').textContent,/Network response/);dom.window.close();
});
test('team membership and property ownership save through hosted controls',async()=>{
 const {dom,w,d,calls}=await setup();await selectTab(d,w,'teams');d.querySelector('[data-new-team]').click();let form=d.querySelector('#team-editor form');form.elements.name.value='Finance working group';form.querySelector('[name="members"]').checked=true;form.dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(calls[0].type,'team');assert.deepEqual([...calls[0].payload.members],['admin']);assert.match(d.querySelector('#admin-panel-teams').textContent,/Finance working group/);
 await selectTab(d,w,'properties');d.querySelector('[data-new-property]').click();form=d.querySelector('#property-editor form');form.elements.name.value='New property';form.elements.units.value='0';form.elements.managerId.value='admin';form.dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(calls[1].payload.managerId,'admin');assert.equal(calls[1].payload.units,'0');assert.match(d.querySelector('#admin-panel-properties').textContent,/New property/);dom.window.close();
});
test('feature overrides and reset persist; the operating table handles an empty dataset',async()=>{
 const {dom,w,d,calls}=await setup();await selectTab(d,w,'features');const field=d.querySelector('[data-feature="annual"]');field.value='false';field.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();assert.equal(calls[0].key,'annual');assert.equal(calls[0].value,false);d.querySelector('#reset-features').click();await tick();assert.equal(calls[1].key,'*');assert.equal(calls[1].value,null);await selectTab(d,w,'records');assert.match(d.querySelector('#record-table').textContent,/No records/);assert.equal(d.querySelector('#records-export').disabled,true);dom.window.close();
});
