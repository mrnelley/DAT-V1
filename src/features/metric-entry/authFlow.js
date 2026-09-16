// Invitations are issued by the server without a verifier in the recipient's browser.
// Ordinary sign-in links continue to use PKCE.
export function authFlowForHash(hash) {
  const parameters = new URLSearchParams(hash.replace(/^#/, ''));
  return parameters.has('access_token') && parameters.has('refresh_token') ? 'implicit' : 'pkce';
}

export async function signInWithMicrosoft(auth, origin) {
  const { error } = await auth.signInWithOAuth({
    provider: 'azure',
    options: { scopes: 'email', redirectTo: `${origin}/auth/callback` },
  });
  if (error) throw error;
}
