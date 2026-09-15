(() => {
  const M = globalThis.CompassWeeklyModel;
  const storageKey = 'compass_weekly_prototype_v1';
  const labels = { good: 'On track', watch: 'Watch', risk: 'Off track', pending: 'Not submitted' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const badge = status => `<span class="badge ${status}"><span class="dot"></span>${labels[status]}</span>`;
  const friendly = date => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: M.zone }).format(new Date(`${date}T12:00:00Z`));
  const instant = value => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: M.zone, timeZoneName: 'short' }).format(new Date(value));
  const option = (value, label, current) => `<option value="${esc(value)}" ${value === current ? 'selected' : ''}>${esc(label)}</option>`;
  let state = M.empty(), loadError = '', root, initiatives = [], positions = [], selectedPosition = '', week = M.weekOf(new Date()), view = 'mine';
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const loaded = JSON.parse(raw);
      if (loaded.version !== 1 || !loaded.records || !Array.isArray(loaded.events)
        || !Object.values(loaded.records).every(r => r.draft && Array.isArray(r.draft.entries))) throw new Error('Invalid saved demo data');
      state = loaded;
    }
  } catch { loadError = 'Saved demo data could not be loaded. Changes are disabled to preserve it; use another browser profile for a fresh demonstration.'; }
  const record = (position = selectedPosition) => state.records[M.key(week, position)];
  const getDraft = () => M.clone(record()?.draft || { ...M.freshDraft(), entries: [M.entry(week, selectedPosition)] });
  const position = () => positions.find(p => p.id === selectedPosition);
  function message(text, error = false) {
    const target = root?.querySelector('#weekly-message');
    if (!target) return;
    target.textContent = text; target.hidden = !text; target.classList.toggle('error', error);
  }
  function commit(next) {
    if (loadError) { message(loadError, true); return false; }
    try { localStorage.setItem(storageKey, JSON.stringify(next)); state = next; return true; }
    catch { message('The browser could not save this change. Free storage or allow local storage, then try again.', true); return false; }
  }
  const save = draft => commit(M.saveDraft(state, week, selectedPosition, draft));
  const entryField = (e, index, field, label, type = 'text', extra = '') => `<label class="field ${extra}">${label}<input data-entry="${index}" data-field="${field}" type="${type}" value="${esc(e[field])}" ${type === 'text' ? 'maxlength="250"' : ''}></label>`;
  const entryArea = (e, index, field, label) => `<label class="field span-two">${label}<textarea data-entry="${index}" data-field="${field}" maxlength="2000">${esc(e[field])}</textarea></label>`;
  const projectOptions = current => '<option value="">Select a project</option>' + initiatives.map(i => option(i.id, i.project, current)).join('');
  function taskForm(t, entryIndex, index) {
    return `<div class="task-form"><label class="field span-two">Action item<input data-task="${index}" data-entry="${entryIndex}" data-field="title" value="${esc(t.title)}" maxlength="250"></label><label class="field">Responsible position<select data-task="${index}" data-entry="${entryIndex}" data-field="owner">${positions.map(p => option(p.id, p.title, t.owner)).join('')}</select></label><label class="field">Due date<input type="date" data-task="${index}" data-entry="${entryIndex}" data-field="due" value="${esc(t.due)}"></label><label class="field">Task status<select data-task="${index}" data-entry="${entryIndex}" data-field="status">${['open', 'in_progress', 'complete', 'blocked', 'cancelled'].map(s => option(s, s.replace('_', ' '), t.status)).join('')}</select></label><button class="quiet-button" type="button" data-remove-task="${index}" data-entry="${entryIndex}">Remove action item</button></div>`;
  }
  function entryForm(e, index, draft) {
    return `<section class="entry-form"><div class="entry-heading"><h3>Priority ${index + 1}${index === 0 ? ' · Most important' : ''}${e.carriedFrom ? ' · Carried forward' : ''}</h3><div class="entry-actions"><button class="quiet-button" type="button" data-move="${index}" data-direction="-1" aria-label="Move priority ${index + 1} up" ${index === 0 ? 'disabled' : ''}>↑</button><button class="quiet-button" type="button" data-move="${index}" data-direction="1" aria-label="Move priority ${index + 1} down" ${index === draft.entries.length - 1 ? 'disabled' : ''}>↓</button><button class="quiet-button" type="button" data-remove-entry="${index}" aria-label="Remove priority ${index + 1}">Remove</button></div></div><div class="form-grid">${entryField(e, index, 'title', 'Weekly priority', 'text', 'span-two')}${entryArea(e, index, 'desiredResult', 'Desired result')}<label class="field span-two">Project plan<select data-entry="${index}" data-field="projectId">${projectOptions(e.projectId)}</select></label>${draft.capacity !== 'capacity' ? `<label class="field span-two">Enterprise initiative<select data-entry="${index}" data-field="initiativeId"><option value="">Department work only</option>${initiatives.map(i => option(i.id, i.title, e.initiativeId)).join('')}</select></label>` : ''}${entryField(e, index, 'due', 'Priority due date', 'date')}<label class="field">Priority health<select data-entry="${index}" data-field="status">${['good', 'watch', 'risk'].map(s => option(s, labels[s], e.status)).join('')}</select></label>${entryArea(e, index, 'support', 'Risk or support needed')}</div><div class="action-items"><h4>Action items</h4>${e.tasks.map((t, i) => taskForm(t, index, i)).join('')}<button class="quiet-button" type="button" data-add-task="${index}">+ Add action item</button></div></section>`;
  }
  function scorePanel() {
    const pending = state.events.filter(e => e.position === selectedPosition && e.points === null).length;
    return `<aside class="weekly-side"><section class="weekly-panel"><p class="eyebrow">Position points</p><div class="score-value">${M.score(state, selectedPosition)} <small>points</small></div><p class="muted">Starts at 100. Points carry forward and are reviewed by position each year.</p>${pending ? `<p class="weekly-note">${pending} late deduction${pending === 1 ? '' : 's'} awaiting a configured amount.</p>` : ''}<dl><dt>Submission deadline</dt><dd>Friday, 5 p.m. Eastern</dd><dt>Enterprise capacity choice</dt><dd>No points deducted</dd><dt>Late submission</dt><dd>${state.lateDeduction === null ? 'Deduction amount not set' : `−${state.lateDeduction} points, once per week`}</dd></dl><details class="rule-settings"><summary>Demo scoring settings</summary><p class="weekly-note">Preview a deduction amount. This settles pending demo deductions and applies to future submissions. Existing deductions stay unchanged.</p><label class="field">Points per late submission<input id="late-deduction" type="number" min="1" max="100" step="1" value="${state.lateDeduction ?? ''}"></label><button class="quiet-button" type="button" data-save-policy>Apply demo rule</button></details></section><section class="weekly-panel"><h3>A useful weekly record</h3><p class="muted">State what you can deliver, the result you expect, and where you need help. Department work still counts when enterprise work cannot be prioritized.</p><p class="weekly-note" style="margin-top:14px">Drafts save in this browser. Only submitted entries appear in the team rollup. These demo records are separate from old Compass and the database.</p></section></aside>`;
  }
  function mine() {
    const draft = getDraft(), current = record(), previous = state.records[M.key(M.addDays(week, -7), selectedPosition)]?.submitted?.snapshot;
    return `<div class="weekly-layout"><div><form id="weekly-form" class="weekly-panel"><fieldset class="capacity"><legend>Can you prioritize an enterprise initiative this week?</legend><label><input type="radio" name="capacity" value="enterprise" ${draft.capacity === 'enterprise' ? 'checked' : ''}><span>Yes, I can make an enterprise commitment.<small>Link at least one priority to an initiative below.</small></span></label><label><input type="radio" name="capacity" value="capacity" ${draft.capacity === 'capacity' ? 'checked' : ''}><span>I can’t prioritize an enterprise initiative this week.<small>That’s okay. Submit this choice and add department priorities if useful.</small></span></label></fieldset><label class="field">Context for the week <span class="weekly-note">Optional</span><textarea id="capacity-note" maxlength="2000">${esc(draft.note)}</textarea></label>${draft.entries.map((e, i) => entryForm(e, i, draft)).join('')}<div class="form-footer"><button class="quiet-button" type="button" data-add-entry>+ Add priority</button>${previous?.entries.length ? '<button class="quiet-button" type="button" data-carry>Bring forward last week’s priorities</button>' : ''}</div><div class="form-footer"><p class="weekly-note" id="save-status">${current?.submitted ? `Submitted ${instant(current.submitted.firstAt)}. Submit again to publish draft changes.` : 'Submit by ' + instant(M.deadline(week)) + '.'}</p><button class="primary-button" type="submit">${current?.submitted ? 'Update submission' : 'Submit this week'}</button></div></form></div>${scorePanel()}</div>`;
  }
  function rollup() {
    const records = positions.map(p => ({ p, r: record(p.id) }));
    const submitted = records.filter(({ r }) => r?.submitted);
    const capacityCount = submitted.filter(({ r }) => r.submitted.snapshot.capacity === 'capacity').length;
    const entries = submitted.flatMap(({ r }) => r.submitted.snapshot.entries);
    const late = submitted.filter(({ r }) => Date.parse(r.submitted.firstAt) > Date.parse(M.deadline(week))).length;
    return `<div class="rollup-summary">${[[submitted.length + ' / ' + positions.length, 'Positions submitted'], [capacityCount, 'No enterprise capacity'], [entries.length, 'Weekly priorities'], [late, 'Late submissions']].map(([v, l]) => `<div class="stat"><small>${l}</small><strong>${v}</strong></div>`).join('')}</div><p class="weekly-note" style="margin-bottom:18px">Submitted records for this week. Capacity declarations count as submitted. Scorecard KPI values stay independent of task completion.</p><div class="rollup-list">${records.map(({ p, r }) => `<article class="rollup-card"><div class="rollup-head"><div><h3>${esc(p.title)}</h3><small>${esc(p.department)}${r?.submitted ? ' · Submitted ' + instant(r.submitted.firstAt) : ''}</small></div>${r?.submitted ? r.submitted.snapshot.capacity === 'capacity' ? '<span class="capacity-tag">No enterprise capacity</span>' : '<span class="badge good">Submitted</span>' : badge('pending')}</div>${r?.submitted ? `${r.submitted.snapshot.note ? `<p class="weekly-note" style="margin-top:14px">${esc(r.submitted.snapshot.note)}</p>` : ''}${r.submitted.snapshot.entries.map((e, i) => `<div class="rollup-entry"><strong>${i + 1}. ${esc(e.title)}</strong>${badge(e.status)}<p>${esc(e.desiredResult)}</p><p>${esc(initiatives.find(p => p.id === e.projectId)?.project || 'Department work')} · Due ${friendly(e.due)}</p>${e.support ? `<p>Support: ${esc(e.support)}</p>` : ''}${e.tasks.length ? `<p>Action items: ${e.tasks.filter(t => t.status === 'complete').length} / ${e.tasks.length} complete</p>` : ''}</div>`).join('')}${r.submitted.snapshot.capacity === 'capacity' && !r.submitted.snapshot.entries.length ? '<p class="weekly-note" style="margin-top:14px">Capacity declaration submitted; no weekly priorities entered.</p>' : ''}` : '<p class="weekly-note" style="margin-top:14px">No submitted record for this week.</p>'}</article>`).join('')}</div>`;
  }
  function review() {
    const year = week.slice(0, 4);
    return `<section class="weekly-panel"><h3>${year} position review</h3><p class="weekly-note" style="margin-bottom:20px">Submission counts and deductions shown for the selected year. The current points balance carries across weeks and years; there is no automatic reset. Activity here covers records entered into this browser prototype.</p><div class="review-table"><table><thead><tr><th>Position</th><th>Submitted</th><th>Capacity choices</th><th>Late entries</th><th>${year} deductions</th><th>Current points</th></tr></thead><tbody>${positions.map(p => { const records = Object.values(state.records).filter(r => r.position === p.id && r.week.startsWith(year) && r.submitted); const events = state.events.filter(e => e.position === p.id && e.week.startsWith(year)); return `<tr><td>${esc(p.title)}</td><td>${records.length}</td><td>${records.filter(r => r.submitted.snapshot.capacity === 'capacity').length}</td><td>${events.length}</td><td>${events.reduce((sum, e) => sum + (e.points ?? 0), 0)}${events.some(e => e.points === null) ? ' + pending' : ''}</td><td><strong>${M.score(state, p.id)}</strong></td></tr>`; }).join('')}</tbody></table></div><p class="weekly-note" style="margin-top:18px">A late deduction is recorded once against the first submission. Editing or submitting again never duplicates it. Not submitted, capacity declared, and submitted late are separate states.</p></section>`;
  }
  function render() {
    if (!root) return;
    const currentWeek = M.weekOf(new Date());
    const weeks = [...new Set([week, ...Array.from({ length: 7 }, (_, i) => M.addDays(currentWeek, (i - 5) * 7)), ...Object.values(state.records).map(r => r.week)])].sort().reverse();
    root.innerHTML = `<div class="hero"><div><h2>Weekly Accountability</h2><p>Clear commitments. Room for real capacity.</p></div><div class="hero-meta"><span class="period">${friendly(week)} – ${friendly(M.addDays(week, 4))}</span><br>Due Friday · 5 p.m. Eastern</div></div><div class="weekly-toolbar"><div class="weekly-controls"><label class="field">Week beginning<select id="weekly-week">${weeks.map(w => option(w, friendly(w), week)).join('')}</select></label><label class="field">Demo position<select id="weekly-position">${positions.map(p => option(p.id, p.title, selectedPosition)).join('')}</select></label></div><nav class="weekly-subnav" aria-label="Weekly views">${[['mine', 'My priorities'], ['rollup', 'Team rollup'], ['review', 'Annual review']].map(([id, label]) => `<button class="quiet-button" data-weekly-view="${id}" aria-pressed="${view === id}">${label}</button>`).join('')}</nav></div><div id="weekly-message" class="weekly-message" role="status" aria-live="polite" hidden></div>${view === 'mine' ? mine() : view === 'rollup' ? rollup() : review()}<p class="footnote">Browser-only prototype · Demo entries are saved locally, not submitted to HDC’s database. Scorecard figures remain illustrative. Friday deadlines use America/New_York, including daylight saving time.</p>`;
    if (loadError) message(loadError, true);
  }
  function mutate(change, redraw = true) {
    const draft = getDraft(); change(draft);
    if (save(draft)) { if (redraw) render(); else { const status = root.querySelector('#save-status'); if (status) status.textContent = 'Draft saved in this browser. Submit to update the team rollup.'; } }
  }
  function onChange(event) {
    const el = event.target;
    if (el.id === 'weekly-week') { week = el.value; render(); return; }
    if (el.id === 'weekly-position') { selectedPosition = el.value; render(); return; }
    if (el.name === 'capacity') { mutate(d => { d.capacity = el.value; if (el.value === 'capacity') d.entries.forEach(e => { e.initiativeId = ''; }); }); return; }
    if (el.dataset.entry !== undefined && el.dataset.field) {
      mutate(d => { const entry = d.entries[Number(el.dataset.entry)]; const target = el.dataset.task !== undefined ? entry.tasks[Number(el.dataset.task)] : entry; target[el.dataset.field] = el.value; }, false);
    } else if (el.id === 'capacity-note') mutate(d => { d.note = el.value; }, false);
  }
  function onClick(event) {
    const b = event.target.closest('button'); if (!b) return;
    if (b.dataset.weeklyView) { view = b.dataset.weeklyView; render(); return; }
    if (b.hasAttribute('data-add-entry')) mutate(d => d.entries.push(M.entry(week, selectedPosition)));
    if (b.dataset.removeEntry !== undefined) mutate(d => d.entries.splice(Number(b.dataset.removeEntry), 1));
    if (b.dataset.addTask !== undefined) mutate(d => d.entries[Number(b.dataset.addTask)].tasks.push({ id: crypto.randomUUID(), title: '', owner: selectedPosition, due: M.addDays(week, 4), status: 'open' }));
    if (b.dataset.removeTask !== undefined) mutate(d => d.entries[Number(b.dataset.entry)].tasks.splice(Number(b.dataset.removeTask), 1));
    if (b.dataset.move !== undefined) mutate(d => { const index = Number(b.dataset.move), to = index + Number(b.dataset.direction); if (to >= 0 && to < d.entries.length) [d.entries[index], d.entries[to]] = [d.entries[to], d.entries[index]]; });
    if (b.hasAttribute('data-carry')) {
      const previousWeek = M.addDays(week, -7), previous = state.records[M.key(previousWeek, selectedPosition)]?.submitted?.snapshot;
      if (!previous) return;
      mutate(d => { const existing = new Set(d.entries.map(e => e.carriedFrom)); const additions = M.carry(previous, previousWeek, week, selectedPosition).entries.filter(e => !existing.has(e.carriedFrom)); d.entries = [...d.entries.filter(e => e.title.trim() || e.desiredResult.trim() || e.tasks.length), ...additions]; if (d.capacity === 'capacity') d.entries.forEach(e => { e.initiativeId = ''; }); });
    }
    if (b.hasAttribute('data-save-policy')) {
      try { const amount = Number(root.querySelector('#late-deduction').value); if (commit(M.setDeduction(state, amount))) { render(); message('Demo scoring rule saved. Pending deductions were applied once.'); } }
      catch (error) { message(error.message, true); }
    }
  }
  function onSubmit(event) {
    if (event.target.id !== 'weekly-form') return;
    event.preventDefault();
    try { if (commit(M.submit(state, week, selectedPosition, getDraft(), initiatives))) { render(); message('Weekly submission saved. It is now included in the team rollup.'); } }
    catch (error) { message(error.message, true); root.querySelector('#weekly-message')?.scrollIntoView?.({ block: 'nearest' }); }
  }
  globalThis.CompassWeekly = {
    mount(target, source) {
      if (root !== target) {
        if (root) { root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); root.removeEventListener('input', onInput); root.removeEventListener('submit', onSubmit); }
        root = target; root.addEventListener('click', onClick); root.addEventListener('change', onChange); root.addEventListener('input', onInput); root.addEventListener('submit', onSubmit);
      }
      initiatives = source;
      positions = [...new Map(source.map(i => { const id = i.owner.toLowerCase().replace(/[^a-z0-9]+/g, '-'); return [id, { id, title: i.owner, department: i.department }]; })).values()];
      if (!positions.some(p => p.id === selectedPosition)) selectedPosition = positions.find(p => p.title === 'Chief Operating Officer')?.id || positions[0].id;
      render();
    },
    selectInitiative(id) {
      const initiative = initiatives.find(i => i.id === id); if (!initiative) return;
      selectedPosition = positions.find(p => p.title === initiative.owner).id; view = 'mine'; render();
    },
  };
  function onInput(event) { if (event.target.matches('input[data-field],textarea[data-field],#capacity-note')) onChange(event); }
})();
