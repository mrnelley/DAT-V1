import { brandAssets } from '../../theme/brandAssets.js';

export function mountSignIn(root, store) {
  root.innerHTML = `<div class="signin-layout">
    <section class="signin-story" aria-labelledby="signin-story-title">
      <img class="signin-hdc-logo" src="${brandAssets.logoHorizontalReverse}" alt="HDC MidAtlantic">
      <div class="signin-story-copy"><p class="signin-kicker">A little focus. A lot of possibility.</p>
        <h2 id="signin-story-title">Good work.<br>Shared direction.</h2>
        <p>Big goals move forward one commitment at a time. Let’s make room for what matters.</p>
      </div>
      <div class="signin-neighborhood" aria-hidden="true"><span class="neighborhood-sun"></span><span class="neighborhood-house house-one"><i></i><i></i><i></i></span><span class="neighborhood-house house-two"><i></i><i></i><i></i></span><span class="neighborhood-house house-three"><i></i><i></i><i></i></span><span class="neighborhood-path"></span></div>
      <p class="signin-story-footer">People. Purpose. Progress.</p>
    </section>
    <section class="signin-entry" aria-labelledby="signin-title">
      <div class="signin-entry-inner"><span class="signin-compass-mark" aria-hidden="true">✦</span><p class="eyebrow">Your HDC workspace</p>
        <h2 id="signin-title">Welcome to<br> Compass.</h2>
        <p class="signin-description">Connect the big picture to this week’s priorities. Your team’s next steps start here.</p>
        <button type="button" class="primary-button" id="microsoft-signin"><span class="microsoft-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Sign in with Microsoft<span aria-hidden="true">↗</span></button>
        <p class="signin-account-hint">Use your HDC Microsoft account.</p>
        <p id="signin-message" role="status" aria-live="polite"></p>
        <div class="signin-note"><span aria-hidden="true">↗</span><p><strong>Moving forward, together.</strong><br>Shared priorities. Clear ownership. Meaningful progress.</p></div>
      </div>
    </section>
  </div>`;
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
