import { expect } from 'chai';
import {
  buildQ2EnterprisePriorities,
  buildQ2ExecutivePulseSeed,
  buildQ2WeeklyPriorityEntries,
  q2ReportingPeriodId,
  q2WeeklyPriorityCount,
  q2WorkbookSummary,
} from '../src/data/q2WorkbookScaffold.js';
import { users } from '../src/data/mockData.js';

describe('Q2 2026 workbook scaffold', () => {
  it('builds all enterprise priority lanes, objectives, targets, and health signals', () => {
    const priorities = buildQ2EnterprisePriorities(users);
    const objectives = priorities.flatMap((priority) => priority.keyObjectives);

    expect(priorities).to.have.length(5);
    expect(objectives).to.have.length(14);
    expect(new Set(priorities.map((priority) => priority.id)).size).to.equal(5);
    expect(new Set(objectives.map((objective) => objective.id)).size).to.equal(14);
    expect(priorities.every((priority) => priority.reportingPeriodId === q2ReportingPeriodId)).to.equal(true);
    expect(objectives.filter((objective) => objective.status === 'Steady')).to.have.length(7);
    expect(objectives.filter((objective) => objective.status === 'Watch')).to.have.length(2);
    expect(objectives.filter((objective) => objective.status === 'Alert')).to.have.length(5);
    expect(objectives.every((objective) => objective.kpis[0].target)).to.equal(true);
    expect(objectives.every((objective) => objective.notes)).to.equal(true);
  });

  it('turns the same objective records into the Q2 executive scorecard', () => {
    const scorecard = buildQ2ExecutivePulseSeed(users);
    const metrics = scorecard.scorecards.flatMap((card) => card.metrics);

    expect(scorecard.reportingPeriodId).to.equal('2026-Q2');
    expect(scorecard.scorecards).to.have.length(5);
    expect(metrics).to.have.length(14);
    expect(metrics.filter((metric) => metric.status === 'On Track')).to.have.length(7);
    expect(metrics.filter((metric) => metric.status === 'Needs Attention')).to.have.length(2);
    expect(metrics.filter((metric) => metric.status === 'Off Track')).to.have.length(5);
    expect(q2WorkbookSummary.priorityCount).to.equal(14);
    expect(q2WorkbookSummary.newPriorityCount).to.equal(2);
  });

  it('preserves all eight Q2 weekly sheets and their workbook fields', () => {
    const entriesByWeek = buildQ2WeeklyPriorityEntries(users);
    const entries = Object.values(entriesByWeek).flat();

    expect(Object.keys(entriesByWeek)).to.have.length(8);
    expect(Object.values(entriesByWeek).map((week) => week.length)).to.deep.equal([
      33,
      24,
      25,
      24,
      27,
      26,
      19,
      26,
    ]);
    expect(entries).to.have.length(q2WeeklyPriorityCount);
    expect(q2WeeklyPriorityCount).to.equal(204);
    expect(new Set(entries.map((entry) => entry.id)).size).to.equal(204);
    expect(entries.every((entry) => entry.title && entry.owner && entry.sourceSheet)).to.equal(true);
    expect(entries.some((entry) => entry.desiredResult)).to.equal(true);
    expect(entries.some((entry) => entry.riskSupportNote)).to.equal(true);
    expect(entries.some((entry) => entry.sourceAlignmentLabel)).to.equal(true);
  });
});
