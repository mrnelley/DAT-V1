// Capture callback metadata before Supabase consumes the URL. Never retain tokens.
export function describeAuthCallback(location) {
  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const has = key => query.has(key) || hash.has(key);
  return {
    active: location.pathname === '/auth/callback' || ['code', 'access_token', 'error', 'error_code', 'error_description'].some(has),
    code: has('code'),
    tokens: has('access_token'),
    error: has('error') || has('error_description') || has('error_code'),
    expired: (query.get('error_code') || hash.get('error_code')) === 'otp_expired',
  };
}

export function createAuthSession(auth, callback, onSettled = () => {}) {
  let problem = '', checked = false;
  // getSession waits for initialization but does not return its callback error.
  const initialized = auth.initialize().catch(() => ({ error: { code: 'connection_failed' } }));
  return {
    problem: () => problem,
    clearProblem: () => { problem = ''; },
    async session() {
      const initialization = await initialized;
      const { data, error } = await auth.getSession();
      if (error) throw error;
      const session = data.session;
      if (!checked) {
        checked = true;
        if (callback.active && !session) {
          const failure = initialization.error;
          if (callback.expired || ['otp_expired', 'flow_state_expired', 'flow_state_not_found'].includes(failure?.code)) {
            problem = 'This sign-in link has expired or has already been used. Sign in with Microsoft, or request a new email and use only the newest link.';
          } else if (callback.code && !failure) {
            problem = 'Compass could not find the browser verification for this sign-in. Start sign-in again from this app address in the same browser and profile.';
          } else if (callback.error || failure || callback.tokens) {
            problem = 'Compass could not complete sign-in. Try Microsoft sign-in again. If using an email link, request a new one and open it in this browser.';
          } else {
            problem = 'The sign-in return contained no verification code. Start sign-in again. If this repeats, contact your Compass administrator to check the redirect configuration.';
          }
        }
        if (callback.active) onSettled();
      }
      if (session) problem = '';
      return session;
    },
  };
}
