import { expect } from 'chai';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
});

global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', {
  configurable: true,
  value: dom.window.navigator,
});
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.Node = dom.window.Node;
global.Element = dom.window.Element;
global.DocumentFragment = dom.window.DocumentFragment;
global.AbortController = dom.window.AbortController;
global.AbortSignal = dom.window.AbortSignal;
global.File = dom.window.File;
global.Blob = dom.window.Blob;
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

window.matchMedia = window.matchMedia || (() => ({
  addEventListener: () => {},
  addListener: () => {},
  dispatchEvent: () => false,
  matches: false,
  media: '',
  onchange: null,
  removeEventListener: () => {},
  removeListener: () => {},
}));

const unwrapElementType = (type) => {
  const maybeComponent = type && typeof type === 'object'
    ? type.default?.default || type.default
    : null;

  return maybeComponent && (typeof maybeComponent === 'function' || maybeComponent.$$typeof)
    ? maybeComponent
    : type;
};

const patchJsxRuntime = (moduleName) => {
  const runtime = require(moduleName);
  const baseJsx = runtime.jsx;
  const baseJsxs = runtime.jsxs;
  const baseJsxDev = runtime.jsxDEV;

  if (baseJsx) {
    runtime.jsx = (type, props, key) => baseJsx(unwrapElementType(type), props, key);
  }

  if (baseJsxs) {
    runtime.jsxs = (type, props, key) => baseJsxs(unwrapElementType(type), props, key);
  }

  if (baseJsxDev) {
    runtime.jsxDEV = (type, props, key, isStaticChildren, source, self) => (
      baseJsxDev(unwrapElementType(type), props, key, isStaticChildren, source, self)
    );
  }
};

patchJsxRuntime('react/jsx-runtime');
patchJsxRuntime('react/jsx-dev-runtime');

const { default: React } = await import('react');
global.React = React;
const baseCreateElement = React.createElement;
React.createElement = (type, props, ...children) => baseCreateElement(
  unwrapElementType(type),
  props,
  ...children,
);
const { ThemeProvider } = await import('@mui/material/styles');
const { CssBaseline } = await import('@mui/material');
const { MemoryRouter, Route, Routes, useLocation } = await import('react-router-dom');
const { cleanup, fireEvent, render, screen, waitFor, within } = await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');
const { AuthProvider } = await import('../src/hooks/useAuth.js');
const { ActionFeedbackProvider } = await import('../src/context/ActionFeedbackContext.jsx');
const { CalendarEventProvider } = await import('../src/context/CalendarEventContext.jsx');
const { FeatureAccessProvider } = await import('../src/context/FeatureAccessContext.jsx');
const { NotificationsProvider } = await import('../src/context/NotificationsContext.jsx');
const { OperatingDataProvider } = await import('../src/context/OperatingDataContext.jsx');
const { default: theme } = await import('../src/theme/index.js');
const { default: CompanyDashboardOverview } = await import('../src/components/dashboard/CompanyDashboardOverview.jsx');
const { default: CurrentWeekPrioritiesSection } = await import('../src/components/dashboard/CurrentWeekPrioritiesSection.jsx');
const { default: AdvocacyDashboard } = await import('../src/components/advocacy/AdvocacyDashboard.jsx');
const { default: FeatureRolloutPage } = await import('../src/components/admin/FeatureRolloutPage.jsx');
const { default: ExecutivePulsePage } = await import('../src/components/executive-pulse/ExecutivePulsePage.jsx');
const { default: StrategicPlanSection } = await import('../src/components/dashboard/StrategicPlanSection.jsx');
const { default: HuddleFormPage } = await import('../src/components/huddles/HuddleFormPage.jsx');
const { default: HuddleItemPage } = await import('../src/components/huddles/HuddleItemPage.jsx');
const { default: HuddlesPage } = await import('../src/components/huddles/HuddlesPage.jsx');
const { default: LearnPage } = await import('../src/components/learn/LearnPage.jsx');
const { default: LoginPage } = await import('../src/components/auth/LoginPage.jsx');
const { default: EnterprisePriorityPage } = await import('../src/components/priorities/EnterprisePriorityPage.jsx');
const { default: PrioritiesPage } = await import('../src/components/priorities/PrioritiesPage.jsx');
const { default: ProfilePage } = await import('../src/components/profile/ProfilePage.jsx');
const { default: SideNav } = await import('../src/components/layout/SideNav.jsx');
const { default: StucksPage } = await import('../src/components/stucks/StucksPage.jsx');
const { default: TaskViewPage } = await import('../src/components/task-view/TaskViewPage.jsx');
const { default: TopBar } = await import('../src/components/layout/TopBar.jsx');
const { default: WeeklyActionTrackerPage } = await import('../src/components/weekly-tracker/WeeklyActionTrackerPage.jsx');
const { default: WorkplansPage } = await import('../src/components/workplans/WorkplansPage.jsx');
const { users } = await import('../src/data/mockData.js');
const { currentWeeklyReport } = await import('../src/data/weeklyTrackerConfig.js');

const testUser = (id) => users.find((user) => user.id === id);

const blankOperatingData = (overrides = {}) => ({
  huddles: [],
  enterprisePriorities: [],
  queuedTasksByOwner: {},
  stucks: [],
  version: 4,
  weeklyActionItems: [],
  weeklyPriorityEntriesByWeek: {},
  ...overrides,
});

const taskFixture = (overrides = {}) => {
  const owner = testUser(overrides.ownerId || 'u1');
  const createdBy = testUser(overrides.createdById || 'u1');
  return {
    assignments: [
      { profile: owner, role: 'assignee' },
      { profile: createdBy, role: 'assigned_by' },
    ],
    createdBy,
    department: owner.department,
    description: 'Send final Q2 priority draft to ELT',
    due: '2026-06-12',
    id: 'task-fixture-1',
    owner,
    priority: 'Standalone queue',
    source: 'one_off',
    sourceType: 'queued_task',
    status: 'Open',
    strategicPillar: 'Agility & Capability',
    visibility: 'private',
    workplanId: null,
    workplanTitle: null,
    ...overrides,
  };
};

const enterprisePriorityFixture = (overrides = {}) => ({
  company: true,
  id: 'enterprise-change-business',
  keyObjectives: [],
  name: 'Change the Business Priority',
  strategicPillarId: 'agility-capacity',
  ...overrides,
});

const huddleFixture = (overrides = {}) => ({
  agenda: ['Review current signals', 'Discuss stucks and owner follow-up', 'Confirm next commitments'],
  date: '2026-06-09',
  description: 'Operating rhythm for surfacing progress, blockers, and commitments.',
  id: 'daily-ops',
  items: [],
  memberIds: ['u1', 'u8', 'u11'],
  name: 'Daily Ops',
  ownerId: 'u1',
  recurrence: 'Daily',
  when: 'today',
  ...overrides,
});

const stuckFixture = (overrides = {}) => ({
  description: 'Waiting on final lease packet approvals',
  helpFrom: testUser('u2'),
  id: 's1',
  personStuck: testUser('u1'),
  personStuckId: 'u1',
  pinned: false,
  since: '2026-06-09T09:00:00-04:00',
  sourceId: 'task-fixture-1',
  sourceLabel: 'Send final Q2 priority draft to ELT',
  sourceType: 'queued_task',
  status: 'active',
  ...overrides,
});

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const resetDocumentState = () => {
  document.body.removeAttribute('aria-hidden');
  document.body.removeAttribute('style');
  document.body.querySelectorAll('.MuiModal-root, .MuiPopover-root, .MuiPopper-root').forEach((node) => node.remove());
  Array.from(document.body.children).forEach((node) => node.removeAttribute('aria-hidden'));
};

const renderWithProviders = (ui, path = '/', userId = 'u1', operatingData = null) => {
  cleanup();
  resetDocumentState();
  window.localStorage.clear();
  window.localStorage.setItem('hdc_compass_demo_authenticated', 'true');
  window.localStorage.setItem('hdc_compass_demo_user_id', userId);
  window.localStorage.setItem(`hdc_compass_guided_practice_${userId}`, 'complete');
  if (operatingData) {
    window.localStorage.setItem('hdc_compass_operating_data', JSON.stringify(blankOperatingData(operatingData)));
  }
  return {
    user: userEvent.setup({ document: window.document }),
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MemoryRouter initialEntries={[path]}>
          <AuthProvider>
            <ActionFeedbackProvider>
              <FeatureAccessProvider>
                <NotificationsProvider>
                  <OperatingDataProvider>
                    <CalendarEventProvider>
                      {ui}
                    </CalendarEventProvider>
                  </OperatingDataProvider>
                </NotificationsProvider>
              </FeatureAccessProvider>
            </ActionFeedbackProvider>
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>,
    ),
  };
};

const renderLoginFlow = () => {
  cleanup();
  resetDocumentState();
  window.localStorage.clear();
  return {
    user: userEvent.setup({ document: window.document }),
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <LoginPage />
            <LocationProbe />
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>,
    ),
  };
};

describe('clickable user actions', () => {
  afterEach(() => {
    cleanup();
    resetDocumentState();
    window.localStorage.clear();
  });

  it('provides an inline one-off task input in Day-to-Day Tasks', async () => {
    renderWithProviders(<TaskViewPage />);

    expect(await screen.findByRole('textbox', { name: /add a task to my queue/i })).to.exist;
    expect(screen.getByText(/enter to save/i)).to.exist;
    expect(screen.queryByRole('button', { name: /add to queue/i })).to.equal(null);
    expect(screen.getByText(/weekly commitments and their action items live in the weekly tracker/i)).to.exist;
  });

  it('uses the user primary dashboard on demo sign in', async () => {
    const { user } = renderLoginFlow();

    await user.click(await screen.findByText('Dana'));
    expect((await screen.findByTestId('location')).textContent).to.equal('/dashboard/company');

    cleanup();
    const next = renderLoginFlow();
    await next.user.click(await screen.findByText('Michael'));
    expect((await screen.findByTestId('location')).textContent).to.equal('/dashboard/me');
  });

  it('projects only Tammie-owned current-week priorities onto Tammie personal dashboard', async () => {
    const tammie = testUser('u8');
    const parnell = testUser('u11');
    const entries = [
      {
        department: tammie.department,
        due: currentWeeklyReport.weekEnd,
        id: 'tammie-live-priority',
        owner: tammie,
        rank: 1,
        reportId: currentWeeklyReport.id,
        status: 'steady',
        tasks: [],
        title: 'Tammie live Weekly Tracker priority',
      },
      {
        department: parnell.department,
        due: currentWeeklyReport.weekEnd,
        id: 'parnell-live-priority',
        owner: parnell,
        rank: 1,
        reportId: currentWeeklyReport.id,
        status: 'steady',
        tasks: [],
        title: 'Parnell operations priority',
      },
    ];

    renderWithProviders(<CurrentWeekPrioritiesSection entries={entries} user={tammie} />, '/dashboard/me', tammie.id);

    expect(await screen.findByRole('heading', { name: /tammie's weekly priorities/i })).to.exist;
    expect(screen.getByText('Tammie live Weekly Tracker priority')).to.exist;
    expect(screen.queryByText('Parnell operations priority')).to.equal(null);
    expect(screen.queryByText(/operations weekly priorities/i)).to.equal(null);
  });

  it('uses live Weekly Tracker priorities instead of a hard-coded advocacy priority list', async () => {
    const dana = testUser('u1');
    const livePriority = {
      department: dana.department,
      due: currentWeeklyReport.weekEnd,
      id: 'dana-live-priority',
      owner: dana,
      rank: 1,
      reportId: currentWeeklyReport.id,
      status: 'steady',
      tasks: [],
      title: 'Dana live Weekly Tracker priority',
    };

    renderWithProviders(<AdvocacyDashboard />, '/dashboard/me', dana.id, {
      weeklyPriorityEntriesByWeek: {
        [currentWeeklyReport.id]: [livePriority],
      },
    });

    expect(await screen.findByText('Dana live Weekly Tracker priority')).to.exist;
    expect(screen.queryByText(/individual priorities this week/i)).to.equal(null);
    expect(screen.queryByRole('button', { name: /add priority/i })).to.equal(null);
  });

  it('lets Nina create Dana advocacy touch reports with audit labels', async () => {
    const { user } = renderWithProviders(<AdvocacyDashboard />, '/dashboard/me', 'u19');

    expect(await screen.findByText(/signed in as nina: delegated touch-report access/i)).to.exist;
    fireEvent.click(screen.getAllByRole('button', { name: /log touch report/i })[0]);

    fireEvent.change(await screen.findByLabelText(/touch report notes/i), { target: { value: 'Nina logged the post-hearing follow-up.' } });
    fireEvent.change(screen.getByLabelText(/next step/i), { target: { value: 'Send updated talking points to Dana.' } });
    const targetDate = screen.getByLabelText(/target completion date/i);
    fireEvent.change(targetDate, { target: { value: '2026-06-30' } });

    fireEvent.click(screen.getByRole('button', { name: /save touch report/i }));

    expect(await screen.findByText('Nina logged the post-hearing follow-up.')).to.exist;
    expect(screen.getAllByText('Send updated talking points to Dana.').length).to.be.greaterThan(0);
    expect(screen.getAllByText(/created by nina/i).length).to.be.greaterThan(0);
    expect(screen.getAllByText(/last touched jun 23, 2026/i).length).to.be.greaterThan(0);
  });

  it('lets Dana edit her advocacy touch reports directly', async () => {
    renderWithProviders(<AdvocacyDashboard />, '/dashboard/me', 'u1');

    expect(await screen.findByText(/dana can manage her advocacy records/i)).to.exist;
    const logButtons = screen.getAllByRole('button', { name: /log touch report/i });
    expect(logButtons[0].disabled).to.equal(false);
    expect(screen.getAllByRole('button', { name: /edit touch report/i }).length).to.be.greaterThan(0);
  });

  it('orders the side navigation and keeps Data Table admin-only', async () => {
    renderWithProviders(<SideNav open mobileOpen={false} onHuddlesClick={() => {}} onMobileClose={() => {}} />, '/dashboard/company', 'u11');

    const dashboards = await screen.findByText('Dashboards');
    const companyDashboard = await screen.findByText('Company Dashboard');
    const executivePulse = screen.getByText('Executive Pulse');
    const myDashboard = screen.getByText('My Dashboard');
    const enterprisePriorities = screen.getByText('Enterprise Priorities');
    const departmentWorkplans = screen.getByText('Department Workplans');
    const weeklyTracker = screen.getByText('Weekly Tracker');
    const taskView = screen.getByText('Day-to-Day Tasks');

    expect(dashboards.compareDocumentPosition(companyDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(companyDashboard.compareDocumentPosition(executivePulse) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(executivePulse.compareDocumentPosition(myDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(companyDashboard.compareDocumentPosition(myDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(myDashboard.compareDocumentPosition(enterprisePriorities) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(enterprisePriorities.compareDocumentPosition(departmentWorkplans) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(departmentWorkplans.compareDocumentPosition(weeklyTracker) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(weeklyTracker.compareDocumentPosition(taskView) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(screen.queryByText('Notifications')).to.equal(null);
    expect(screen.queryByText('Data Table')).to.equal(null);

    cleanup();
    renderWithProviders(<SideNav open mobileOpen={false} onHuddlesClick={() => {}} onMobileClose={() => {}} />, '/dashboard/company', 'u1');
    expect(await screen.findByText('Data Table')).to.exist;
  });

  it('renders and persists editable Executive Pulse scorecard fields', async () => {
    renderWithProviders(<ExecutivePulsePage />, '/dashboard/executive-pulse', 'u1');

    expect(await screen.findByRole('heading', { name: /^executive pulse$/i })).to.exist;
    fireEvent.click(screen.getByRole('button', { name: /open executive pulse scorecard for robust, viable pipeline/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getAllByLabelText(/^current status$/i)[0], { target: { value: 'TC5 in process; New Holland acquired' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /done/i }));

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_executive_pulse_scorecard'));
      const pipeline = saved.scorecards.find((card) => card.id === 'robust-pipeline');
      expect(pipeline.metrics[0].currentStatus).to.equal('TC5 in process; New Holland acquired');
    });
  });

  it('creates and persists a visible one-off task from Day-to-Day Tasks', async () => {
    const existingTask = taskFixture({ description: 'Existing queue task', id: 'task-existing', queueOrder: 0 });
    const { user } = renderWithProviders(<TaskViewPage />, '/task-view', 'u1', {
      queuedTasksByOwner: { u1: [existingTask] },
    });

    const queueInput = await screen.findByRole('textbox', { name: /add a task to my queue/i });
    await user.type(queueInput, 'Confirm Teams card copy{Enter}');

    const newTask = await screen.findByText('Confirm Teams card copy');
    const existingTaskRow = screen.getByText('Existing queue task');
    expect(existingTaskRow.compareDocumentPosition(newTask) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(queueInput.value).to.equal('');
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const savedTask = saved.queuedTasksByOwner.u1.find((task) => task.description === 'Confirm Teams card copy');
      expect(savedTask.workplanId).to.equal(null);
      expect(savedTask.workplanTitle).to.equal(null);
      expect(savedTask.queueOrder).to.be.greaterThan(saved.queuedTasksByOwner.u1.find((task) => task.id === existingTask.id).queueOrder);
    });
  });

  it('flies a completed queued task out and persists its completion timestamp', async () => {
    const queuedTask = taskFixture();
    const { user } = renderWithProviders(<TaskViewPage />, '/task-view', 'u1', {
      queuedTasksByOwner: { u1: [queuedTask] },
    });

    await user.click(await screen.findByRole('button', { name: /mark task complete: send final q2 priority draft to elt/i }));

    await waitFor(() => {
      expect(screen.queryByText(/send final q2 priority draft to elt/i)).to.equal(null);
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const savedTask = saved.queuedTasksByOwner.u1.find((task) => task.id === queuedTask.id);
      expect(savedTask.status).to.equal('Complete');
      expect(savedTask.completedAt).to.be.a('string').and.not.equal('');
    });
  });

  it('pins queued tasks to the top and persists manual task ordering', async () => {
    const firstTask = taskFixture({ description: 'First queue task', id: 'task-first', queueOrder: 0 });
    const secondTask = taskFixture({ description: 'Second queue task', id: 'task-second', queueOrder: 1 });
    const { user } = renderWithProviders(<TaskViewPage />, '/task-view', 'u1', {
      queuedTasksByOwner: { u1: [firstTask, secondTask] },
    });

    await user.click(await screen.findByRole('button', { name: /pin task: second queue task/i }));
    const pinnedTask = await screen.findByText('Second queue task');
    const firstVisibleTask = screen.getByText('First queue task');
    expect(pinnedTask.compareDocumentPosition(firstVisibleTask) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);

    await user.click(screen.getByRole('button', { name: /unpin task: second queue task/i }));
    const reorderHandle = screen.getByRole('button', { name: /reorder task: first queue task/i });
    reorderHandle.focus();
    fireEvent.keyDown(reorderHandle, { key: 'ArrowDown' });

    await waitFor(() => {
      const secondVisibleTask = screen.getByText('Second queue task');
      const movedTask = screen.getByText('First queue task');
      expect(secondVisibleTask.compareDocumentPosition(movedTask) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const tasks = saved.queuedTasksByOwner.u1;
      expect(tasks.find((task) => task.id === 'task-second').pinned).to.equal(false);
      expect(tasks.find((task) => task.id === 'task-second').queueOrder).to.be.lessThan(tasks.find((task) => task.id === 'task-first').queueOrder);
    });
  });

  it('opens and saves the task assignment workflow from a task row', async () => {
    const queuedTask = taskFixture();
    const { user } = renderWithProviders(<TaskViewPage />, '/task-view', 'u1', {
      queuedTasksByOwner: { u1: [queuedTask] },
    });

    await user.click(await screen.findByRole('button', { name: /open assignment workflow for task send final q2 priority draft to elt/i }));

    expect(await screen.findByRole('heading', { name: /task assignment workflow/i })).to.exist;
    expect(screen.getByLabelText(/assign to/i)).to.exist;

    await user.click(screen.getByRole('button', { name: /save assignment/i }));

    expect(await screen.findByText(/teams task card queued for dana hanchin/i)).to.exist;
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).to.equal(null);
    });
  });

  it('creates a weekly priority and Action Item from Weekly Tracker', async () => {
    const enterprisePriority = enterprisePriorityFixture();
    const { user } = renderWithProviders(<WeeklyActionTrackerPage />, '/weekly-tracker', 'u11', {
      enterprisePriorities: [enterprisePriority],
    });

    await user.click(await screen.findByRole('button', { name: /set my weekly priority/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /set weekly priority/i })).to.exist;

    fireEvent.change(within(dialog).getByRole('textbox', { name: /^weekly priority$/i }), { target: { value: 'Publish operations support summary' } });
    await user.click(within(dialog).getByLabelText(/enterprise priority/i));
    await user.click(await screen.findByRole('option', { name: /change the business priority/i }));
    fireEvent.change(within(dialog).getByRole('textbox', { name: /^action item$/i }), { target: { value: 'Send summary to Tammie' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /save weekly priority/i }));

    expect(await screen.findByText(/publish operations support summary/i)).to.exist;
    expect(await screen.findByText(/send summary to tammie/i)).to.exist;
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).to.equal(null);
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const savedPriority = saved.weeklyPriorityEntriesByWeek[currentWeeklyReport.id]
        .find((entry) => entry.title === 'Publish operations support summary');
      expect(savedPriority.tasks.some((task) => task.title === 'Send summary to Tammie')).to.equal(true);
      expect(savedPriority.priorityId).to.equal(enterprisePriority.id);
      expect(savedPriority.sourceType).to.equal('weekly_priority_entry');
      expect(window.localStorage.getItem('hdc_compass_weekly_tracker_entries')).to.equal(null);
    });
  });

  it('places the logged-in user first and provides at least three weekly priority cards', async () => {
    const { user } = renderWithProviders(<WeeklyActionTrackerPage />, '/weekly-tracker', 'u18');
    const participantRows = await screen.findAllByTestId(/weekly-participant-/);
    const gigiPriorityCards = screen.getAllByRole('button', { name: /set weekly priority \d for gigi lopez/i });

    expect(participantRows[0].getAttribute('data-testid')).to.equal('weekly-participant-u18');
    expect(gigiPriorityCards.length).to.equal(3);

    await user.click(gigiPriorityCards[0]);
    expect(await screen.findByRole('heading', { name: /set weekly priority/i })).to.exist;
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).to.equal(null));
  });

  it('opens weekly priority detail by clicking the priority card', async () => {
    const sam = testUser('u2');
    renderWithProviders(<WeeklyActionTrackerPage />, '/weekly-tracker', 'u2', {
      weeklyPriorityEntriesByWeek: {
        [currentWeeklyReport.id]: [{
          department: sam.department,
          due: currentWeeklyReport.weekEnd,
          id: 'sam-vendor-onboarding',
          owner: sam,
          rank: 1,
          reportId: currentWeeklyReport.id,
          status: 'steady',
          tasks: [],
          title: 'Review vendor onboarding',
        }],
      },
    });

    fireEvent.click(await screen.findByRole('button', { name: /open weekly priority detail for review vendor onboarding/i }));

    expect(await screen.findByRole('heading', { name: /weekly priority detail/i })).to.exist;
    expect(screen.queryByText(/^Detail$/i)).to.equal(null);
  });

  it('requires enterprise or workplan alignment before saving a weekly priority', async () => {
    const enterprisePriority = enterprisePriorityFixture();
    const { user } = renderWithProviders(<WeeklyActionTrackerPage />, '/weekly-tracker', 'u11', {
      enterprisePriorities: [enterprisePriority],
    });

    await user.click(await screen.findByRole('button', { name: /set my weekly priority/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: /^weekly priority$/i }), { target: { value: 'Coordinate launch readiness' } });

    const saveButton = within(dialog).getByRole('button', { name: /save weekly priority/i });
    expect(saveButton.disabled).to.equal(true);

    await user.click(within(dialog).getByLabelText(/enterprise priority/i));
    await user.click(await screen.findByRole('option', { name: /change the business priority/i }));
    fireEvent.click(within(dialog).getByRole('button', { name: /save weekly priority/i }));

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const savedPriority = saved.weeklyPriorityEntriesByWeek[currentWeeklyReport.id]
        .find((entry) => entry.title === 'Coordinate launch readiness');
      expect(savedPriority.alignmentType).to.equal('enterprise');
      expect(savedPriority.priorityId).to.equal(enterprisePriority.id);
      expect(savedPriority.workplanId).to.equal(null);
    });
  });

  it('shows an empty workplan state when no department workplans exist yet', async () => {
    renderWithProviders(<WorkplansPage />, '/workplans', 'u2');

    expect(await screen.findByRole('heading', { name: /^department workplans$/i })).to.exist;
    expect(await screen.findByText(/no department workplans in this view/i)).to.exist;
  });

  it('creates an annual department workplan with objective-level alignment', async () => {
    const { user } = renderWithProviders(<WorkplansPage />, '/workplans', 'u2');

    await user.click(await screen.findByRole('button', { name: /add department workplan/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByDisplayValue('2026 FINANCE WORKPLAN')).to.exist;
    expect(within(dialog).getByDisplayValue('Sam Jordan')).to.exist;
    fireEvent.change(within(dialog).getByRole('textbox', { name: /department objective/i }), { target: { value: 'Reduce accounts receivable' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /save department workplan/i }));

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const workplan = saved.departmentWorkplans.find((item) => item.department === 'Finance');
      expect(workplan.title).to.equal('2026 FINANCE WORKPLAN');
      expect(workplan.lead.id).to.equal('u2');
      expect(workplan.objectives[0].title).to.equal('Reduce accounts receivable');
      expect(workplan.objectives[0].strategicPillarId).to.equal('care-connection');
      expect(workplan.priorityLinks).to.equal(undefined);
    });
  });

  it('links a weekly priority to a validated Department Objective and Enterprise Priority', async () => {
    const financePriority = {
      company: true,
      id: 'enterprise-financial-resilience',
      keyObjectives: [],
      name: 'Financial Resilience',
      strategicPillarId: 'sustainable-growth',
    };
    const financeWorkplan = {
      department: 'Finance',
      id: 'finance-workplan',
      lead: testUser('u2'),
      objectives: [{
        description: '',
        due: '2026-12-31',
        enterprisePriorityId: financePriority.id,
        id: 'ar-objective',
        owner: testUser('u9'),
        ownerId: 'u9',
        progress: 20,
        status: 'Alert',
        strategicPillarId: 'sustainable-growth',
        title: 'Reduce accounts receivable',
      }],
      ownerIds: ['u2'],
      title: '2026 FINANCE WORKPLAN',
      year: '2026',
    };
    const { user } = renderWithProviders(<WeeklyActionTrackerPage />, '/weekly-tracker', 'u2', {
      departmentWorkplans: [financeWorkplan],
      enterprisePriorities: [financePriority],
    });

    await user.click(await screen.findByRole('button', { name: /set weekly priority 1 for sam jordan/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: /^weekly priority$/i }), { target: { value: 'Resolve aging receivables' } });
    await user.click(within(dialog).getByLabelText(/department objective/i));
    await user.click(await screen.findByRole('option', { name: /finance - reduce accounts receivable/i }));
    await user.click(within(dialog).getByLabelText(/enterprise priority/i));
    await user.click(await screen.findByRole('option', { name: /financial resilience/i }));
    fireEvent.click(within(dialog).getByRole('button', { name: /save weekly priority/i }));

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const weekly = saved.weeklyPriorityEntriesByWeek[currentWeeklyReport.id]
        .find((entry) => entry.title === 'Resolve aging receivables');
      expect(weekly.objectiveId).to.equal('ar-objective');
      expect(weekly.workplanId).to.equal('finance-workplan');
      expect(weekly.priorityId).to.equal('enterprise-financial-resilience');
      expect(weekly.strategicPillarId).to.equal('sustainable-growth');
    });
  });

  it('issues a stuck directly from an owned Weekly Tracker Action Item', async () => {
    const { user } = renderWithProviders(<WeeklyActionTrackerPage />, '/weekly-tracker', 'u11', {
      enterprisePriorities: [enterprisePriorityFixture()],
    });
    await user.click(await screen.findByRole('button', { name: /set my weekly priority/i }));
    const priorityDialog = await screen.findByRole('dialog');
    fireEvent.change(within(priorityDialog).getByRole('textbox', { name: /^weekly priority$/i }), { target: { value: 'Prepare weekly decision packet' } });
    await user.click(within(priorityDialog).getByLabelText(/enterprise priority/i));
    await user.click(await screen.findByRole('option', { name: /change the business priority/i }));
    fireEvent.change(within(priorityDialog).getByRole('textbox', { name: /^action item$/i }), { target: { value: 'Draft decision packet' } });
    fireEvent.click(within(priorityDialog).getByRole('button', { name: /save weekly priority/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).to.equal(null);
    });
    fireEvent.click(await screen.findByRole('button', { name: /issue a stuck for action item draft decision packet/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/stuck description/i), { target: { value: 'Weekly Action Item needs a decision' } });
    await user.click(within(dialog).getByLabelText(/need help from/i));
    await user.click(await screen.findByRole('option', { name: /sam jordan - finance/i }));
    await user.click(within(dialog).getByRole('button', { name: /^issue stuck$/i }));

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const stuck = saved.stucks.find((item) => item.description === 'Weekly Action Item needs a decision');
      expect(stuck.sourceType).to.equal('weekly_action_item');
    });
  });

  it('opens the priority drawer from Add Priority', async () => {
    const { user } = renderWithProviders(<PrioritiesPage />);

    await user.click(await screen.findByRole('button', { name: /add Enterprise Priority/i }));

    expect(await screen.findByText(/edit Enterprise Priority/i)).to.exist;
    expect(screen.getByLabelText(/priority name/i)).to.exist;
    expect(screen.getByLabelText(/key objective/i)).to.exist;
    expect(screen.getByLabelText(/objective owner/i)).to.exist;
    expect(screen.getByLabelText(/kpi \/ success measure/i)).to.exist;
    expect(screen.getByLabelText(/end target \/ desired result/i)).to.exist;
    expect(screen.queryByLabelText(/^owner$/i)).to.equal(null);
  });

  it('creates and persists an Enterprise Priority from the priority drawer', async () => {
    const { user } = renderWithProviders(<PrioritiesPage />);

    await user.click(await screen.findByRole('button', { name: /add Enterprise Priority/i }));
    fireEvent.change(screen.getByLabelText(/Enterprise Priority name/i), { target: { value: 'Resident service readiness' } });
    fireEvent.change(screen.getByLabelText(/key objective/i), { target: { value: 'Publish service standards' } });
    await user.click(screen.getByLabelText(/objective owner/i));
    await user.click(await screen.findByRole('option', { name: /dana hanchin/i }));
    fireEvent.change(screen.getByLabelText(/kpi \/ success measure/i), { target: { value: 'Standards approved' } });
    fireEvent.change(screen.getByLabelText(/end target \/ desired result/i), { target: { value: 'Approved by June 30' } });
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByText('Resident service readiness')).to.exist;
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const priority = saved.enterprisePriorities.find((item) => item.name === 'Resident service readiness');
      expect(priority.keyObjectives[0].owner.id).to.equal('u1');
      expect(priority.keyObjectives[0].kpis[0].target).to.equal('Approved by June 30');
    });
  });

  it('creates an Enterprise Priority from owned Key Objectives and rolls up its signal', async () => {
    const { user } = renderWithProviders(<StrategicPlanSection />, '/metrics', 'u1');

    await user.click((await screen.findAllByRole('button', { name: /open .* q2 2026 roadmap/i }))[0]);
    await user.click(await screen.findByRole('button', { name: /add Enterprise Priority/i }));

    const dialog = await screen.findByRole('dialog', { name: /add Enterprise Priority/i });
    fireEvent.change(within(dialog).getByLabelText(/priority name/i), { target: { value: 'Resident service readiness' } });
    fireEvent.change(within(dialog).getByLabelText(/key objective/i), { target: { value: 'Publish service standards' } });
    fireEvent.change(within(dialog).getByLabelText(/kpi \/ success measure/i), { target: { value: 'Standards approved' } });
    fireEvent.change(within(dialog).getByLabelText(/end target \/ desired result/i), { target: { value: 'Approved by June 30' } });

    expect(within(dialog).queryByLabelText(/^owner$/i)).to.equal(null);
    expect(within(dialog).queryByLabelText(/priority health/i)).to.equal(null);
    await user.click(within(dialog).getByRole('button', { name: /add key objective/i }));
    expect(within(dialog).getAllByRole('textbox', { name: /key objective/i })).to.have.length(2);
  });

  it('opens the task-linked stuck creation modal', async () => {
    const queuedTask = taskFixture();
    const { user } = renderWithProviders(<StucksPage />, '/stucks', 'u1', {
      queuedTasksByOwner: { u1: [queuedTask] },
    });

    await user.click(await screen.findByRole('button', { name: /issue a stuck/i }));

    expect(await screen.findByRole('heading', { name: /issue a stuck/i })).to.exist;
    expect(screen.getByLabelText(/task i am stuck on/i)).to.exist;
    expect(screen.getByLabelText(/stuck description/i)).to.exist;
    expect(screen.getByLabelText(/person stuck/i)).to.exist;
  });

  it('issues and persists a stuck against the current user task', async () => {
    const queuedTask = taskFixture();
    const { user } = renderWithProviders(<StucksPage />, '/stucks', 'u1', {
      queuedTasksByOwner: { u1: [queuedTask] },
    });

    await user.click(await screen.findByRole('button', { name: /issue a stuck/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByLabelText(/task i am stuck on/i));
    await user.click(await screen.findByRole('option', { name: /send final q2 priority draft to elt - day-to-day tasks/i }));
    await user.type(within(dialog).getByLabelText(/stuck description/i), 'Need a decision before this can move');
    await user.click(within(dialog).getByLabelText(/need help from/i));
    await user.click(await screen.findByRole('option', { name: /sam jordan - finance/i }));
    await user.click(within(dialog).getByRole('button', { name: /^issue stuck$/i }));

    expect(await screen.findByText('Need a decision before this can move')).to.exist;
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const stuck = saved.stucks.find((item) => item.description === 'Need a decision before this can move');
      expect(stuck.personStuckId).to.equal('u1');
      expect(stuck.sourceId).to.equal('task-fixture-1');
      expect(stuck.sourceType).to.equal('queued_task');
    });
  });

  it('persists stuck row actions', async () => {
    const { user } = renderWithProviders(<StucksPage />, '/stucks', 'u1', {
      stucks: [stuckFixture()],
    });

    const pinButton = await screen.findByRole('button', { name: /pin stuck: waiting on final lease packet approvals/i });
    await user.click(pinButton);

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      expect(saved.stucks.find((stuck) => stuck.id === 's1').pinned).to.equal(true);
    });
  });

  it('routes every top navigation dropdown item to a destination', async () => {
    const { user } = renderWithProviders(
      <>
        <TopBar onMenuClick={() => {}} />
        <LocationProbe />
      </>,
      '/task-view',
    );

    const destinations = [
      ['Strategy', 'Company Dashboard', '/dashboard/company'],
      ['Strategy', 'Executive Pulse', '/dashboard/executive-pulse'],
      ['Strategy', 'Enterprise Priorities', '/priorities'],
      ['Strategy', 'Weekly Tracker', '/weekly-tracker'],
      ['Culture', 'Huddles', '/huddles'],
      ['Culture', 'Stucks', '/stucks'],
      ['Culture', 'Team Health', '/culture/team-health'],
      ['Reports', 'Data Table', '/metrics/table'],
      ['Reports', 'Executive Summary', '/reports/executive-summary'],
      ['Reports', 'Exports', '/reports/exports'],
      ['Administration', 'Users', '/admin/users'],
      ['Administration', 'Teams', '/admin/teams'],
      ['Administration', 'Permissions', '/admin/permissions'],
      ['Administration', 'Feature Rollout', '/admin/features'],
    ];

    for (const [menu, item, path] of destinations) {
      await user.click(await screen.findByRole('button', { name: new RegExp(menu, 'i') }));
      await user.click(await screen.findByRole('menuitem', { name: new RegExp(item, 'i') }));
      expect((await screen.findByTestId('location')).textContent).to.equal(path);
    }
  });

  it('pins quarterly Enterprise Priority health on the company dashboard', async () => {
    renderWithProviders(
      <CompanyDashboardOverview
        calendarEvents={[]}
        calendarProps={{
          onApprove: () => {},
          onCreateCalendarEvent: () => {},
          onDecline: () => {},
          onSendToOrg: () => {},
          onUpdateCalendarEvent: () => {},
        }}
        isAdmin
        onMetricClick={() => {}}
      />,
      '/dashboard/company',
    );

    expect(await screen.findByText(/executive quarter pulse/i)).to.exist;
    expect(await screen.findByRole('heading', { name: /quarterly Enterprise Priority health/i })).to.exist;
    expect(screen.getByLabelText(/team filter/i)).to.exist;
    expect(screen.getByText(/0\/0 q2 2026 Enterprise Priorities/i)).to.exist;
    expect(screen.getByText(/no quarterly Enterprise Priorities have been defined yet/i)).to.exist;
    expect(screen.queryByRole('button', { name: /open Enterprise Priority detail/i })).to.equal(null);
    expect(screen.queryByText(/critical numbers/i)).to.equal(null);
  });

  it('reads company dashboard priorities from the canonical operating store', async () => {
    const dana = testUser('u1');
    const priority = {
      children: [],
      company: true,
      description: 'Visible anywhere Enterprise Priorities are read.',
      id: 'canonical-priority',
      keyObjectives: [{
        department: dana.department,
        id: 'canonical-objective',
        kpis: [{ id: 'canonical-kpi', progress: 25, status: 'Steady', target: 'Complete', title: 'Readiness' }],
        owner: dana,
        status: 'Steady',
        title: 'Confirm readiness',
      }],
      name: 'Canonical Enterprise Priority',
      period: 'Q2 2026',
      roadmapStatus: 'Steady',
      strategicPillar: 'Care & Connection',
      strategicPillarId: 'care-connection',
    };

    renderWithProviders(
      <CompanyDashboardOverview
        calendarEvents={[]}
        calendarProps={{
          onApprove: () => {},
          onCreateCalendarEvent: () => {},
          onDecline: () => {},
          onSendToOrg: () => {},
          onUpdateCalendarEvent: () => {},
        }}
        isAdmin
      />,
      '/dashboard/company',
      'u1',
      { enterprisePriorities: [priority] },
    );

    expect(await screen.findByText('Canonical Enterprise Priority')).to.exist;
    expect(screen.getByText(/1\/1 q2 2026 Enterprise Priorities/i)).to.exist;
  });

  it('shows the blank company priority state without hiding pillar coverage', async () => {
    renderWithProviders(
      <>
        <CompanyDashboardOverview
          calendarEvents={[]}
          calendarProps={{
            onApprove: () => {},
            onCreateCalendarEvent: () => {},
            onDecline: () => {},
            onSendToOrg: () => {},
            onUpdateCalendarEvent: () => {},
          }}
          isAdmin
        />
        <LocationProbe />
      </>,
      '/dashboard/company',
    );

    expect(await screen.findByText(/no quarterly Enterprise Priorities have been defined yet/i)).to.exist;
    expect((await screen.findAllByRole('button', { name: /open pillar detail/i })).length).to.equal(5);
    expect((await screen.findAllByRole('img', { name: /0 aligned Enterprise Priorities, no data/i })).length).to.equal(5);
    expect(screen.queryByText(/prioritize resident-centered service delivery/i)).to.equal(null);
  });

  it('shows an empty Enterprise Priority register when quarterly priorities do not exist yet', async () => {
    renderWithProviders(
      <CompanyDashboardOverview
        calendarEvents={[]}
        calendarProps={{
          onApprove: () => {},
          onCreateCalendarEvent: () => {},
          onDecline: () => {},
          onSendToOrg: () => {},
          onUpdateCalendarEvent: () => {},
        }}
        isAdmin
      />,
      '/dashboard/company',
    );

    expect(await screen.findByText(/no quarterly Enterprise Priorities have been defined yet/i)).to.exist;
    expect(screen.queryByRole('button', { name: /engage teammates about objective/i })).to.equal(null);
  });

  it('opens strategic pillar detail from a pillar coverage card', async () => {
    const { user } = renderWithProviders(
      <CompanyDashboardOverview
        calendarEvents={[]}
        calendarProps={{
          onApprove: () => {},
          onCreateCalendarEvent: () => {},
          onDecline: () => {},
          onSendToOrg: () => {},
          onUpdateCalendarEvent: () => {},
        }}
        isAdmin
      />,
      '/dashboard/company',
    );

    const pillarCards = await screen.findAllByRole('button', { name: /open pillar detail/i });
    await user.click(pillarCards[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByRole('heading', { name: /care and connection/i })).to.have.length.greaterThan(0);
    expect(within(dialog).getByRole('heading', { name: /success metrics/i })).to.exist;
    expect(within(dialog).getByText(/resident satisfaction/i)).to.exist;
    expect(within(dialog).getByText(/no current Enterprise Priorities are aligned to this pillar yet/i)).to.exist;
  });

  it('shows a not-found state for an unavailable Enterprise Priority page', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/dashboard/company/priorities/:priorityId" element={<EnterprisePriorityPage />} />
      </Routes>,
      '/dashboard/company/priorities/q2-operational-efficiency',
    );

    expect(await screen.findByRole('heading', { name: /priority not found/i })).to.exist;
  });

  it('opens the weekly priority workflow from the quick add menu', async () => {
    const { user } = renderWithProviders(
      <>
        <TopBar onMenuClick={() => {}} />
        <LocationProbe />
        <Routes>
          <Route path="/weekly-tracker" element={<WeeklyActionTrackerPage />} />
        </Routes>
      </>,
      '/dashboard/me',
      'u11',
    );

    await user.click(await screen.findByRole('button', { name: /open quick add menu/i }));
    await user.click(await screen.findByRole('menuitem', { name: /new weekly priority/i }));

    expect((await screen.findByTestId('location')).textContent).to.equal('/weekly-tracker');
    expect(await screen.findByRole('heading', { name: /set weekly priority/i })).to.exist;
  });

  it('renders the Learn dictionary with programmatic and plain-English definitions', async () => {
    const { user } = renderWithProviders(<LearnPage />, '/learn');

    expect(await screen.findByRole('heading', { name: /^learn$/i })).to.exist;
    await user.click(screen.getByRole('button', { name: /dictionary/i }));
    expect(screen.getByRole('heading', { name: /compass dictionary/i })).to.exist;
    expect(screen.getByRole('searchbox', { name: /search the dictionary/i })).to.exist;
    expect(screen.getByText(/^programmatic distinction$/i)).to.exist;
    expect(screen.getByText(/^plain english$/i)).to.exist;
    expect(screen.getByText(/application shell/i)).to.exist;
  });

  it('selects a dictionary term from search without opening a dropdown', async () => {
    const { user } = renderWithProviders(<LearnPage />, '/learn');
    await user.click(await screen.findByRole('button', { name: /dictionary/i }));
    const search = await screen.findByRole('searchbox', { name: /search the dictionary/i });

    await user.click(search);
    await user.type(search, 'signal');

    expect(await screen.findByRole('heading', { name: /^signal$/i })).to.exist;
    expect(screen.queryByRole('listbox')).to.equal(null);
    expect(screen.getByText(/company dashboard signal/i)).to.exist;
    expect(screen.getByText(/same word, different source and use/i)).to.exist;
  });

  it('routes huddle stucks button to the stucks page', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/huddles/:id" element={<HuddlesPage />} />
        <Route path="/stucks" element={<StucksPage />} />
      </Routes>,
      '/huddles/daily-ops',
      'u1',
      { huddles: [huddleFixture()] },
    );

    await user.click(await screen.findByRole('button', { name: /^stucks$/i }));

    expect(await screen.findByRole('heading', { name: /manage stucks/i })).to.exist;
  });

  it('lets huddle members add agenda items inline', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/huddles/:id" element={<HuddlesPage />} />
      </Routes>,
      '/huddles/daily-ops',
      'u1',
      { huddles: [huddleFixture()] },
    );

    fireEvent.change(await screen.findByLabelText(/add agenda item/i), { target: { value: 'Confirm advocacy follow-up owner' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(await screen.findByText('Confirm advocacy follow-up owner')).to.exist;
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const huddle = saved.huddles.find((item) => item.id === 'daily-ops');
      expect(huddle.items.some((item) => item.title === 'Confirm advocacy follow-up owner' && item.createdBy.id === 'u1')).to.equal(true);
    });
  });

  it('lets admins toggle component access and see property governance controls', async () => {
    renderWithProviders(<FeatureRolloutPage />, '/admin/features', 'u0');

    expect(await screen.findByRole('heading', { name: /rollout controls/i })).to.exist;
    expect(screen.getByRole('heading', { name: /property governance assignments/i })).to.exist;

    fireEvent.click(screen.getByRole('checkbox', { name: /disable stuck actions for dana hanchin/i }));

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_feature_rollout'));
      expect(saved.u1.stuckActions).to.equal(false);
    });
  });

  it('schedules a huddle with selected members', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/huddles/new" element={<HuddleFormPage />} />
        <Route path="/huddles/:id" element={<HuddlesPage />} />
      </Routes>,
      '/huddles/new',
    );

    await user.type(await screen.findByLabelText(/huddle name/i), 'Launch Readiness Huddle');
    await user.click(screen.getByRole('button', { name: /save huddle/i }));

    expect(await screen.findByText('Launch Readiness Huddle')).to.exist;
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      expect(saved.huddles.some((huddle) => huddle.name === 'Launch Readiness Huddle' && huddle.memberIds.includes('u1'))).to.equal(true);
    });
  });

  it('adds and persists a huddle item', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/huddles/:id/items/new" element={<HuddleItemPage />} />
        <Route path="/huddles/:id" element={<HuddlesPage />} />
      </Routes>,
      '/huddles/daily-ops/items/new',
      'u1',
      { huddles: [huddleFixture()] },
    );

    await user.type(await screen.findByLabelText(/item title/i), 'Confirm owner follow-up');
    await user.click(screen.getByRole('button', { name: /add item/i }));

    expect(await screen.findByText('Confirm owner follow-up')).to.exist;
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const huddle = saved.huddles.find((item) => item.id === 'daily-ops');
      expect(huddle.items.some((item) => item.title === 'Confirm owner follow-up')).to.equal(true);
    });
  });

  it('shows an unavailable alert when joining a huddle without a Teams meeting link', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/huddles/:id" element={<HuddlesPage />} />
      </Routes>,
      '/huddles/daily-ops',
      'u1',
      { huddles: [huddleFixture()] },
    );

    await user.click(await screen.findByRole('button', { name: /join meeting/i }));

    expect(await screen.findByText(/action is unavailable because the teams meeting link has not been added in huddle settings/i)).to.exist;
  });

  it('saves profile edits into the rendered profile header', async () => {
    const { user } = renderWithProviders(<ProfilePage />);

    const fullName = await screen.findByLabelText(/full name/i);
    await user.clear(fullName);
    await user.type(fullName, 'Dana Hanchin Test');
    await user.click(screen.getByRole('button', { name: /save profile/i }));

    expect(await screen.findByRole('heading', { name: /dana hanchin test/i })).to.exist;
  });

  it('reset profile restores the seeded user name', async () => {
    const { user } = renderWithProviders(<ProfilePage />);

    const fullName = await screen.findByLabelText(/full name/i);
    await user.clear(fullName);
    await user.type(fullName, 'Dana Hanchin Test');
    await user.click(screen.getByRole('button', { name: /save profile/i }));
    await user.click(screen.getByRole('button', { name: /reset to seed/i }));

    await waitFor(() => {
      expect(within(document.body).getByRole('heading', { name: /^dana hanchin$/i })).to.exist;
    });
  });
});
