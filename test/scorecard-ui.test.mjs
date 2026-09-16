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
test('hosted annual surface has ten signals and opens every configured priority',async()=>{
 const dom=await setup('#annual'),d=dom.window.document;
 assert.equal(d.querySelectorAll('.health-signal').length,10);assert.match(d.querySelector('#surface').textContent,/325/);
 d.querySelector('[data-priorities]').click();assert.match(d.querySelector('#detail-body').textContent,/First priority/);assert.match(d.querySelector('#detail-body').textContent,/Second priority/);assert.match(d.querySelector('#detail-body').textContent,/No linked submission/);
 assert.doesNotMatch(d.body.textContent,/prototype|sample data|illustrative|demonstration only|demo\b/i);dom.window.close();
});
test('Admin form persists overrides and role changes and reports errors honestly',async()=>{
 const saves=[];const dom=await setup('#admin',{saveMember:async p=>saves.push(p)}),w=dom.window,d=w.document;
 d.querySelector('#admin-user').value='u1';d.querySelector('#admin-user').dispatchEvent(new w.Event('change'));
 const form=d.querySelector('#admin-form');form.elements.readWeekly.value='false';form.querySelector('[name="roles"][value="elt"]').checked=true;form.dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();
 assert.equal(saves.length,1);assert.equal(saves[0].readWeekly,false);assert.ok(saves[0].roles.includes('elt'));assert.match(d.querySelector('#admin-result').textContent,/saved/);
 w.CompassMetricStore.saveMember=async()=>{throw new Error('Permission denied');};form.dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.match(d.querySelector('#admin-result').textContent,/Permission denied/);dom.window.close();
});
test('signed-out root contains no fabricated scorecard values and hides Admin',async()=>{
 const dom=await setup('',{session:async()=>null}),d=dom.window.document;assert.match(d.querySelector('#surface').textContent,/Sign in/);assert.equal(d.querySelector('[data-surface="admin"]').hidden,true);assert.equal(d.querySelectorAll('.metric').length,0);dom.window.close();
});
test('Learn preserves planning objectives and the searchable Dictionary',async()=>{
 const dom=await setup('#learn'),w=dom.window,d=w.document;assert.match(d.querySelector('#surface').textContent,/Advance Strategic Acquisitions/);d.querySelector('[data-learn="dictionary"]').click();d.querySelector('input').value='Compass';d.querySelector('input').dispatchEvent(new w.Event('input'));assert.match(d.querySelector('#terms').textContent,/Compass/);dom.window.close();
});

test('app callback opens metric entry for sign-in codes and invitation tokens',async()=>{
 for(const callback of ['auth/callback?code=test-code','auth/callback#access_token=test-access&refresh_token=test-refresh&type=invite','auth/callback#error=access_denied&error_code=otp_expired','auth/callback']){
  const dom=await setup(callback);
  assert.equal(dom.window.document.querySelector('#surface').textContent,'Metric entry mounted');
  dom.window.close();
 }
});
