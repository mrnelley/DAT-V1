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
const { FeatureAccessProvider } = await import('../src/context/FeatureAccessContext.jsx');
const { NotificationsProvider } = await import('../src/context/NotificationsContext.jsx');
const { OperatingDataProvider } = await import('../src/context/OperatingDataContext.jsx');
const { default: theme } = await import('../src/theme/index.js');
const { default: CompanyDashboardOverview } = await import('../src/components/dashboard/CompanyDashboardOverview.jsx');
const { default: HuddleFormPage } = await import('../src/components/huddles/HuddleFormPage.jsx');
const { default: HuddleItemPage } = await import('../src/components/huddles/HuddleItemPage.jsx');
const { default: HuddlesPage } = await import('../src/components/huddles/HuddlesPage.jsx');
const { default: LearnPage } = await import('../src/components/learn/LearnPage.jsx');
const { default: LoginPage } = await import('../src/components/auth/LoginPage.jsx');
const { default: OperationalPriorityPage } = await import('../src/components/priorities/OperationalPriorityPage.jsx');
const { default: PrioritiesPage } = await import('../src/components/priorities/PrioritiesPage.jsx');
const { default: ProfilePage } = await import('../src/components/profile/ProfilePage.jsx');
const { default: SideNav } = await import('../src/components/layout/SideNav.jsx');
const { default: StucksPage } = await import('../src/components/stucks/StucksPage.jsx');
const { default: TaskViewPage } = await import('../src/components/task-view/TaskViewPage.jsx');
const { default: TopBar } = await import('../src/components/layout/TopBar.jsx');
const { default: WeeklyActionTrackerPage } = await import('../src/components/weekly-tracker/WeeklyActionTrackerPage.jsx');

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderWithProviders = (ui, path = '/', userId = 'u1') => {
  cleanup();
  window.localStorage.clear();
  window.localStorage.setItem('hdc_compass_demo_authenticated', 'true');
  window.localStorage.setItem('hdc_compass_demo_user_id', userId);
  window.localStorage.setItem(`hdc_compass_guided_practice_${userId}`, 'complete');
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
                    {ui}
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
    window.localStorage.clear();
  });

  it('opens the one-off task dialog from Task View', async () => {
    const { user } = renderWithProviders(<TaskViewPage />);

    await user.click(await screen.findByRole('button', { name: /add to queue/i }));

    expect(screen.getByRole('dialog')).to.exist;
    expect(screen.getByRole('heading', { name: /add task to queue/i })).to.exist;
    expect(screen.getByText(/weekly commitments and their action items live in the weekly tracker/i)).to.exist;
    expect(screen.getByText(/advanced visibility/i)).to.exist;
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

  it('orders the side navigation and keeps Data Table admin-only', async () => {
    renderWithProviders(<SideNav open mobileOpen={false} onHuddlesClick={() => {}} onMobileClose={() => {}} />, '/dashboard/company', 'u11');

    const dashboards = await screen.findByText('Dashboards');
    const companyDashboard = await screen.findByText('Company Dashboard');
    const myDashboard = screen.getByText('My Dashboard');
    const annualInitiatives = screen.getByText('Annual Initiatives');
    const operationalPriorities = screen.getByText('Operational Priorities');
    const weeklyTracker = screen.getByText('Weekly Tracker');
    const taskView = screen.getByText('Task View');

    expect(dashboards.compareDocumentPosition(companyDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(companyDashboard.compareDocumentPosition(myDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(myDashboard.compareDocumentPosition(annualInitiatives) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(annualInitiatives.compareDocumentPosition(operationalPriorities) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(operationalPriorities.compareDocumentPosition(weeklyTracker) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(weeklyTracker.compareDocumentPosition(taskView) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(screen.queryByText('Notifications')).to.equal(null);
    expect(screen.queryByText('Data Table')).to.equal(null);

    cleanup();
    renderWithProviders(<SideNav open mobileOpen={false} onHuddlesClick={() => {}} onMobileClose={() => {}} />, '/dashboard/company', 'u1');
    expect(await screen.findByText('Data Table')).to.exist;
  });

  it('creates and persists a visible one-off task from Task View', async () => {
    const { user } = renderWithProviders(<TaskViewPage />);

    await user.click(await screen.findByRole('button', { name: /add to queue/i }));
    await user.type(screen.getByLabelText(/^task$/i), 'Confirm Teams card copy');
    await user.click(screen.getByLabelText(/department workplan/i));
    await user.click(await screen.findByRole('option', { name: /finance - pm fee/i }));
    await user.click(screen.getByRole('button', { name: /add task to queue/i }));

    expect(await screen.findByText('Confirm Teams card copy')).to.exist;
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).to.equal(null);
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const savedTask = saved.queuedTasksByOwner.u1.find((task) => task.description === 'Confirm Teams card copy');
      expect(savedTask.workplanId).to.equal('dw-fin-pm-fee');
      expect(savedTask.workplanTitle).to.equal('PM Fee');
    });
  });

  it('opens and saves the task assignment workflow from a task row', async () => {
    const { user } = renderWithProviders(<TaskViewPage />);

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
    const { user } = renderWithProviders(<WeeklyActionTrackerPage />, '/weekly-tracker', 'u11');

    await user.click(await screen.findByRole('button', { name: /set my weekly priority/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /set weekly priority/i })).to.exist;

    fireEvent.change(within(dialog).getByRole('textbox', { name: /^weekly priority$/i }), { target: { value: 'Publish operations support summary' } });
    fireEvent.change(within(dialog).getByRole('textbox', { name: /^action item$/i }), { target: { value: 'Send summary to Tammie' } });
    await user.click(within(dialog).getByRole('button', { name: /save weekly priority/i }));

    expect(await screen.findByText(/publish operations support summary/i)).to.exist;
    expect(await screen.findByText(/send summary to tammie/i)).to.exist;
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).to.equal(null);
      const entries = JSON.parse(window.localStorage.getItem('hdc_compass_weekly_tracker_entries'));
      const savedPriority = Object.values(entries).flat().find((entry) => entry.title === 'Publish operations support summary');
      expect(savedPriority.tasks.some((task) => task.title === 'Send summary to Tammie')).to.equal(true);
    });
  });

  it('allows a weekly priority to align to both an enterprise priority and department workplan', async () => {
    const { user } = renderWithProviders(<WeeklyActionTrackerPage />, '/weekly-tracker', 'u11');

    await user.click(await screen.findByRole('button', { name: /set my weekly priority/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: /^weekly priority$/i }), { target: { value: 'Coordinate launch readiness' } });
    await user.click(within(dialog).getByLabelText(/enterprise priority/i));
    await user.click(await screen.findByRole('option', { name: /^enterprise revenue$/i }));
    await user.click(within(dialog).getByLabelText(/department workplan/i));
    await user.click(await screen.findByRole('option', { name: /finance - pm fee/i }));
    await user.click(within(dialog).getByRole('button', { name: /save weekly priority/i }));

    await waitFor(() => {
      const entries = JSON.parse(window.localStorage.getItem('hdc_compass_weekly_tracker_entries'));
      const savedPriority = Object.values(entries).flat().find((entry) => entry.title === 'Coordinate launch readiness');
      expect(savedPriority.alignmentType).to.equal('both');
      expect(savedPriority.priorityId).to.equal('q2-enterprise-revenue');
      expect(savedPriority.workplanId).to.equal('dw-fin-pm-fee');
    });
  });

  it('issues a stuck directly from an owned Weekly Tracker Action Item', async () => {
    const { user } = renderWithProviders(<WeeklyActionTrackerPage />, '/weekly-tracker', 'u11');
    await user.click(await screen.findByRole('button', { name: /set my weekly priority/i }));
    const priorityDialog = await screen.findByRole('dialog');
    fireEvent.change(within(priorityDialog).getByRole('textbox', { name: /^weekly priority$/i }), { target: { value: 'Prepare weekly decision packet' } });
    fireEvent.change(within(priorityDialog).getByRole('textbox', { name: /^action item$/i }), { target: { value: 'Draft decision packet' } });
    await user.click(within(priorityDialog).getByRole('button', { name: /save weekly priority/i }));

    await user.click(await screen.findByRole('button', { name: /issue a stuck for action item draft decision packet/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/stuck description/i), 'Weekly Action Item needs a decision');
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

    await user.click(await screen.findByRole('button', { name: /add priority/i }));

    expect(await screen.findByText(/edit priority/i)).to.exist;
    expect(screen.getByLabelText(/priority name/i)).to.exist;
  });

  it('shows a bottom-right unavailable alert for unconnected priority save', async () => {
    const { user } = renderWithProviders(<PrioritiesPage />);

    await user.click(await screen.findByRole('button', { name: /add priority/i }));
    await user.click(await screen.findByRole('button', { name: /^save$/i }));

    expect(await screen.findByText(/action is unavailable because priority persistence is not connected yet/i)).to.exist;
  });

  it('opens the task-linked stuck creation modal', async () => {
    const { user } = renderWithProviders(<StucksPage />);

    await user.click(await screen.findByRole('button', { name: /issue a stuck/i }));

    expect(await screen.findByRole('heading', { name: /issue a stuck/i })).to.exist;
    expect(screen.getByLabelText(/task i am stuck on/i)).to.exist;
    expect(screen.getByLabelText(/stuck description/i)).to.exist;
    expect(screen.getByLabelText(/person stuck/i)).to.exist;
  });

  it('issues and persists a stuck against the current user task', async () => {
    const { user } = renderWithProviders(<StucksPage />);

    await user.click(await screen.findByRole('button', { name: /issue a stuck/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByLabelText(/task i am stuck on/i));
    await user.click(await screen.findByRole('option', { name: /send final q2 priority draft to elt - task view/i }));
    await user.type(within(dialog).getByLabelText(/stuck description/i), 'Need a decision before this can move');
    await user.click(within(dialog).getByLabelText(/need help from/i));
    await user.click(await screen.findByRole('option', { name: /sam jordan - finance/i }));
    await user.click(within(dialog).getByRole('button', { name: /^issue stuck$/i }));

    expect(await screen.findByText('Need a decision before this can move')).to.exist;
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hdc_compass_operating_data'));
      const stuck = saved.stucks.find((item) => item.description === 'Need a decision before this can move');
      expect(stuck.personStuckId).to.equal('u1');
      expect(stuck.sourceId).to.equal('a1');
      expect(stuck.sourceType).to.equal('queued_task');
    });
  });

  it('persists stuck row actions', async () => {
    const { user } = renderWithProviders(<StucksPage />);

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
      ['Strategy', 'Annual Initiatives', '/initiatives'],
      ['Strategy', 'Company Dashboard', '/dashboard/company'],
      ['Strategy', 'Priority Map', '/priorities'],
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

  it('pins operational priority health on the company dashboard', async () => {
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

    expect(await screen.findByText(/pinned priority signal/i)).to.exist;
    expect(await screen.findByRole('heading', { name: /operational priority health/i })).to.exist;
    expect(screen.getByLabelText(/team filter/i)).to.exist;
    expect(screen.getByText(/6\/6 q2 objectives/i)).to.exist;
    expect(screen.queryByText(/critical numbers/i)).to.equal(null);
  });

  it('opens an operational priority detail route from a company dashboard card', async () => {
    const { user } = renderWithProviders(
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

    await user.click(await screen.findByRole('button', { name: /open operational priority detail for operational efficiency/i }));

    expect((await screen.findByTestId('location')).textContent).to.equal('/dashboard/company/priorities/q2-operational-efficiency');
  });

  it('opens the permissioned edit modal on an operational priority page', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/dashboard/company/priorities/:priorityId" element={<OperationalPriorityPage />} />
      </Routes>,
      '/dashboard/company/priorities/q2-operational-efficiency',
    );

    expect(await screen.findByRole('heading', { name: /operational efficiency/i })).to.exist;

    await user.click(await screen.findByRole('button', { name: /^edit$/i }));

    expect(await screen.findByRole('dialog')).to.exist;
    expect(await screen.findByRole('heading', { name: /edit operational priority/i })).to.exist;
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
    expect(screen.getByRole('combobox', { name: /search dictionary/i })).to.exist;
    expect(screen.getByText(/^programmatic distinction$/i)).to.exist;
    expect(screen.getByText(/^plain english$/i)).to.exist;
    expect(screen.getByText(/application shell/i)).to.exist;
  });

  it('selects a dictionary term from the autocomplete search', async () => {
    const { user } = renderWithProviders(<LearnPage />, '/learn');
    await user.click(await screen.findByRole('button', { name: /dictionary/i }));
    const search = await screen.findByRole('combobox', { name: /search dictionary/i });

    await user.click(search);
    await user.type(search, 'signal');
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText(/^Signal$/i));

    expect(await screen.findByRole('heading', { name: /^signal$/i })).to.exist;
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
    );

    await user.click(await screen.findByRole('button', { name: /^stucks$/i }));

    expect(await screen.findByRole('heading', { name: /manage stucks/i })).to.exist;
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
