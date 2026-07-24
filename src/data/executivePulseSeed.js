import { buildQ2ExecutivePulseSeed, q2ReportingPeriodId } from './q2WorkbookScaffold';

export const scorecardStatusOptions = ['On Track', 'Needs Attention', 'Off Track', 'No Data'];

const blankMetric = (id) => ({
  currentStatus: '',
  dept: '',
  id,
  kpi: '',
  month1: '',
  month2: '',
  month3: '',
  periodResult: '',
  priorPeriodResult: '',
  progress: '',
  status: 'No Data',
  target: '',
});

const scorecardTemplate = ({
  accent,
  id,
  orgPriority,
  strategicGoal,
  title,
}) => ({
  accent,
  id,
  metrics: [blankMetric(`${id}-metric-1`)],
  orgPriority,
  status: 'No Data',
  strategicGoal,
  title,
});

export const executivePulseSeed = {
  discussionQuestions: [
    { id: 'ahead', prompt: 'Where are we ahead of plan?', response: '' },
    { id: 'behind', prompt: 'Where are we behind expectations?', response: '' },
    { id: 'attention', prompt: 'Which trends require board attention?', response: '' },
    { id: 'risk', prompt: 'What risks could affect our performance?', response: '' },
  ],
  enterprisePriorities: [],
  mission: '',
  preparedFor: '',
  scorecards: [
    scorecardTemplate({
      accent: '#339980',
      id: 'mission-impact',
      orgPriority: '',
      strategicGoal: 'Mission and Impact',
      title: 'Mission and Impact',
    }),
    scorecardTemplate({
      accent: '#1a66a8',
      id: 'financial-health',
      orgPriority: '',
      strategicGoal: 'Financial Health',
      title: 'Financial Health',
    }),
    scorecardTemplate({
      accent: '#7a4aa0',
      id: 'fundraising-revenue',
      orgPriority: '',
      strategicGoal: 'Fundraising and Revenue',
      title: 'Fundraising and Revenue',
    }),
    scorecardTemplate({
      accent: '#c98a2a',
      id: 'strategic-priorities',
      orgPriority: '',
      strategicGoal: 'Strategic Priorities',
      title: 'Strategic Priorities',
    }),
    scorecardTemplate({
      accent: '#2c9aa0',
      id: 'organizational-capacity',
      orgPriority: '',
      strategicGoal: 'Organizational Capacity',
      title: 'Organizational Capacity',
    }),
    scorecardTemplate({
      accent: '#b03a34',
      id: 'risk-governance',
      orgPriority: '',
      strategicGoal: 'Risk and Governance',
      title: 'Risk and Governance',
    }),
  ],
};

export const getExecutivePulseSeed = (reportingPeriodId, directory = []) => (
  reportingPeriodId === q2ReportingPeriodId
    ? buildQ2ExecutivePulseSeed(directory)
    : executivePulseSeed
);
