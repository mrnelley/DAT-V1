import { expect } from 'chai';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
});

global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
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

window.matchMedia = () => ({
  addEventListener: () => {},
  addListener: () => {},
  dispatchEvent: () => false,
  matches: false,
  media: '',
  onchange: null,
  removeEventListener: () => {},
  removeListener: () => {},
});

const unwrapElementType = (type) => {
  const component = type && typeof type === 'object'
    ? type.default?.default || type.default
    : null;
  return component && (typeof component === 'function' || component.$$typeof)
    ? component
    : type;
};

const patchJsxRuntime = (moduleName) => {
  const runtime = require(moduleName);
  const baseJsx = runtime.jsx;
  const baseJsxs = runtime.jsxs;
  const baseJsxDev = runtime.jsxDEV;
  if (baseJsx) runtime.jsx = (type, props, key) => baseJsx(unwrapElementType(type), props, key);
  if (baseJsxs) runtime.jsxs = (type, props, key) => baseJsxs(unwrapElementType(type), props, key);
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
React.createElement = (type, props, ...children) => (
  baseCreateElement(unwrapElementType(type), props, ...children)
);

const { CssBaseline } = await import('@mui/material');
const { ThemeProvider } = await import('@mui/material/styles');
const { MemoryRouter } = await import('react-router-dom');
const { cleanup, fireEvent, render, screen, waitFor } = await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');
const { AuthProvider } = await import('../src/hooks/useAuth.js');
const { ActionFeedbackProvider } = await import('../src/context/ActionFeedbackContext.jsx');
const { CalendarEventProvider } = await import('../src/context/CalendarEventContext.jsx');
const { FeatureAccessProvider } = await import('../src/context/FeatureAccessContext.jsx');
const { NotificationsProvider } = await import('../src/context/NotificationsContext.jsx');
const { OperatingDataProvider } = await import('../src/context/OperatingDataContext.jsx');
const { ReportingPeriodProvider } = await import('../src/context/ReportingPeriodContext.jsx');
const { default: AdvocacyDashboard } = await import('../src/components/advocacy/AdvocacyDashboard.jsx');
const { default: ExecutivePulsePage } = await import('../src/components/executive-pulse/ExecutivePulsePage.jsx');
const { default: FeatureRolloutPage } = await import('../src/components/admin/FeatureRolloutPage.jsx');
const { default: TopBar } = await import('../src/components/layout/TopBar.jsx');
const { default: ProfilePage } = await import('../src/components/profile/ProfilePage.jsx');
const { default: TaskViewPage } = await import('../src/components/task-view/TaskViewPage.jsx');
const { default: WeeklyActionTrackerPage } = await import('../src/components/weekly-tracker/WeeklyActionTrackerPage.jsx');
const { default: theme } = await import('../src/theme/index.js');
const { getAuthEmailForUsername, normalizeUsername } = await import('../src/utils/authIdentity.js');
const { compassUserDirectory } = await import('../scripts/compass-user-directory.mjs');
const {
  currentWeeklyReport,
  departmentRecords,
  departments,
  reportingPeriods,
  strategicPlan,
  users,
} = await import('./fixtures.js');

const userById = (id) => users.find((user) => user.id === id);

const emptyOperatingData = (overrides = {}) => ({
  contacts: [],
  departmentRecords,
  departments,
  departmentWorkplans: [],
  enterprisePriorities: [],
  huddles: [],
  initiatives: [],
  metrics: [],
  organizationId: 'org-test',
  properties: [],
  queuedTasks: [],
  strategicPlan,
  stucks: [],
  touchpoints: [],
  users,
  weeklyActionItems: [],
  weeklyPriorityEntriesByWeek: {},
  weeklyReports: [currentWeeklyReport],
  ...overrides,
});

const resetDocument = () => {
  document.body.removeAttribute('aria-hidden');
  document.body.removeAttribute('style');
  document.body.querySelectorAll('.MuiModal-root, .MuiPopover-root, .MuiPopper-root').forEach((node) => node.remove());
};

const renderWithProviders = (ui, { data = {}, path = '/', userId = 'u1' } = {}) => {
  cleanup();
  resetDocument();
  return {
    user: userEvent.setup({ document: window.document }),
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MemoryRouter initialEntries={[path]}>
          <AuthProvider initialUser={userById(userId)}>
            <ReportingPeriodProvider initialPeriods={reportingPeriods}>
              <ActionFeedbackProvider>
                <OperatingDataProvider initialData={emptyOperatingData(data)}>
                  <FeatureAccessProvider initialOverrides={{}}>
                    <NotificationsProvider initialEvents={[]}>
                      <CalendarEventProvider initialEvents={[]}>
                        {ui}
                      </CalendarEventProvider>
                    </NotificationsProvider>
                  </FeatureAccessProvider>
                </OperatingDataProvider>
              </ActionFeedbackProvider>
            </ReportingPeriodProvider>
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>,
    ),
  };
};

describe('table-backed application surfaces', () => {
  afterEach(() => {
    cleanup();
    resetDocument();
  });

  it('defines no historical reporting period before Q2 2026', () => {
    expect(reportingPeriods.every((period) => period.start >= '2026-04-01')).to.equal(true);
    expect(reportingPeriods[0].id).to.equal('2026-Q2');
  });

  it('defines the requested unique Auth directory and one administrator', () => {
    const expectedContactEmails = {
      angie: 'aruhle@hdcweb.org',
      dana: 'dhanchin@hdcweb.org',
      jaime: 'jshillady@hdcweb.org',
      kelly: 'kcook@hdcweb.org',
      kim: 'kkrauter@hdcweb.org',
      meg: 'mstruck@hdcweb.org',
      michele: 'mstauffer@hdcweb.org',
      parnell: 'pkelley@hdcweb.org',
      sam: 'sjordan@hdcweb.org',
      tammie: 'tfitzpatrick@hdcweb.org',
    };

    expect(compassUserDirectory).to.have.length(15);
    expect(new Set(compassUserDirectory.map((entry) => entry.username)).size).to.equal(15);
    expect(compassUserDirectory.filter((entry) => entry.isAdmin)).to.have.length(1);
    expect(compassUserDirectory.some((entry) => !entry.lastName)).to.equal(true);
    expect(compassUserDirectory.some((entry) => !entry.email)).to.equal(true);
    expect(Object.fromEntries(
      compassUserDirectory
        .filter((entry) => entry.email)
        .map((entry) => [entry.username, entry.email]),
    )).to.deep.equal(expectedContactEmails);
  });

  it('maps a real username to Supabase Auth without exposing an email login', () => {
    expect(normalizeUsername(' Dana ')).to.equal('dana');
    expect(getAuthEmailForUsername('Dana')).to.equal('dana@auth.hdcweb.org');
  });

  it('lets the administrator preview a user dashboard without changing sessions', async () => {
    const { user } = renderWithProviders(<TopBar onMenuClick={() => {}} />, {
      userId: 'u0',
    });

    await user.click(await screen.findByRole('button', { name: /view another user's dashboard/i }));
    await user.click(await screen.findByRole('menuitem', { name: /dana hanchin/i }));

    expect(await screen.findByText('Viewing Dana Hanchin')).to.exist;
    expect(screen.getAllByText('Compass Admin').length).to.be.greaterThan(0);
  });

  it('renders an empty task surface and creates a transient optimistic task', async () => {
    const { user } = renderWithProviders(<TaskViewPage />, { path: '/task-view' });
    const input = await screen.findByRole('textbox', { name: /add a task to my queue/i });
    await user.type(input, 'Confirm the operating review{Enter}');
    expect(await screen.findByText('Confirm the operating review')).to.exist;
  });

  it('builds the weekly tracker roster from table-shaped profile records', async () => {
    renderWithProviders(<WeeklyActionTrackerPage />, {
      path: '/weekly-tracker',
      userId: 'u11',
    });
    expect(await screen.findByText('Parnell')).to.exist;
    expect(screen.getByText('Dana Hanchin')).to.exist;
    expect(screen.getByText(currentWeeklyReport.label)).to.exist;
  });

  it('creates advocacy partners and touch reports without runtime seeds', async () => {
    const { user } = renderWithProviders(<AdvocacyDashboard />, {
      path: '/dashboard/me',
      userId: 'u19',
    });
    expect(await screen.findByText(/no partners have been added yet/i)).to.exist;
    await user.click(screen.getAllByRole('button', { name: /add partner/i })[0]);
    await user.type(await screen.findByLabelText(/partner name/i), 'Lancaster Housing Alliance');
    await user.click(screen.getByRole('button', { name: /save partner/i }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /add partner profile/i })).to.equal(null));
    fireEvent.click(screen.getAllByRole('button', { name: /log touch report/i })[0]);
    fireEvent.change(await screen.findByLabelText(/touch report notes/i), {
      target: { value: 'Post-hearing follow-up completed.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save touch report/i }));
    expect(await screen.findByText('Post-hearing follow-up completed.')).to.exist;
  });

  it('starts board reporting empty and lets the user create the first scorecard', async () => {
    const { user } = renderWithProviders(<ExecutivePulsePage />, {
      path: '/dashboard/executive-pulse',
    });
    expect(await screen.findByText(/no scorecards for this reporting period/i)).to.exist;
    await user.click(screen.getAllByRole('button', { name: /add scorecard/i })[0]);
    expect(await screen.findByRole('dialog')).to.exist;
    expect(screen.getByDisplayValue('Untitled Scorecard')).to.exist;
  });

  it('uses the table-backed directory on profile and rollout screens', async () => {
    renderWithProviders(<ProfilePage />, { path: '/profile', userId: 'u2' });
    expect((await screen.findAllByText('Sam Jordan')).length).to.be.greaterThan(0);
    expect(screen.getByText('Shar')).to.exist;
    expect(screen.queryByText(/reset to seed/i)).to.equal(null);

    cleanup();
    renderWithProviders(<FeatureRolloutPage />, { path: '/admin/features', userId: 'u0' });
    expect((await screen.findAllByText('Compass Admin')).length).to.be.greaterThan(0);
    expect(screen.getByRole('combobox', { name: /user/i })).to.exist;
  });
});
