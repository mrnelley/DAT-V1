import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const mountEditor=async(w,root)=>{await w.CompassWeekly.mount(root);root.querySelector('[data-view="mine"]')?.click();await tick();};
const fixture=()=>({week:'2026-09-14',startsOn:'2026-09-14',positionId:'finance',positionTitle:'Director, Finance',boundaries:{deadline_at:'2026-09-18T21:00:00Z',grace_at:'2026-09-21T13:00:00Z'},positions:[{id:'finance',title:'Director, Finance',department:'Finance',canEdit:true,required:true,points:100}],objectives:[{id:'2026-Q3-7',title:'Advance College Ave Phase 2 Closing',period:'2026-Q3'}],departmentalObjectives:[{id:'cr-work',title:'Retain corporate sponsors',department:'Community Relations',year:2026,active:true},{id:'fin-work',title:'Improve cash position',department:'Finance',year:2026,active:true},{id:'rs-work',title:'Improve service connections',department:'Resident Services',year:2026,active:true}],records:[],events:[]});
const setup=()=>{const dom=new JSDOM('<button data-surface="weekly" aria-pressed="true"></button><div id="surface"></div>',{url:'http://localhost',runScripts:'outside-only'});
 dom.window.structuredClone=structuredClone;dom.window.eval(readFileSync('src/features/weekly-accountability/model.js','utf8'));dom.window.eval(readFileSync('src/features/weekly-accountability/view.js','utf8'));return dom;};

test('shared board defaults to submitted priorities across positions and never displays draft text',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface'),data=fixture();
 data.positions.push({id:'hr',title:'Director, HR',department:'Human Resources',canEdit:false});
 const document=title=>({entries:[{title,desiredResult:'A clear outcome',tasks:[],status:'good'}]});
 data.records=[{positionId:'finance',submitted:document('Published finance work'),draft:document('PRIVATE draft revision')},{positionId:'hr',submitted:document('Published people work'),draft:document('PRIVATE people draft')}];
 let calls=0;w.CompassMetricStore={session:async()=>({}),weekly:async()=>{calls++;return structuredClone(data);}};
 await w.CompassWeekly.mount(root);
 assert.equal(root.querySelector('[data-view="rollup"]').getAttribute('aria-pressed'),'true');
 assert.match(root.textContent,/Published finance work/);assert.match(root.textContent,/Published people work/);assert.doesNotMatch(root.textContent,/PRIVATE/);
 assert.equal(root.querySelectorAll('textarea,[data-save-draft]').length,0);
 const search=root.querySelector('#weekly-search');search.value='people';search.dispatchEvent(new w.Event('input'));
 assert.equal(root.querySelectorAll('.rollup-card').length,1);
 search.value='';search.dispatchEvent(new w.Event('input'));const department=root.querySelector('#weekly-department');department.value='Finance';department.dispatchEvent(new w.Event('change'));
 assert.equal(root.querySelectorAll('.rollup-card').length,1);assert.doesNotMatch(root.querySelector('#weekly-board-cards').textContent,/Published people work/);
 data.records[1].submitted=document('Newly submitted people work');await w.CompassWeekly.mount(root);
 assert.equal(calls,2);assert.match(root.textContent,/Newly submitted people work/);dom.window.close();
});

test('refresh and view entry fetch current submissions while retaining unsaved edits and their original revision',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface'),data=fixture();let calls=0,saved,resolveRefresh;
 data.records=[{positionId:'finance',revision:4,draft:{capacity:'capacity',note:'Original note',entries:[]}}];
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>{calls++;if(resolveRefresh===null)return new Promise(resolve=>{resolveRefresh=resolve;});return structuredClone(data);},saveWeekly:async payload=>{saved=payload;}};
 await mountEditor(w,root);assert.equal(calls,2);
 const note=root.querySelector('[name="note"]');note.value='Unsaved note';note.dispatchEvent(new w.Event('input',{bubbles:true}));
 resolveRefresh=null;root.querySelector('[data-refresh]').click();
 note.value='Typed while refreshing';note.dispatchEvent(new w.Event('input',{bubbles:true}));
 data.records[0].revision=5;data.records[0].draft.note='Another session';resolveRefresh(structuredClone(data));await tick();
 assert.equal(root.querySelector('[name="note"]').value,'Typed while refreshing');
 root.querySelector('[data-view="rollup"]').click();await tick();root.querySelector('[data-view="mine"]').click();await tick();
 assert.equal(root.querySelector('[name="note"]').value,'Typed while refreshing');
 root.querySelector('[data-save-draft]').click();await tick();
 assert.equal(saved.expectedRevision,4);assert.equal(saved.draft.note,'Typed while refreshing');dom.window.close();
});

test('refresh failure keeps the board and permits retry, and older requests cannot replace a newer week',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface'),data=fixture();let fail=false,pending=[];
 w.CompassMetricStore={session:async()=>({}),weekly:async week=>{if(fail)throw new Error('Connection interrupted');if(week&&week!==data.week)return new Promise(resolve=>pending.push({week,resolve}));return structuredClone(data);}};
 await w.CompassWeekly.mount(root);fail=true;root.querySelector('[data-refresh]').click();await tick();
 assert.match(root.textContent,/Connection interrupted/);assert.match(root.textContent,/Refresh failed/);assert.equal(root.querySelector('[data-refresh]').disabled,false);
 fail=false;root.querySelector('[data-refresh]').click();await tick();assert.doesNotMatch(root.textContent,/Refresh failed/);
 const picker=root.querySelector('#weekly-week');picker.value='2026-09-21';picker.dispatchEvent(new w.Event('change'));picker.value='2026-09-28';picker.dispatchEvent(new w.Event('change'));
 pending[1].resolve({...structuredClone(data),week:pending[1].week});await tick();pending[0].resolve({...structuredClone(data),week:pending[0].week});await tick();
 assert.equal(root.querySelector('#weekly-week').value,'2026-09-28');dom.window.close();
});

test('department dropdown groups by owner, puts own department first, and persists cross-department selection',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface'),data=fixture();let saved;
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>structuredClone(data),saveWeekly:async(payload)=>{
  saved=payload;data.records=[{positionId:'finance',revision:1,submittedRevision:1,draft:payload.draft,submitted:payload.draft}];
 }};
 await mountEditor(w,root);root.querySelector('[name="capacity"][value="capacity"]').checked=true;root.querySelector('[data-add]').click();
 const select=root.querySelector('[data-field="departmentPriorityId"]');
 assert.deepEqual([...select.querySelectorAll('optgroup')].map(g=>g.label),['Finance','Community Relations','Resident Services']);
 assert.equal(root.querySelector('[data-field="objectiveId"]'),null);
 select.value='cr-work';root.querySelector('[data-field="title"]').value='Follow up sponsorships';root.querySelector('[data-field="desiredResult"]').value='Renewals confirmed';
 root.querySelector('#weekly-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(resolve=>setImmediate(resolve));
 assert.equal(saved.draft.entries[0].departmentPriorityId,'cr-work');assert.equal(saved.draft.entries[0].commitmentType,'department');assert.equal(saved.draft.entries[0].objectiveId,'');
 assert.equal(root.querySelector('[data-field="departmentPriorityId"]').value,'cr-work');
 root.querySelector('[data-view="rollup"]').click();await tick();assert.match(root.textContent,/Community Relations · Retain corporate sponsors/);dom.window.close();
});

test('switching priority type clears the opposite link and preserves text and action items',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface');
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>fixture()};await mountEditor(w,root);
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
 await mountEditor(w,root);root.querySelector('[value="enterprise"]').checked=true;
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
 await mountEditor(w,root);assert.equal(root.querySelectorAll('.entry-heading').length,3);
 root.querySelector('[data-view="rollup"]').click();await tick();for(let i=1;i<=3;i++)assert.match(root.textContent,new RegExp(`Priority ${i} text`));
 dom.window.close();
});

test('weekly add button observes the database limit and removal allows another card',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface');
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>fixture()};await mountEditor(w,root);
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
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>data};await mountEditor(w,root);root.querySelector('[data-view="rollup"]').click();await tick();
 assert.match(root.querySelector('details').textContent,/Review lender documents/);assert.match(root.querySelector('details').textContent,/Director, Finance/);assert.match(root.querySelector('details').textContent,/2026-09-17/);assert.match(root.textContent,/Closing plan/);assert.equal(root.querySelectorAll('[data-save-draft],textarea').length,0);dom.window.close();
});
test('hosted weekly opt-out saves and reloads without browser persistence',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface'),data=fixture();const saved=[];
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>structuredClone(data),saveWeekly:async(payload,finalizing)=>{
  saved.push({payload,finalizing});data.records=[{positionId:'finance',week:data.week,revision:1,submittedRevision:1,draft:payload.draft,submitted:payload.draft,firstAt:'2026-09-16T12:00:00Z'}];
 }};
 await mountEditor(w,root);
 root.querySelector('[value="capacity"]').checked=true;
 root.querySelector('#weekly-form').dispatchEvent(new w.Event('submit',{cancelable:true}));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(saved.length,1);assert.equal(saved[0].payload.draft.capacity,'capacity');assert.equal(saved[0].finalizing,true);
 assert.equal(w.localStorage.length,0);
 await mountEditor(w,root);
 assert.match(root.textContent,/Submitted/);
 root.querySelector('[data-view="rollup"]').click();await tick();
 assert.match(root.textContent,/No enterprise capacity/);
 dom.window.close();
});
test('weekly errors preserve entered text and never claim a successful save',async()=>{
 const dom=setup(),w=dom.window,root=w.document.querySelector('#surface');
 w.CompassMetricStore={session:async()=>({}),weekly:async()=>fixture(),saveWeekly:async()=>{throw new Error('Permission changed');}};
 await mountEditor(w,root);
 root.querySelector('[name="note"]').value='Keep this text';root.querySelector('[data-save-draft]').click();
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(root.textContent,/Permission changed/);assert.equal(root.querySelector('[name="note"]').value,'Keep this text');
 assert.equal(root.querySelector('[data-save-draft]').disabled,false);
 dom.window.close();
});
