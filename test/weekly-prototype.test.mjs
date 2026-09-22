import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import '../src/features/weekly-accountability/model.js';
const M = globalThis.CompassWeeklyModel;
const initiatives = [{ id: 'a1' }];
const draft = () => ({ capacity: 'enterprise', note: '', entries: [{ ...M.entry('2026-09-14', 'coo'), title: 'Review the weekly workflow', desiredResult: 'Agree the fields', projectId: 'a1', initiativeId: 'a1' }] });
test('Friday at 5pm Eastern follows daylight saving time', () => {
  assert.equal(M.deadline('2026-09-14'), '2026-09-18T21:00:00.000Z');
  assert.equal(M.deadline('2026-11-02'), '2026-11-06T22:00:00.000Z');
  assert.equal(M.deadline('2026-03-02'), '2026-03-06T22:00:00.000Z');
  assert.equal(M.deadline('2026-03-09'), '2026-03-13T21:00:00.000Z');
  assert.equal(M.graceEnd('2026-09-14'), '2026-09-21T13:00:00.000Z');
  assert.equal(M.graceEnd('2026-11-02'), '2026-11-09T14:00:00.000Z');
  assert.equal(M.weekOf(new Date('2026-09-21T01:00:00Z')), '2026-09-14');
});
test('an on-time capacity declaration counts as submitted with 100 points', () => {
  const state = M.submit(M.empty(), '2026-09-14', 'coo', { capacity: 'capacity', note: '', entries: [] }, initiatives, new Date('2026-09-18T21:00:00Z'));
  assert.equal(M.score(state, 'coo'), 100);
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].type, 'on_time_opt_out');
  assert.equal(state.events[0].points, 0);
  assert.ok(state.records['2026-09-14:coo'].submitted);
});
test('an on-time enterprise priority earns five points once', () => {
  let state = M.submit(M.empty(), '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-18T20:59:59Z'));
  state = M.submit(state, '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-18T21:00:00Z'));
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].type, 'on_time_priority');
  assert.equal(state.events[0].points, 5);
  assert.equal(M.score(state, 'coo'), 105);
});

test('departmental work earns three once, mixed work earns five, and timing still controls deductions',()=>{
 const department=draft();department.capacity='capacity';department.entries[0].initiativeId='';
 department.entries.push({...department.entries[0],id:'second',title:'Another departmental priority'});
 let state=M.submit(M.empty(),'2026-09-14','coo',department,initiatives,new Date('2026-09-18T20:00:00Z'));
 state=M.submit(state,'2026-09-14','coo',department,initiatives,new Date('2026-09-18T21:00:00Z'));
 assert.equal(state.events.length,1);assert.equal(state.events[0].type,'on_time_departmental');assert.equal(M.score(state,'coo'),103);
 state=M.submit(state,'2026-09-14','coo',draft(),initiatives,new Date('2026-09-18T21:00:00.001Z'));
 assert.equal(M.score(state,'coo'),103,'Post-deadline edits preserve the original award');
 const mixed=draft();mixed.entries.push({...department.entries[0],id:'departmental'});
 assert.equal(M.score(M.submit(M.empty(),'2026-09-14','coo',mixed,initiatives,new Date('2026-09-18T21:00:00Z')),'coo'),105);
 const late=M.submit(M.empty(),'2026-09-14','coo',department,initiatives,new Date('2026-09-18T21:00:00.001Z'));
 assert.equal(late.events[0].points,-3);
 const missed=M.submit(M.empty(),'2026-09-14','coo',department,initiatives,new Date('2026-09-21T13:00:00.001Z'));
 assert.equal(missed.events[0].points,-10);
});
test('a grace-window submission deducts three points and editing never duplicates it', () => {
  let state = M.submit(M.empty(), '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-18T21:00:00.001Z'));
  const first = state.records['2026-09-14:coo'].submitted.firstAt;
  assert.equal(state.events[0].type, 'late_submission');
  assert.equal(state.events[0].points, -3);
  state = M.submit(state, '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-20T21:00:00Z'));
  assert.equal(state.events.length, 1);
  assert.equal(M.score(state, 'coo'), 97);
  assert.equal(state.records['2026-09-14:coo'].submitted.firstAt, first);
});
test('editing an on-time submission before or after the deadline creates no edit penalty', () => {
  let state = M.submit(M.empty(), '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-18T20:50:00Z'));
  state = M.submit(state, '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-18T20:59:00Z'));
  state = M.submit(state, '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-21T12:00:00Z'));
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].points, 5);
});
test('points carry across years and remain isolated by position', () => {
  let state = M.submit(M.empty(), '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-18T20:00:00Z'));
  state = M.submit(state, '2027-01-04', 'coo', draft(), initiatives, new Date('2027-01-08T22:00:00.001Z'));
  assert.equal(M.score(state, 'coo'), 102);
  assert.equal(M.score(state, 'cfo'), 100);
});
test('missed submissions deduct ten points once after the grace window', () => {
  assert.throws(() => M.assessMissed(M.empty(), '2026-09-14', ['coo'], new Date('2026-09-21T13:00:00Z')), /after Monday/);
  let state = M.assessMissed(M.empty(), '2026-09-14', ['coo', 'cfo'], new Date('2026-09-21T13:00:00.001Z'));
  state = M.assessMissed(state, '2026-09-14', ['coo', 'cfo'], new Date('2026-09-22T13:00:00Z'));
  assert.equal(state.events.length, 2);
  assert.equal(M.score(state, 'coo'), 90);
  assert.equal(state.events[0].type, 'missed_submission');
});
test('draft changes do not overwrite the submitted snapshot', () => {
  const state = M.submit(M.empty(), '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-18T20:59:00Z'));
  const changed = draft(); changed.entries[0].title = 'Unsubmitted change';
  const next = M.saveDraft(state, '2026-09-14', 'coo', changed);
  assert.notEqual(next.records['2026-09-14:coo'].draft.entries[0].title, next.records['2026-09-14:coo'].submitted.snapshot.entries[0].title);
});
test('validation distinguishes missing submissions, declarations and enterprise commitments', () => {
  assert.match(M.validate(M.freshDraft(), initiatives), /Choose whether/);
  assert.match(M.validate({ capacity: 'enterprise', entries: [] }, initiatives), /at least one/);
  const bad = draft(); bad.capacity = 'capacity'; assert.match(M.validate(bad, initiatives), /cannot contain/);
  const noProject = draft(); noProject.entries[0].projectId = ''; assert.match(M.validate(noProject, initiatives), /project plan/);
  assert.throws(() => M.submit(M.empty(), '2027-01-04', 'coo', draft(), initiatives, new Date('2026-09-18T12:00:00Z')), /future draft/);
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
