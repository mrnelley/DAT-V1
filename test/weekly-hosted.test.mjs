import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const fixture=()=>({week:'2026-09-14',startsOn:'2026-09-14',positionId:'finance',positionTitle:'Director, Finance',boundaries:{deadline_at:'2026-09-18T21:00:00Z',grace_at:'2026-09-21T13:00:00Z'},positions:[{id:'finance',title:'Director, Finance',department:'Finance',canEdit:true,required:true,points:100}],objectives:[{id:'2026-Q3-7',title:'Advance College Ave Phase 2 Closing',period:'2026-Q3'}],departmentalObjectives:[{id:'cr-work',title:'Retain corporate sponsors',department:'Community Relations',year:2026,active:true},{id:'fin-work',title:'Improve cash position',department:'Finance',year:2026,active:true},{id:'rs-work',title:'Improve service connections',department:'Resident Services',year:2026,active:true}],records:[],events:[]});
const setup=()=>{const dom=new JSDOM('<button data-surface="weekly" aria-pressed="true"></button><div id="surface"></div>',{url:'http://localhost',runScripts:'outside-only'});
 dom.window.structuredClone=structuredClone;dom.window.eval(readFileSync('src/features/weekly-accountability/model.js','utf8'));dom.window.eval(readFileSync('src/features/weekly-accountability/view.js','utf8'));return dom;};

test('department dropdown groups by owner, puts own department first, and persists cross-department selection',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface'),data=fixture();let saved;
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>structuredClone(data),saveWeekly:async(payload)=>{
  saved=payload;data.records=[{positionId:'finance',revision:1,submittedRevision:1,draft:payload.draft,submitted:payload.draft}];
 }};
 await w.CompassWeekly.mount(root);root.querySelector('[name="capacity"][value="capacity"]').checked=true;root.querySelector('[data-add]').click();
 const select=root.querySelector('[data-field="departmentPriorityId"]');
 assert.deepEqual([...select.querySelectorAll('optgroup')].map(g=>g.label),['Finance','Community Relations','Resident Services']);
 assert.equal(root.querySelector('[data-field="objectiveId"]'),null);
 select.value='cr-work';root.querySelector('[data-field="title"]').value='Follow up sponsorships';root.querySelector('[data-field="desiredResult"]').value='Renewals confirmed';
 root.querySelector('#weekly-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(resolve=>setImmediate(resolve));
 assert.equal(saved.draft.entries[0].departmentPriorityId,'cr-work');assert.equal(saved.draft.entries[0].commitmentType,'department');assert.equal(saved.draft.entries[0].objectiveId,'');
 assert.equal(root.querySelector('[data-field="departmentPriorityId"]').value,'cr-work');
 root.querySelector('[data-view="rollup"]').click();assert.match(root.textContent,/Community Relations · Retain corporate sponsors/);dom.window.close();
});

test('switching priority type clears the opposite link and preserves text and action items',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface');
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>fixture()};await w.CompassWeekly.mount(root);
 root.querySelector('[data-add]').click();root.querySelector('[data-field="title"]').value='Keep priority';root.querySelector('[data-field="objectiveId"]').value='2026-Q3-7';
 root.querySelector('[data-add-task]').click();root.querySelector('[data-task="0"][data-field="title"]').value='Keep action';
 let type=root.querySelector('[data-field="commitmentType"]');type.value='department';type.dispatchEvent(new w.Event('change',{bubbles:true}));
 root.querySelector('[data-field="departmentPriorityId"]').value='fin-work';
 type=root.querySelector('[data-field="commitmentType"]');type.value='enterprise';type.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(root.querySelector('[data-field="objectiveId"]').value,'');assert.equal(root.querySelector('[data-field="title"]').value,'Keep priority');assert.equal(root.querySelector('[data-task="0"][data-field="title"]').value,'Keep action');
 type=root.querySelector('[data-field="commitmentType"]');type.value='department';type.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(root.querySelector('[data-field="departmentPriorityId"]').value,'');dom.window.close();
});

test('plus expands multiple priorities without losing fields, then submits and reloads all cards',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface'),data=fixture();let saved;
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>structuredClone(data),saveWeekly:async(payload,finalizing)=>{
  saved={payload,finalizing};data.records=[{positionId:'finance',revision:1,submittedRevision:1,draft:payload.draft,submitted:payload.draft,firstAt:'2026-09-16T12:00:00Z'}];
 }};
 await w.CompassWeekly.mount(root);root.querySelector('[value="enterprise"]').checked=true;
 root.querySelector('[name="note"]').value='Keep weekly context';root.querySelector('[name="correctionReason"]').value='Keep correction';
 for(let i=0;i<3;i++){
  root.querySelector('[data-add]').click();const title=root.querySelector(`[data-entry="${i}"][data-field="title"]`);assert.equal(w.document.activeElement,title);
  title.value=`Priority ${i+1} text`;root.querySelector(`[data-entry="${i}"][data-field="desiredResult"]`).value=`Result ${i+1}`;
  root.querySelector(`[data-entry="${i}"][data-field="objectiveId"]`).value='2026-Q3-7';
  if(i===0){root.querySelector('[data-add-task="0"]').click();root.querySelector('[data-task="0"][data-field="title"]').value='Keep nested task';}
 }
 assert.equal(root.querySelector('[data-entry="0"][data-field="title"]').value,'Priority 1 text');
 assert.equal(root.querySelector('[data-task="0"][data-field="title"]').value,'Keep nested task');
 assert.equal(root.querySelector('[name="correctionReason"]').value,'Keep correction');
 root.querySelector('#weekly-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(resolve=>setImmediate(resolve));
 assert.equal(saved.finalizing,true);assert.equal(saved.payload.draft.entries.length,3);assert.equal(new Set(saved.payload.draft.entries.map(e=>e.id)).size,3);
 assert.equal(saved.payload.draft.note,'Keep weekly context');assert.equal(saved.payload.correctionReason,'Keep correction');
 await w.CompassWeekly.mount(root);assert.equal(root.querySelectorAll('.entry-heading').length,3);
 root.querySelector('[data-view="rollup"]').click();for(let i=1;i<=3;i++)assert.match(root.textContent,new RegExp(`Priority ${i} text`));
 dom.window.close();
});

test('weekly add button observes the database limit and removal allows another card',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface');
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>fixture()};await w.CompassWeekly.mount(root);
 for(let i=0;i<12;i++)root.querySelector('[data-add]').click();
 assert.equal(root.querySelectorAll('.entry-heading').length,12);assert.equal(root.querySelector('[data-add]').disabled,true);assert.match(root.querySelector('#priority-count').textContent,/Weekly limit reached/);
 root.querySelector('[data-add]').click();assert.equal(root.querySelectorAll('.entry-heading').length,12);
 root.querySelector('[data-remove="3"]').click();assert.equal(root.querySelector('[data-add]').disabled,false);root.querySelector('[data-add]').click();assert.equal(root.querySelectorAll('.entry-heading').length,12);
 dom.window.close();
});

test('team rollup exposes submitted action details without edit controls',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface'),data=fixture();
 const entry={title:'Close financing',desiredResult:'Approval',objectiveId:'2026-Q3-7',due:'2026-09-18',projectReference:'Closing plan',tasks:[{title:'Review lender documents',owner:'finance',due:'2026-09-17',status:'in_progress'}]};
 data.records=[{positionId:'finance',draft:{capacity:'enterprise',note:'',entries:[entry]},submitted:{capacity:'enterprise',note:'',entries:[entry]},revision:1,submittedRevision:1}];
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>data};await w.CompassWeekly.mount(root);root.querySelector('[data-view="rollup"]').click();
 assert.match(root.querySelector('details').textContent,/Review lender documents/);assert.match(root.querySelector('details').textContent,/Director, Finance/);assert.match(root.querySelector('details').textContent,/2026-09-17/);assert.match(root.textContent,/Closing plan/);assert.equal(root.querySelectorAll('[data-save-draft],textarea').length,0);dom.window.close();
});
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
