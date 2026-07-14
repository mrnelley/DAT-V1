export const sourceAlignmentPrinciples = [
  {
    label: 'Operating intent',
    text: 'Compass is a centralized operational accountability system for enterprise visibility, alignment, ownership, and execution discipline.',
  },
  {
    label: 'Scope boundary',
    text: 'Compass is an operational leadership platform, not a task manager. Routine one-off work belongs in Day-to-Day Tasks only when it does not belong under the weekly plan.',
  },
  {
    label: 'Accountability chain',
    text: 'Strategic plan, Enterprise Priorities, department workplans, Departmental Priorities, Weekly Priorities, Action Items, stucks, and calendar commitments should stay connected.',
  },
  {
    label: 'Leadership rhythm',
    text: 'Reporting should reinforce existing ELT, OLT, department, and individual workflows instead of creating another administrative burden.',
  },
];

export const dashboardReportingMap = [
  {
    level: 'Board',
    reports: [
      'Annual scorecard KPIs by strategic goal, org priority, department, target, progress, and current status.',
      'Board discussion prompts for trends, risks, and performance context.',
    ],
    source: 'HDCWorkplanTemplate.pdf - 2026 Annual Scorecard',
    surface: 'Executive Pulse',
    where: 'Board-level reporting and print/export readout',
    not: 'Not a weekly work management view.',
  },
  {
    level: 'ELT',
    reports: [
      'Quarterly Enterprise Priorities, Key Objectives, KPI end-of-quarter targets, owners, status, and milestone updates.',
      'Cross-functional items that need decisions, resources, intervention, or escalation.',
    ],
    source: 'Q2Roadmap-Local.xlsx and OLT_Action Tracker-local.xlsx',
    surface: 'Organization Dashboard',
    where: 'Enterprise priority health, strategic pillar coverage, and organization calendar',
    not: 'Not a department task queue.',
  },
  {
    level: 'Department',
    reports: [
      'Org Priority, KPI, Department Objective, year-end target, start/end dates, status, progress, progress/challenges, last update, lead person, and project-plan link.',
      'Objective alignment to strategic pillars and Enterprise Priorities.',
    ],
    source: 'HDCWorkplanTemplate.pdf - 2026 Annual Workplan tabs',
    surface: 'Department Workplans',
    where: 'Department-owned annual plan and objective-level accountability',
    not: 'Not the weekly ranked commitment sheet.',
  },
  {
    level: 'OLT and Individuals',
    reports: [
      '#1 Most Important Priority, #2 Priority, and #3 Priority for each week.',
      'Enterprise Priority or Departmental Priority alignment, desired result, and named risk/support needed.',
    ],
    source: 'OLT_Action Tracker-local.xlsx - dated weekly priority tabs',
    surface: 'Weekly Tracker',
    where: 'Weekly commitment setting, Action Items, carry-forward, and stuck creation',
    not: 'Not the place for every routine task.',
  },
  {
    level: 'OLT',
    reports: [
      'Items that impact multiple departments, shared KPIs, cross-functional workflows, staffing, timing, or operational disruption risk.',
      'Support needed from OLT and escalation to ELT when risk or authority is beyond OLT.',
    ],
    source: 'OLT_Action Tracker-local.xlsx - OLT Decision Tree and OLT Action Sheet',
    surface: 'Huddles and Stucks',
    where: 'Meeting rhythm, blocker surfacing, owner follow-up, and escalation decisions',
    not: 'Not a replacement for the Enterprise Priority register.',
  },
  {
    level: 'Executive Office and Advancement',
    reports: [
      'Partner profile, key geography, Moves Management goal, primary contacts, managers, MM code, and status movement.',
      'Touch Report fields: filed by, date, contact method, MM code, description of activity, next steps, target completion date, and status.',
    ],
    source: 'Moves Management Master Sheet.xlsx and Touch Reports.xlsx',
    surface: 'Advocacy Dashboard',
    where: 'Temporary advocacy and relationship tracking until CRM implementation',
    not: 'Not the final CRM of record.',
  },
  {
    level: 'Organization',
    reports: [
      'Key operational milestones, deadlines, launches, events, and cross-department dependencies.',
      'Shared visibility to reduce operational collisions, duplication, and reactive planning.',
    ],
    source: 'Accountability Tracker overview.pdf',
    surface: 'Organization Calendar',
    where: 'Organization-wide and personal calendar commitments',
    not: 'Not a priority or action registry.',
  },
  {
    level: 'Individual',
    reports: [
      'Standalone one-off work that does not belong under the Weekly Tracker yet.',
      'Assigned-by, owner, due date, visibility, status, and optional workplan alignment.',
    ],
    source: 'Compass support workflow',
    surface: 'Day-to-Day Tasks',
    where: 'Personal task queue and follow-up surface',
    not: 'Not the normal way to set weekly priorities.',
  },
];

export const departmentWorkProcessMap = [
  {
    dashboard: 'Administration and Feature Rollout',
    department: 'Administration',
    reportsTo: 'Feature Rollout, permissions, and system governance',
    source: 'Compass operating model',
    weeklyProcess: 'Control access, rollout timing, and administrative enablement. Escalate governance issues when role access or workflow ownership is unclear.',
  },
  {
    dashboard: 'Advocacy Dashboard',
    department: 'Community Relations',
    reportsTo: 'Advocacy Dashboard, Department Workplans, Weekly Tracker, and Executive Pulse',
    source: 'Moves Management Master Sheet, Touch Reports, and Annual Workplan',
    weeklyProcess: 'Log partner touch reports, move next steps forward, track MM goal/status movement, and connect relationship work to Enterprise Revenue, Advocacy, and resident-support priorities.',
  },
  {
    dashboard: 'Property Management Dashboard',
    department: 'Compliance',
    reportsTo: 'Property Management Dashboard, Department Workplans, OLT Action Sheet, and Executive Pulse',
    source: 'Annual Workplan and OLT Action Sheet',
    weeklyProcess: 'Track noncompliance, NSPIRE/readiness, training, consultant reliance, and compliance support needed for property operations.',
  },
  {
    dashboard: 'Executive View and Advocacy Dashboard',
    department: 'Executive Office',
    reportsTo: 'Organization Dashboard, Advocacy Dashboard, Weekly Tracker, and Organization Calendar',
    source: 'Accountability Tracker overview, Moves Management, and Touch Reports',
    weeklyProcess: 'Coordinate enterprise visibility, advocacy touch points, board/ELT context, cross-department dependencies, and executive follow-through.',
  },
  {
    dashboard: 'Finance Dashboard',
    department: 'Finance',
    reportsTo: 'Department Workplans, Organization Dashboard, OLT Action Sheet, Weekly Tracker, and Executive Pulse',
    source: 'Annual Workplan, Q2 Roadmap, and OLT Action Sheet',
    weeklyProcess: 'Track A/R, A/P, cash, days cash, asset management, fee income, close/loan activity, and finance-owned support needed from PM, RED, HR, or ELT.',
  },
  {
    dashboard: 'People Dashboard',
    department: 'Human Resources',
    reportsTo: 'Department Workplans, Weekly Tracker, OLT Action Sheet, and Executive Pulse',
    source: 'Annual Workplan and OLT Action Sheet',
    weeklyProcess: 'Track retention, employee satisfaction/engagement, open positions, assessment implementation, onboarding, benefits, and leadership development work.',
  },
  {
    dashboard: 'Impact and Advancement Dashboard',
    department: 'Impact and Advancement',
    reportsTo: 'Advocacy Dashboard, Department Workplans, Weekly Tracker, Organization Dashboard, and Executive Pulse',
    source: 'Moves Management Master Sheet, Touch Reports, Q2 Roadmap, and Annual Workplan',
    weeklyProcess: 'Track contributed revenue, corporate sponsorships, grants, faith-based campaign work, partner cultivation, and follow-up actions.',
  },
  {
    dashboard: 'My Operating View',
    department: 'Operations',
    reportsTo: 'Organization Dashboard, Huddles, Stucks, OLT Action Sheet, Weekly Tracker, and Calendar',
    source: 'Accountability Tracker overview, OLT Decision Tree, and OLT Action Sheet',
    weeklyProcess: 'Coordinate operating rhythms, cross-functional issues, dependencies, deadlines, calendar collisions, and escalation pathways between OLT and ELT.',
  },
  {
    dashboard: 'Property Management Dashboard',
    department: 'Property Management',
    reportsTo: 'Property Management Dashboard, Department Workplans, Weekly Tracker, OLT Action Sheet, and Executive Pulse',
    source: 'Annual Workplan, Q2 Roadmap, and OLT Action Sheet',
    weeklyProcess: 'Track leasing, occupancy, rent collection, housing stability, PM fees, vacancy loss, turn time, maintenance, third-party exits, resident communication, and portfolio risks.',
  },
  {
    dashboard: 'Real Estate Development Dashboard',
    department: 'Real Estate Development',
    reportsTo: 'Department Workplans, Organization Dashboard, Weekly Tracker, OLT Action Sheet, and Executive Pulse',
    source: 'Annual Workplan, Q2 Roadmap, and OLT Action Sheet',
    weeklyProcess: 'Track pipeline, acquisitions, closings, LIHTC activity, underwriting, NEPA repositioning, capital fundraising support, drawings, and project-plan milestones.',
  },
  {
    dashboard: 'Resident Services Dashboard',
    department: 'Resident Services',
    reportsTo: 'Resident Services Dashboard, Department Workplans, Weekly Tracker, Touch Reports, and Executive Pulse',
    source: 'Annual Workplan, Touch Reports, and 2026 Annual Scorecard',
    weeklyProcess: 'Track resident satisfaction, resident experience, housing stability, partner connections, service utilization, referrals, and resident feedback loops.',
  },
];
