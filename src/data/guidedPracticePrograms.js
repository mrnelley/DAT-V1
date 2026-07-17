export const practiceProgramLabels = {
  elt: 'ELT Practice Mode',
  olt: 'OLT Practice Mode',
};

const oltTasks = [
  {
    description: 'Create and maintain the department plan that connects annual objectives to enterprise direction.',
    id: 'department-workplans',
    label: 'Create Department Work Plans',
    steps: [
      {
        body: 'Start on the Department Workplans surface. This is where annual department accountability is translated into objectives, owners, KPIs, targets, and alignment.',
        route: '/workplans',
        targetId: 'workplans-header',
        title: 'Find the department planning surface',
      },
      {
        body: 'Use this action when a department needs a new annual workplan or a reset of its objective structure.',
        route: '/workplans',
        targetId: 'workplans-add-button',
        title: 'Start a department workplan',
      },
      {
        body: 'Each workplan is built from Department Objectives. A good objective names the result the department is accountable for, not just a standing activity.',
        route: '/workplans?new=1',
        targetId: 'workplan-objective-title',
        title: 'Name the department objective',
      },
      {
        body: 'Capture the KPI and year-end target while the objective is created. This keeps reporting from becoming a separate cleanup exercise later.',
        route: '/workplans?new=1',
        targetId: 'workplan-kpi-targets',
        title: 'Add measurement and target context',
      },
      {
        body: 'Link the objective back to the right Strategic Pillar and Enterprise Priority when one exists. This is what lets weekly work roll back up cleanly.',
        route: '/workplans?new=1',
        targetId: 'workplan-enterprise-alignment',
        title: 'Connect the workplan to enterprise direction',
      },
    ],
  },
  {
    description: 'Update the scorecard fields that support quarterly visibility and leadership review.',
    id: 'quarterly-scorecard',
    label: 'Update the Quarterly Scorecard',
    steps: [
      {
        body: 'Executive Pulse is the board-facing scorecard surface. OLT updates should be concise, current, and tied to evidence.',
        route: '/dashboard/executive-pulse',
        targetId: 'executive-pulse-header',
        title: 'Open the scorecard surface',
      },
      {
        body: 'Period and prepared-for fields establish the reporting context before the details are reviewed or exported.',
        route: '/dashboard/executive-pulse',
        targetId: 'executive-pulse-report-context',
        title: 'Confirm the reporting context',
      },
      {
        body: 'Open the relevant scorecard card to update KPI rows, current status, progress, and signal.',
        route: '/dashboard/executive-pulse',
        targetId: 'executive-pulse-scorecard-card',
        title: 'Choose a scorecard area',
      },
      {
        body: 'Use current status notes for the short narrative: what changed, what needs attention, and what decision or support may be needed.',
        route: '/dashboard/executive-pulse',
        targetId: 'executive-pulse-board-questions',
        title: 'Prepare board-ready context',
      },
    ],
  },
  {
    description: 'Set the weekly commitments that move department and enterprise priorities forward.',
    id: 'weekly-priorities',
    label: 'Log Weekly Priorities',
    steps: [
      {
        body: 'The Weekly Tracker is the weekly accountability surface. It is for ranked commitments, not every routine task.',
        route: '/weekly-tracker',
        targetId: 'weekly-tracker-header',
        title: 'Open the weekly accountability surface',
      },
      {
        body: 'Start with your own top weekly commitment. The priority should be specific enough to review at the end of the week.',
        route: '/weekly-tracker',
        targetId: 'weekly-priority-set-button',
        title: 'Set your weekly priority',
      },
      {
        body: 'Write the weekly priority as a concrete outcome. If it cannot be reviewed next week, it is probably too broad.',
        route: '/weekly-tracker?new=priority',
        targetId: 'weekly-priority-title',
        title: 'Describe the weekly result',
      },
      {
        body: 'Tie the weekly priority to a Department Objective or Enterprise Priority so reporting does not become disconnected from the work.',
        route: '/weekly-tracker?new=priority',
        targetId: 'weekly-priority-alignment-objective',
        title: 'Align the priority',
      },
      {
        body: 'Use the health and support fields to name risk early. This gives teammates a clean way to help before the work becomes off track.',
        route: '/weekly-tracker?new=priority',
        targetId: 'weekly-priority-support-note',
        title: 'Name risk or support needed',
      },
    ],
  },
  {
    description: 'Make support needs visible so teammates know where to help unblock work.',
    id: 'support-requests',
    label: 'Request Support From Teammates',
    steps: [
      {
        body: 'Support starts in the weekly priority itself. Name the risk, the person or team who can help, and the specific decision or action needed.',
        route: '/weekly-tracker?new=priority',
        targetId: 'weekly-priority-support-note',
        title: 'Describe the support needed',
      },
      {
        body: 'When work is blocked by a task-level issue, use Stucks so the request has a person stuck, a helper, and a source task.',
        route: '/stucks',
        targetId: 'stucks-header',
        title: 'Use the stucks surface for blockers',
      },
      {
        body: 'This action is available when you have a task that can be linked. It keeps help requests accountable instead of informal.',
        route: '/stucks',
        targetId: 'stucks-issue-button',
        title: 'Issue a stuck when a task is blocked',
      },
    ],
  },
  {
    description: 'Review and report progress in the views leadership uses to see enterprise movement.',
    id: 'enterprise-progress',
    label: 'Report Progress Toward Enterprise Priorities',
    steps: [
      {
        body: 'The Organization Dashboard is the shared readout of enterprise priority health, status signals, owners, and KPI evidence.',
        route: '/dashboard/organization',
        targetId: 'organization-dashboard-header',
        title: 'Open the enterprise progress view',
      },
      {
        body: 'This register connects each Enterprise Priority to status, KPI progress, objective owners, and weekly movement.',
        route: '/dashboard/organization',
        targetId: 'enterprise-priority-register',
        title: 'Read the Enterprise Priority register',
      },
      {
        body: 'The quarter and theme context explain why the current priorities matter now and how the organization is framing the reporting period.',
        route: '/dashboard/organization',
        targetId: 'executive-quarter-pulse',
        title: 'Check the quarterly reporting frame',
      },
    ],
  },
];

const eltExtraTasks = [
  {
    description: 'Shape the strategic objective structure that organizes enterprise priorities, objectives, and KPI evidence.',
    id: 'strategic-objectives',
    label: 'Manage Strategic Objectives',
    steps: [
      {
        body: 'The Strategic Plan section is where ELT can see the relationship between pillars, quarterly roadmap, enterprise priorities, and department workplans.',
        route: '/dashboard/organization',
        targetId: 'strategic-plan-header',
        title: 'Review the strategic plan frame',
      },
      {
        body: 'Pillar cards show the strategic objective family for the quarter: priorities, success metrics, attention signals, and workplan progress.',
        route: '/dashboard/organization',
        targetId: 'strategic-pillar-card',
        title: 'Inspect the strategic pillar view',
      },
      {
        body: 'Use Enterprise Priorities when ELT needs to create or revise the quarter-level commitments and key objectives.',
        route: '/priorities',
        targetId: 'priorities-add-button',
        title: 'Create or revise an Enterprise Priority',
      },
      {
        body: 'Key Objectives give the priority its owners, KPIs, targets, and status. The priority signal should come from this evidence.',
        route: '/priorities?new=1',
        targetId: 'priority-key-objective',
        title: 'Define the key objective structure',
      },
    ],
  },
  {
    description: 'Use the quarter and theme as the common frame for ELT decisions and progress conversations.',
    id: 'quarterly-themes',
    label: 'Review Quarterly Themes',
    steps: [
      {
        body: 'The quarter chip and theme provide the shared timebox and narrative frame for the current enterprise commitments.',
        route: '/dashboard/organization',
        targetId: 'executive-quarter-pulse',
        title: 'Anchor the quarter and theme',
      },
      {
        body: 'The dashboard period control keeps the organization focused on the current planning window.',
        route: '/dashboard/organization',
        targetId: 'dashboard-period-control',
        title: 'Confirm the active dashboard period',
      },
      {
        body: 'The Enterprise Priority register shows whether the quarter is moving as expected and where ELT needs to intervene.',
        route: '/dashboard/organization',
        targetId: 'enterprise-priority-register',
        title: 'Read quarter health from evidence',
      },
    ],
  },
  {
    description: 'Prepare the board-facing readout with scorecard context, KPI evidence, and discussion prompts.',
    id: 'board-reporting',
    label: 'Prepare Board Reporting',
    steps: [
      {
        body: 'Executive Pulse is the board-reporting workspace for mission context, scorecards, KPI signals, and discussion prompts.',
        route: '/dashboard/executive-pulse',
        targetId: 'executive-pulse-header',
        title: 'Open Executive Pulse',
      },
      {
        body: 'Confirm the period, audience, and mission context before preparing exports or review materials.',
        route: '/dashboard/executive-pulse',
        targetId: 'executive-pulse-report-context',
        title: 'Set the report context',
      },
      {
        body: 'Open scorecard cards to review KPI rows, current status, quarter values, and the signal that will be visible in the report.',
        route: '/dashboard/executive-pulse',
        targetId: 'executive-pulse-scorecard-card',
        title: 'Review scorecard evidence',
      },
      {
        body: 'Discussion questions capture the board-level decisions, risks, or context that should not be buried in KPI rows.',
        route: '/dashboard/executive-pulse',
        targetId: 'executive-pulse-board-questions',
        title: 'Prepare discussion prompts',
      },
      {
        body: 'Use export or print when the live view needs to become a board packet artifact.',
        route: '/dashboard/executive-pulse',
        targetId: 'executive-pulse-export-actions',
        title: 'Export or save the board report',
      },
    ],
  },
];

export const practicePrograms = {
  elt: {
    description: 'Practice the ELT workflow for strategic objectives, quarterly themes, board reporting, and operating accountability.',
    id: 'elt',
    label: practiceProgramLabels.elt,
    tasks: [...eltExtraTasks, ...oltTasks],
  },
  olt: {
    description: 'Practice the OLT workflow for workplans, scorecards, weekly priorities, support requests, and enterprise progress reporting.',
    id: 'olt',
    label: practiceProgramLabels.olt,
    tasks: oltTasks,
  },
};

export const getPracticeProgram = (programId) => practicePrograms[programId] || practicePrograms.olt;

export const getPracticeTask = (programId, taskId) => (
  getPracticeProgram(programId).tasks.find((task) => task.id === taskId) || null
);
