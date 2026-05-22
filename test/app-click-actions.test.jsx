import { expect } from 'chai';
import { JSDOM } from 'jsdom';

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

const { default: React } = await import('react');
global.React = React;
const { ThemeProvider } = await import('@mui/material/styles');
const { CssBaseline } = await import('@mui/material');
const { MemoryRouter, Route, Routes, useLocation } = await import('react-router-dom');
const { cleanup, render, screen, waitFor, within } = await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');
const { AuthProvider } = await import('../src/hooks/useAuth.js');
const { ActionFeedbackProvider } = await import('../src/context/ActionFeedbackContext.jsx');
const { NotificationsProvider } = await import('../src/context/NotificationsContext.jsx');
const { default: theme } = await import('../src/theme/index.js');
const { default: ActionItemsPage } = await import('../src/components/action-items/ActionItemsPage.jsx');
const { default: HuddlesPage } = await import('../src/components/huddles/HuddlesPage.jsx');
const { default: InitiativesPage } = await import('../src/components/initiatives/InitiativesPage.jsx');
const { default: PrioritiesPage } = await import('../src/components/priorities/PrioritiesPage.jsx');
const { default: ProfilePage } = await import('../src/components/profile/ProfilePage.jsx');
const { default: StucksPage } = await import('../src/components/stucks/StucksPage.jsx');
const { default: TopBar } = await import('../src/components/layout/TopBar.jsx');

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderWithProviders = (ui, path = '/') => {
  cleanup();
  window.localStorage.clear();
  window.localStorage.setItem('hdc_pulse_demo_authenticated', 'true');
  window.localStorage.setItem('hdc_pulse_demo_user_id', 'u1');
  return {
    user: userEvent.setup({ document: window.document }),
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MemoryRouter initialEntries={[path]}>
          <AuthProvider>
            <ActionFeedbackProvider>
              <NotificationsProvider>
                {ui}
              </NotificationsProvider>
            </ActionFeedbackProvider>
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

  it('opens the action item creation dialog from Add Action Item', async () => {
    const { user } = renderWithProviders(<ActionItemsPage />);

    await user.click(await screen.findByRole('button', { name: /add action item/i }));

    expect(screen.getByRole('dialog')).to.exist;
    expect(screen.getByRole('heading', { name: /add action item/i })).to.exist;
    expect(screen.getByText(/advanced visibility/i)).to.exist;
  });

  it('creates a visible action item from the action item dialog', async () => {
    const { user } = renderWithProviders(<ActionItemsPage />);

    await user.click(await screen.findByRole('button', { name: /add action item/i }));
    await user.type(screen.getByLabelText(/task/i), 'Confirm Teams card copy');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText('Confirm Teams card copy')).to.exist;
    expect(screen.queryByRole('dialog')).to.equal(null);
  });

  it('opens and saves the task assignment workflow from an action item row', async () => {
    const { user } = renderWithProviders(<ActionItemsPage />);

    await user.click(await screen.findByRole('button', { name: /open assignment workflow for action item send final q2 priority draft to elt/i }));

    expect(await screen.findByRole('heading', { name: /task assignment workflow/i })).to.exist;
    expect(screen.getByLabelText(/assign to/i)).to.exist;

    await user.click(screen.getByRole('button', { name: /save assignment/i }));

    expect(await screen.findByText(/teams action card queued for dana hanchin/i)).to.exist;
    expect(screen.queryByRole('dialog')).to.equal(null);
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

  it('routes the top navigation Annual Initiatives item to the initiatives page', async () => {
    const { user } = renderWithProviders(
      <>
        <TopBar onMenuClick={() => {}} />
        <LocationProbe />
        <Routes>
          <Route path="/initiatives" element={<InitiativesPage />} />
        </Routes>
      </>,
      '/action-items',
    );

    await user.click(await screen.findByRole('button', { name: /strategy/i }));
    await user.click(await screen.findByRole('menuitem', { name: /annual initiatives/i }));

    expect(await screen.findByTestId('location')).to.have.text('/initiatives');
  });

  it('shows an unavailable alert for the quick add button', async () => {
    const { user } = renderWithProviders(<TopBar onMenuClick={() => {}} />);

    await user.click(await screen.findByRole('button', { name: /open quick add menu/i }));

    expect(await screen.findByText(/action is unavailable because quick add is not connected/i)).to.exist;
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
