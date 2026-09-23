import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildSync} from 'esbuild';
import {JSDOM} from 'jsdom';
const code=buildSync({entryPoints:['src/features/scorecards/app.js'],bundle:true,write:false,format:'iife'}).outputFiles[0].text;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const fixture=()=>({metrics:[{metricId:'finance-5',department:'Finance',value:325}],objectives:[{id:'first',title:'First priority',updates:[{position:'Director',title:'Current priority',result:'Result',status:'risk'}]},{id:'second',title:'Second priority',updates:[]}],targets:[],contributions:[],week:'2026-09-14'});
const setup=async(hash='',overrides={})=>{
 const dom=new JSDOM(readFileSync('index.html','utf8'),{url:'http://localhost/'+hash,runScripts:'outside-only'}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.CompassMetricEntry={mount:async root=>{root.textContent='Metric entry mounted';}};
 w.CompassMetricStore={session:async()=>({}),access:async()=>({positionTitle:'Manager, Enterprise Initiatives',admin:true,metrics:true,weekly:true}),scorecards:async()=>fixture(),targets:async()=>[],members:async()=>({members:[{userId:'u1',email:'admin@example.invalid',positionTitle:'Manager',roles:['admin'],departments:['Finance'],active:true,positions:[],readMetrics:null,writeMetrics:null,readWeekly:null,writeWeekly:null}],departments:['Finance'],positions:[]}),...overrides};
 w.CompassMetricStore.adminWorkspace ||= async()=>({teams:[],properties:[],features:[],audit:[]});
 w.eval(code);await tick();return dom;
};

test('Admin can enter a scoped workspace and return without another login',async()=>{
 let selected=null,dom;
 dom=await setup('#admin',{
  session:async()=>({user:{id:'real-admin',user_metadata:{full_name:'Admin Name'}}}),
  workspaceSession:()=>selected,
  access:async()=>selected?{positionTitle:'Director, Finance',admin:false,metrics:true,weekly:false,features:{annual:false}}:{positionTitle:'Manager',admin:true,metrics:true,weekly:true},
  startWorkspace:async(userId,allowWrites)=>{selected={id:'session',userId,name:'Director Name',positionTitle:'Director, Finance',allowWrites};dom.window.dispatchEvent(new dom.window.Event('compass-workspace-changed'));},
  endWorkspace:async()=>{selected=null;dom.window.dispatchEvent(new dom.window.Event('compass-workspace-changed'));},
 });
 const w=dom.window,d=w.document;
 d.querySelector('#admin-user').value='u1';d.querySelector('#admin-user').dispatchEvent(new w.Event('change'));
 d.querySelector('#open-workspace').click();await tick();
 assert.equal(selected.allowWrites,false);
 assert.equal(d.querySelector('.account strong').textContent,'Director Name');
 assert.equal(d.querySelector('[data-surface="admin"]').hidden,true);
 assert.equal(d.querySelector('[data-surface="annual"]').hidden,true);
 assert.match(d.querySelector('.workspace-banner').textContent,/View only/);
 assert.equal(d.querySelectorAll('.health-signal').length,5);
 d.querySelector('.workspace-banner button').click();await tick();
 assert.equal(selected,null);assert.equal(d.querySelector('.account strong').textContent,'Admin Name');
 assert.ok(d.querySelector('#admin-user'));assert.equal(d.querySelector('.workspace-banner').hidden,true);
 assert.equal(d.querySelector('#microsoft-signin'),null);w.close();
});
test('hosted annual surface has ten signals and opens every configured priority',async()=>{
 const dom=await setup('#annual'),d=dom.window.document;
 assert.equal(d.querySelectorAll('.health-signal').length,10);assert.match(d.querySelector('#surface').textContent,/325/);
 assert.equal(d.querySelectorAll('.cards.annual .metric').length,35);assert.match(d.querySelector('.supplemental-measures').textContent,/Open positions/);
 d.querySelector('[data-priorities]').click();assert.match(d.querySelector('#detail-body').textContent,/First priority/);assert.match(d.querySelector('#detail-body').textContent,/Second priority/);assert.match(d.querySelector('#detail-body').textContent,/No linked submission/);
 assert.doesNotMatch(d.body.textContent,/prototype|sample data|illustrative|demonstration only|demo\b/i);dom.window.close();
});

test('avatar opens the enabled position dashboard, profile edits persist, and Admin remains on the hub',async()=>{
 let name='Initial name',revision=null;
 const access=()=>({positionTitle:'Manager, Enterprise Initiatives',positionId:'mei',roles:['olt'],positions:[],admin:true,metrics:true,weekly:true,features:{myDashboard:true},profile:{displayName:name}});
 const dom=await setup('#learn',{access:async()=>access(),myWorkspace:async()=>({access:access(),profile:{displayName:name,email:'person@example.invalid',bio:'',photo:null,revision},weekly:{week:'2026-09-14',records:[{positionId:'mei',draft:{entries:[{title:'Review measures',desiredResult:'Validated definitions',due:'2026-09-18',status:'good',tasks:[]}]}}]},properties:[{name:"College Avenue Apartments",street:"213 College Ave",city:"Lancaster",state:"PA",postal_code:"17603"}]}),saveProfile:async p=>{name=p.displayName;revision=1;return {...p,revision};}});
 const w=dom.window,d=w.document;assert.equal(d.querySelector('.profile-link').disabled,false);d.querySelector('.profile-link').click();await tick();
 assert.match(d.querySelector('#surface').textContent,/Manager, Enterprise Initiatives/);assert.match(d.querySelector('#surface').textContent,/Review measures/);
 assert.equal(d.querySelector('[data-surface="admin"]').hidden,false);
 const map=new URL(d.querySelector('.property-locations a').href);assert.equal(map.origin,'https://www.google.com');assert.equal(map.pathname,'/maps/search/');assert.equal(map.searchParams.get('api'),'1');assert.equal(map.searchParams.get('query'),'213 College Ave, Lancaster, PA, 17603');
 d.querySelector('[data-workspace-section="profile"]').click();const form=d.querySelector('#profile-form');form.elements.displayName.value='Updated name';await form.onsubmit({preventDefault(){}});await tick();
 assert.match(form.textContent,/Profile saved/);assert.equal(d.querySelector('.account strong').textContent,'Updated name');
 assert.equal(form.querySelector('[name="roles"]'),null);w.close();
});

test('dashboard rollout is off by default and a direct hash cannot load workspace records',async()=>{
 let called=false;const dom=await setup('#profile',{myWorkspace:async()=>{called=true;throw new Error('Should not load');}}),d=dom.window.document;
 assert.equal(d.querySelector('.profile-link').disabled,true);assert.equal(called,false);assert.match(d.querySelector('#surface').textContent,/has not been enabled/);dom.window.close();
});
test('Admin form persists overrides and role changes and reports errors honestly',async()=>{
 const saves=[];const dom=await setup('#admin',{saveMember:async p=>saves.push(p)}),w=dom.window,d=w.document;
 d.querySelector('#admin-user').value='u1';d.querySelector('#admin-user').dispatchEvent(new w.Event('change'));
 const form=d.querySelector('#admin-form');form.elements.readWeekly.value='false';form.querySelector('[name="roles"][value="admin"]').checked=true;form.dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();
 assert.equal(saves.length,1);assert.equal(saves[0].readWeekly,false);assert.ok(saves[0].roles.includes('admin'));assert.match(d.querySelector('#admin-result').textContent,/saved/);
 w.CompassMetricStore.saveMember=async()=>{throw new Error('Permission denied');};form.dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.match(d.querySelector('#admin-result').textContent,/Permission denied/);dom.window.close();
});
test('signed-out root contains no fabricated scorecard values and hides Admin',async()=>{
 const dom=await setup('',{session:async()=>null}),d=dom.window.document;assert.match(d.querySelector('#surface').textContent,/Sign in/);assert.equal(d.querySelector('[data-surface="admin"]').hidden,true);assert.equal(d.querySelectorAll('.metric').length,0);dom.window.close();
});
test('Learn preserves planning objectives and the searchable Dictionary',async()=>{
 const dom=await setup('#learn'),w=dom.window,d=w.document;assert.match(d.querySelector('#surface').textContent,/Advance Strategic Acquisitions/);d.querySelector('[data-learn="dictionary"]').click();d.querySelector('input').value='Compass';d.querySelector('input').dispatchEvent(new w.Event('input'));assert.match(d.querySelector('#terms').textContent,/Compass/);dom.window.close();
});

test('authenticated callbacks open the workspace without another sign-in form',async()=>{
 for(const callback of ['auth/callback?code=test-code','auth/callback#access_token=test-access&refresh_token=test-refresh&type=invite','auth/callback#error=access_denied&error_code=otp_expired','auth/callback']){
  const dom=await setup(callback);
  assert.match(dom.window.document.querySelector('#surface').textContent,/2030 Plan Scorecard/);
  assert.equal(dom.window.document.querySelector('#microsoft-signin'),null);
  dom.window.close();
 }
});

test('another tab signing in updates the original tab and token refresh preserves the current form',async()=>{
 let session=null,notify;
 const dom=await setup('#metrics',{session:async()=>session,onAuthChange:listener=>{notify=listener;}}),d=dom.window.document;
 assert.ok(d.querySelector('#microsoft-signin'));assert.equal(d.querySelector('nav[aria-label="Compass"]').hidden,true);
 session={user:{id:'admin'}};notify('SIGNED_IN',session);await tick();
 assert.equal(d.querySelector('#surface').textContent,'Metric entry mounted');assert.equal(d.querySelector('#microsoft-signin'),null);
 const mounted=d.querySelector('#surface').firstChild;notify('TOKEN_REFRESHED',session);await tick();assert.equal(d.querySelector('#surface').firstChild,mounted);
 session=null;notify('SIGNED_OUT',null);await tick();assert.ok(d.querySelector('#microsoft-signin'));
 assert.equal(d.querySelector('.account strong').textContent,'Your workspace');dom.window.close();
});

test('authenticated users without an assignment see access guidance and can sign out',async()=>{
 const denied=async()=>{throw new Error('Your account needs an active Admin assignment');};
 const dom=await setup('',{access:denied,context:denied}),d=dom.window.document;
 assert.match(d.querySelector('#surface').textContent,/could not open your assigned workspace/);
 assert.equal(d.querySelector('#microsoft-signin'),null);
 assert.equal(d.querySelector('.account button').hidden,false);dom.window.close();
});
