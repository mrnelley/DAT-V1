import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import '../public/scorecard-demo/weekly-model.js';
const M = globalThis.CompassWeeklyModel;
const initiatives = [{ id: 'a1' }];
const draft = () => ({ capacity: 'enterprise', note: '', entries: [{ ...M.entry('2026-09-14', 'coo'), title: 'Review the weekly workflow', desiredResult: 'Agree the fields', projectId: 'a1', initiativeId: 'a1' }] });
test('Friday at 5pm Eastern follows daylight saving time', () => {
  assert.equal(M.deadline('2026-09-14'), '2026-09-18T21:00:00.000Z');
  assert.equal(M.deadline('2026-11-02'), '2026-11-06T22:00:00.000Z');
  assert.equal(M.deadline('2026-03-02'), '2026-03-06T22:00:00.000Z');
  assert.equal(M.deadline('2026-03-09'), '2026-03-13T21:00:00.000Z');
  assert.equal(M.weekOf(new Date('2026-09-21T01:00:00Z')), '2026-09-14');
});
test('an on-time capacity declaration counts as submitted with 100 points', () => {
  const state = M.submit(M.empty(), '2026-09-14', 'coo', { capacity: 'capacity', note: '', entries: [] }, initiatives, new Date('2026-09-18T21:00:00Z'));
  assert.equal(M.score(state, 'coo'), 100);
  assert.equal(state.events.length, 0);
  assert.ok(state.records['2026-09-14:coo'].submitted);
});
test('late submission creates one pending deduction and editing never duplicates it', () => {
  let state = M.submit(M.empty(), '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-18T21:00:00.001Z'));
  const first = state.records['2026-09-14:coo'].submitted.firstAt;
  assert.equal(state.events[0].points, null);
  state = M.setDeduction(state, 5);
  state = M.submit(state, '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-20T21:00:00Z'));
  state = M.setDeduction(state, 10);
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].points, 5);
  assert.equal(M.score(state, 'coo'), 95);
  assert.equal(state.records['2026-09-14:coo'].submitted.firstAt, first);
});
test('editing an on-time submission after the deadline causes no late deduction', () => {
  let state = M.submit(M.setDeduction(M.empty(), 5), '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-18T20:59:00Z'));
  state = M.submit(state, '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-21T12:00:00Z'));
  assert.equal(state.events.length, 0);
});
test('points carry across years and remain isolated by position', () => {
  let state = M.setDeduction(M.empty(), 5);
  state = M.submit(state, '2026-09-14', 'coo', draft(), initiatives, new Date('2026-09-20T12:00:00Z'));
  state = M.submit(state, '2027-01-04', 'coo', draft(), initiatives, new Date('2027-01-10T12:00:00Z'));
  assert.equal(M.score(state, 'coo'), 90);
  assert.equal(M.score(state, 'cfo'), 100);
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
function browser() {
  let html = readFileSync('public/scorecard-demo/index.html', 'utf8');
  for (const name of ['weekly-model.js', 'weekly.js']) html = html.replace(`<script src="${name}"></script>`, () => `<script>${readFileSync('public/scorecard-demo/' + name, 'utf8')}</script>`);
  const errors = [];
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'dangerously', beforeParse(w) {
    w.HTMLDialogElement.prototype.showModal = function() { this.setAttribute('open', ''); };
    w.HTMLDialogElement.prototype.close = function() { this.removeAttribute('open'); this.dispatchEvent(new w.Event('close')); };
    w.addEventListener('error', e => errors.push(e.message));
  } });
  return { dom, d: dom.window.document, errors };
}
test('initiative metric opens all ten priorities with consistent health and working details', () => {
  const { dom, d, errors } = browser();
  d.querySelector('[data-surface="annual"]').click();
  d.querySelector('[data-metric="a9m1"]').click();
  const rows = [...d.querySelectorAll('.initiative-row')];
  assert.equal(rows.length, 10);
  assert.equal(rows.filter(r => r.querySelector('.badge.good')).length, 8);
  for (const r of rows) { d.querySelector(`.initiative-row[data-id="${r.dataset.id}"]`).click(); assert.match(d.querySelector('#detail-body').textContent, /Accountable position/); d.querySelector('#back').click(); }
  assert.deepEqual(errors, []); dom.window.close();
});
test('weekly form saves capacity, submits to rollup, and keeps draft edits separate', () => {
  const { dom, d, errors } = browser();
  const change = (el, value) => { el.value = value; el.dispatchEvent(new dom.window.Event('change', { bubbles: true })); };
  d.querySelector('[data-surface="weekly"]').click();
  const radio = d.querySelector('[name="capacity"][value="capacity"]'); radio.checked = true; change(radio, 'capacity');
  d.querySelector('#weekly-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  assert.match(d.querySelector('#weekly-message').textContent, /submission saved/);
  d.querySelector('[data-weekly-view="rollup"]').click();
  assert.equal(d.querySelectorAll('.capacity-tag').length, 1);
  d.querySelector('[data-weekly-view="mine"]').click();
  change(d.querySelector('#capacity-note'), '<script>literal text</script>');
  d.querySelector('[data-weekly-view="rollup"]').click();
  assert.doesNotMatch(d.querySelector('.rollup-list').textContent, /literal text/);
  d.querySelector('[data-weekly-view="mine"]').click();
  d.querySelector('#weekly-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  d.querySelector('[data-weekly-view="rollup"]').click();
  assert.match(d.querySelector('.rollup-list').textContent, /literal text/);
  assert.equal(d.querySelectorAll('.rollup-list script').length, 0);
  d.querySelector('[data-weekly-view="review"]').click(); assert.ok(d.querySelector('.review-table'));
  assert.deepEqual(errors, []); dom.window.close();
});
