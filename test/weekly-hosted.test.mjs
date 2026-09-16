import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const fixture=()=>({week:'2026-09-14',startsOn:'2026-09-14',positionTitle:'Director, Finance',boundaries:{deadline_at:'2026-09-18T21:00:00Z',grace_at:'2026-09-21T13:00:00Z'},positions:[{id:'finance',title:'Director, Finance',canEdit:true,required:true,points:100}],objectives:[{id:'2026-Q3-7',title:'Advance College Ave Phase 2 Closing',period:'2026-Q3'}],records:[],events:[]});
const setup=()=>{const dom=new JSDOM('<button data-surface="weekly" aria-pressed="true"></button><div id="surface"></div>',{url:'http://localhost',runScripts:'outside-only'});
 dom.window.structuredClone=structuredClone;dom.window.eval(readFileSync('public/compass/weekly-model.js','utf8'));dom.window.eval(readFileSync('public/compass/weekly-hosted.js','utf8'));return dom;};
test('hosted weekly opt-out saves and reloads without browser persistence',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface'),data=fixture();const saved=[];
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>structuredClone(data),saveWeekly:async(payload,finalizing)=>{
  saved.push({payload,finalizing});data.records=[{positionId:'finance',week:data.week,revision:1,submittedRevision:1,draft:payload.draft,submitted:payload.draft,firstAt:'2026-09-16T12:00:00Z'}];
 }};
 await w.CompassWeekly.mount(root);
 root.querySelector('[value="capacity"]').checked=true;
 root.querySelector('#weekly-form').dispatchEvent(new w.Event('submit',{cancelable:true}));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(saved.length,1);assert.equal(saved[0].payload.draft.capacity,'capacity');assert.equal(saved[0].finalizing,true);
 assert.equal(w.localStorage.length,0);
 await w.CompassWeekly.mount(root);
 assert.match(root.textContent,/Submitted/);
 root.querySelector('[data-view="rollup"]').click();
 assert.match(root.textContent,/No enterprise capacity/);
 dom.window.close();
});
test('weekly errors preserve entered text and never claim a successful save',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface');
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>fixture(),saveWeekly:async()=>{throw new Error('Permission changed');}};
 await w.CompassWeekly.mount(root);
 root.querySelector('[name="note"]').value='Keep this text';root.querySelector('[data-save-draft]').click();
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(root.textContent,/Permission changed/);assert.equal(root.querySelector('[name="note"]').value,'Keep this text');
 assert.equal(root.querySelector('[data-save-draft]').disabled,false);
 dom.window.close();
});
