export function mountSignIn(root, store) {
  root.innerHTML = '<div class="hero"><div><h2>Welcome to Compass</h2><p>Sign in with your HDC Microsoft account to open your workspace.</p></div></div><button type="button" class="primary-button" id="microsoft-signin">Sign in with Microsoft</button><p id="signin-message" role="status" aria-live="polite"></p>';
  const button = root.querySelector('#microsoft-signin');
  const message = root.querySelector('#signin-message');
  message.textContent = store.signInProblem?.() || '';
  button.onclick = async () => {
    if (button.disabled) return;
    button.disabled = true;
    message.textContent = 'Opening Microsoft sign-in…';
    try { await store.signInMicrosoft(); }
    catch (error) { message.textContent = error.message; button.disabled = false; }
  };
}
