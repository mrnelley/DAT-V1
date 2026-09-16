import test from 'node:test';
import assert from 'node:assert/strict';
import { pillars, strategicMetrics, departmentMetrics, quarterlyObjectives, revenueMix } from '../src/features/planning/catalog.js';
import { calculateMetric as calculate, meetsTarget } from '../src/features/planning/metricCalculations.js';
import { strategyObjectives } from '../src/features/planning/strategyObjectives.js';

test('supplied strategy and Q3 relationships resolve without inventing missing content', () => {
  assert.equal(pillars.length, 5);
  assert.equal(pillars.flatMap(p => p.strategies).length, 15);
  assert.equal(strategicMetrics.length, 19);
  const ids = new Set(pillars.map(p => p.id));
  for (const item of [...strategicMetrics, ...quarterlyObjectives]) assert.ok(ids.has(item.pillarId));
  assert.equal(quarterlyObjectives.filter(o => o.title).length, 14);
  assert.equal(quarterlyObjectives.filter(o => o.title === 'Advance College Ave Phase 2 Closing').length, 1);
  assert.equal(new Set(departmentMetrics.map(m => m.id)).size, departmentMetrics.length);
  assert.ok(departmentMetrics.every(m => m.actual === null && m.calculationType === null));
  const strategies = new Set(pillars.flatMap(p => p.strategies.map(s => s.id)));
  for (const objective of strategyObjectives) assert.ok(strategies.has(objective.strategyId));
  assert.equal(new Set(strategyObjectives.map(o => o.id)).size, strategyObjectives.length);
  assert.ok(strategyObjectives.every(o => o.mappingStatus === 'confirmed-source-grouping'));
});
test('rates aggregate from counts rather than averaging departmental percentages', () => {
  assert.equal(calculate('percentage', { numerator: 9 + 1, denominator: 10 + 100 }).value, 1000 / 110);
  assert.equal(calculate('weightedMean', { values: [90, 1], weights: [10, 100] }).value, 1000 / 110);
});
test('revenue bindings resolve and keep contribution components out of the summed total', () => {
  const ids = new Set(departmentMetrics.map(metric => metric.id));
  for (const stream of revenueMix.streams) for (const id of stream.metricIds) assert.ok(ids.has(id));
  assert.deepEqual(revenueMix.streams[1].metricIds, ['finance-5', 'finance-6']);
  const contributed = revenueMix.streams[2];
  assert.ok(contributed.componentMetricIds.every(id => !contributed.metricIds.includes(id)));
  assert.equal(revenueMix.status, 'mapped');
});
test('missing observations and zero denominators never become a false zero', () => {
  for (const input of [{ numerator: 0, denominator: 0 }, { numerator: null, denominator: 10 }])
    assert.equal(calculate('percentage', input).status, 'pending');
  assert.equal(calculate('reported', { value: 0 }).value, 0);
  assert.equal(calculate('sum', { values: [1, null] }).value, null);
});
test('growth, ratios and weighted results retain their distinct meaning', () => {
  assert.equal(calculate('growth', { baseline: 100, current: 125 }).value, 25);
  assert.equal(calculate('growth', { baseline: 0, current: 125 }).value, null);
  assert.equal(calculate('ratio', { numerator: 150, denominator: 100 }).value, 1.5);
  assert.equal(calculate('weightedMean', { values: [10], weights: [-1] }).value, null);
  assert.equal(calculate('custom-executable-formula', {}).value, null);
});
test('strict targets, inclusive ranges and undefined blends keep their meaning', () => {
  assert.equal(meetsTarget(750, { operator: 'gt', value: 750 }), false);
  assert.equal(meetsTarget(751, { operator: 'gt', value: 750 }), true);
  assert.equal(meetsTarget(150, { operator: 'gte', value: 150 }), true);
  assert.equal(meetsTarget(7, { operator: 'range', value: 5, upper: 7 }), true);
  assert.equal(meetsTarget(8, { operator: 'range', value: 5, upper: 7 }), false);
  assert.equal(meetsTarget(90, { operator: 'gt', value: 80, definitionPending: true }), null);
});
