// Invitations are issued by the server without a verifier in the recipient's browser.
// Ordinary sign-in links continue to use PKCE.
export function authFlowForHash(hash) {
  const parameters = new URLSearchParams(hash.replace(/^#/, ''));
  return parameters.has('access_token') && parameters.has('refresh_token') ? 'implicit' : 'pkce';
}

export async function signInWithMicrosoft(auth, origin) {
  // Keep the callback on the initiating origin: PKCE verification is stored there.
  // Hosted dev uses https://hdc-compass.dev; local development stays on localhost.
  const { error } = await auth.signInWithOAuth({
    provider: 'azure',
    options: { scopes: 'email', redirectTo: `${origin}/auth/callback` },
  });
  if (error) throw error;
}
