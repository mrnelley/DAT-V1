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
const { default: theme } = await import('../src/theme/index.js');
const { default: ActionItemsPage } = await import('../src/components/action-items/ActionItemsPage.jsx');
const { default: CompanyDashboardOverview } = await import('../src/components/dashboard/CompanyDashboardOverview.jsx');
const { default: HuddlesPage } = await import('../src/components/huddles/HuddlesPage.jsx');
const { default: LearnDictionaryPage } = await import('../src/components/learn/LearnDictionaryPage.jsx');
const { default: LoginPage } = await import('../src/components/auth/LoginPage.jsx');
const { default: OperationalPriorityPage } = await import('../src/components/priorities/OperationalPriorityPage.jsx');
const { default: PrioritiesPage } = await import('../src/components/priorities/PrioritiesPage.jsx');
const { default: ProfilePage } = await import('../src/components/profile/ProfilePage.jsx');
const { default: SideNav } = await import('../src/components/layout/SideNav.jsx');
const { default: StucksPage } = await import('../src/components/stucks/StucksPage.jsx');
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
                  {ui}
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

  it('opens the one-off action dialog from Action Views', async () => {
    const { user } = renderWithProviders(<ActionItemsPage />);

    await user.click(await screen.findByRole('button', { name: /add one-off action/i }));

    expect(screen.getByRole('dialog')).to.exist;
    expect(screen.getByRole('heading', { name: /add one-off action/i })).to.exist;
    expect(screen.getByText(/weekly commitments start in the weekly tracker/i)).to.exist;
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
    const actionViews = screen.getByText('Action Views');

    expect(dashboards.compareDocumentPosition(companyDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(companyDashboard.compareDocumentPosition(myDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(myDashboard.compareDocumentPosition(annualInitiatives) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(annualInitiatives.compareDocumentPosition(operationalPriorities) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(operationalPriorities.compareDocumentPosition(weeklyTracker) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(weeklyTracker.compareDocumentPosition(actionViews) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    expect(screen.queryByText('Notifications')).to.equal(null);
    expect(screen.queryByText('Data Table')).to.equal(null);

    cleanup();
    renderWithProviders(<SideNav open mobileOpen={false} onHuddlesClick={() => {}} onMobileClose={() => {}} />, '/dashboard/company', 'u1');
    expect(await screen.findByText('Data Table')).to.exist;
  });

  it('creates a visible one-off action from Action Views', async () => {
    const { user } = renderWithProviders(<ActionItemsPage />);

    await user.click(await screen.findByRole('button', { name: /add one-off action/i }));
    await user.type(screen.getByLabelText(/^action$/i), 'Confirm Teams card copy');
    await user.click(screen.getByRole('button', { name: /create one-off action/i }));

    expect(await screen.findByText('Confirm Teams card copy')).to.exist;
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).to.equal(null);
    });
  });

  it('opens and saves the action assignment workflow from an action row', async () => {
    const { user } = renderWithProviders(<ActionItemsPage />);

    await user.click(await screen.findByRole('button', { name: /open assignment workflow for action send final q2 priority draft to elt/i }));

    expect(await screen.findByRole('heading', { name: /action assignment workflow/i })).to.exist;
    expect(screen.getByLabelText(/assign to/i)).to.exist;

    await user.click(screen.getByRole('button', { name: /save assignment/i }));

    expect(await screen.findByText(/teams action card queued for dana hanchin/i)).to.exist;
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).to.equal(null);
    });
  });

  it('creates a weekly priority and supporting action from Weekly Tracker', async () => {
    const { user } = renderWithProviders(<WeeklyActionTrackerPage />, '/weekly-tracker', 'u11');

    await user.click(await screen.findByRole('button', { name: /set my weekly priority/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /set weekly priority/i })).to.exist;

    fireEvent.change(within(dialog).getByRole('textbox', { name: /^weekly priority$/i }), { target: { value: 'Publish operations support summary' } });
    fireEvent.change(within(dialog).getByRole('textbox', { name: /^supporting action$/i }), { target: { value: 'Send summary to Tammie' } });
    await user.click(within(dialog).getByRole('button', { name: /save weekly priority/i }));

    expect(await screen.findByText(/publish operations support summary/i)).to.exist;
    expect(await screen.findByText(/send summary to tammie/i)).to.exist;
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).to.equal(null);
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

  it('opens the stuck creation modal from Add New Stuck', async () => {
    const { user } = renderWithProviders(<StucksPage />);

    await user.click(await screen.findByRole('button', { name: /add new stuck/i }));

    expect(await screen.findByRole('heading', { name: /add new stuck/i })).to.exist;
    expect(screen.getByLabelText(/stuck description/i)).to.exist;
  });

  it('shows an unavailable alert for stuck row actions without persistence', async () => {
    const { user } = renderWithProviders(<StucksPage />);

    const pinButton = await screen.findByRole('button', { name: /pin stuck: waiting on final lease packet approvals/i });
    await user.click(pinButton);

    expect(await screen.findByText(/action is unavailable because pin stuck needs stuck activity persistence/i)).to.exist;
  });

  it('routes every top navigation dropdown item to a destination', async () => {
    const { user } = renderWithProviders(
      <>
        <TopBar onMenuClick={() => {}} />
        <LocationProbe />
      </>,
      '/action-items',
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
    renderWithProviders(<LearnDictionaryPage />, '/learn');

    expect(await screen.findByRole('heading', { name: /^learn$/i })).to.exist;
    expect(screen.getByRole('heading', { name: /compass dictionary/i })).to.exist;
    expect(screen.getByRole('combobox', { name: /search dictionary/i })).to.exist;
    expect(screen.getByText(/^programmatic distinction$/i)).to.exist;
    expect(screen.getByText(/^plain english$/i)).to.exist;
    expect(screen.getByText(/application shell/i)).to.exist;
  });

  it('selects a dictionary term from the autocomplete search', async () => {
    const { user } = renderWithProviders(<LearnDictionaryPage />, '/learn');
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

    await user.click(await screen.findByRole('button', { name: /stucks 2/i }));

    expect(await screen.findByRole('heading', { name: /manage stucks/i })).to.exist;
  });

  it('shows an unavailable alert when joining a huddle without a Teams meeting link', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/huddles/:id" element={<HuddlesPage />} />
      </Routes>,
      '/huddles/daily-ops',
    );

    await user.click(await screen.findByRole('button', { name: /join meeting/i }));

    expect(await screen.findByText(/action is unavailable because the teams meeting link is not available/i)).to.exist;
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
