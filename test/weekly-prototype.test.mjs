import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/features/weekly-accountability/model.js';
const M=globalThis.CompassWeeklyModel,week='2026-10-05',initiatives=[{id:'a1'}];
const draft=()=>({capacity:'enterprise',note:'',entries:[{...M.entry(week,'coo'),title:'Priority',desiredResult:'Result',projectId:'a1',initiativeId:'a1'}]});
const submit=(state,at,doc=draft(),cycle=week)=>M.submit(state,cycle,'coo',doc,initiatives,new Date(at));
const evaluate=(state,at='2026-10-05T13:00:00Z',owners=['coo'])=>M.evaluate(state,week,owners,new Date(at));

test('preceding Friday and Monday evaluation respect Eastern daylight saving transitions',()=>{
 assert.equal(M.deadline(week),'2026-10-02T21:00:00.000Z');
 assert.equal(M.graceEnd(week),'2026-10-05T13:00:00.000Z');
 assert.equal(M.deadline('2026-11-02'),'2026-10-30T21:00:00.000Z');
 assert.equal(M.graceEnd('2026-11-02'),'2026-11-02T14:00:00.000Z');
 assert.equal(M.deadline('2026-03-09'),'2026-03-06T22:00:00.000Z');
 assert.equal(M.graceEnd('2026-03-09'),'2026-03-09T13:00:00.000Z');
});
test('entry accepts past and future weeks and never evaluates points',()=>{
 for(const cycle of ['2020-01-06',week,'2030-01-07']){
  const state=submit(M.empty(),'2026-10-02T21:00:00Z',draft(),cycle);
  assert.ok(state.records[M.key(cycle,'coo')].submitted);assert.equal(state.events.length,0);assert.equal(M.score(state,'coo'),100);
 }
});
test('Monday evaluation awards each category once and does nothing before nine',()=>{
 const department=draft();department.capacity='capacity';department.entries[0].initiativeId='';
 for(const [doc,points] of [[draft(),5],[department,3],[{capacity:'capacity',note:'',entries:[]},0]]){
  let state=submit(M.empty(),'2026-10-02T21:00:00Z',doc);
  assert.equal(evaluate(state,'2026-10-05T12:59:59Z').events.length,0);
  state=evaluate(state);assert.equal(state.events[0].points,points);
  assert.equal(evaluate(state).events.length,1);
 }
});
test('late, missing, and draft-only positions get the established deductions',()=>{
 const late=evaluate(submit(M.empty(),'2026-10-02T21:00:00.001Z'));assert.equal(late.events[0].points,-3);
 const atGrace=evaluate(submit(M.empty(),'2026-10-05T13:00:00Z'));assert.equal(atGrace.events[0].points,-3);
 const afterGrace=evaluate(submit(M.empty(),'2026-10-05T13:00:00.001Z'));assert.equal(afterGrace.events[0].points,-10);
 const state=M.saveDraft(M.empty(),week,'coo',draft());assert.equal(evaluate(state).events[0].points,-10);
});
test('evaluation freezes the Friday version and later submissions cannot rewrite it',()=>{
 let state=submit(M.empty(),'2026-10-02T20:00:00Z',{capacity:'capacity',note:'',entries:[]});
 state=submit(state,'2026-10-02T21:00:00.001Z');state=evaluate(state);assert.equal(state.events[0].points,0);
 state=submit(state,'2026-10-06T15:00:00Z');assert.equal(evaluate(state).events[0].points,0);
 assert.equal(state.records[M.key(week,'coo')].submitted.firstAt,'2026-10-02T20:00:00.000Z');
});
test('catch-up evaluation handles overdue cycles and keeps position awards separate',()=>{
 const state=evaluate(submit(M.empty(),'2026-10-02T20:00:00Z'),'2026-10-09T15:00:00Z',['coo','cfo']);
 assert.equal(M.score(state,'coo'),105);assert.equal(M.score(state,'cfo'),90);
 assert.equal(evaluate(state,'2026-10-12T15:00:00Z',['coo','cfo']).events.length,2);
});
test('validation and draft isolation still apply with unrestricted entry',()=>{
 assert.match(M.validate(M.freshDraft(),initiatives),/Choose whether/);
 const state=submit(M.empty(),'2026-10-02T20:00:00Z');const change=draft();change.entries[0].title='Draft only';
 assert.equal(M.saveDraft(state,week,'coo',change).records[M.key(week,'coo')].submitted.snapshot.entries[0].title,'Priority');
});
test('carry-forward retains lineage and excludes completed or cancelled tasks', () => {
  const previous = draft();
  previous.entries[0].tasks = ['complete', 'blocked', 'cancelled'].map(status => ({ id: status, title: status, status, owner: 'coo', due: '2026-09-18' }));
  const next = M.carry(previous, '2026-09-14', '2026-09-21', 'coo');
  assert.equal(next.capacity, '');
  assert.equal(next.entries[0].tasks.length, 1);
  assert.equal(next.entries[0].tasks[0].carriedFrom, 'blocked');
  assert.equal(next.entries[0].tasks[0].due, '2026-09-25');
  assert.equal(next.entries[0].carriedFrom, previous.entries[0].id);
});
