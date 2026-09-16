/* Demo domain logic. Production timestamps, permissions and ledger writes must be server owned. */
(() => {
  const zone = 'America/New_York';
  const clone = value => JSON.parse(JSON.stringify(value));
  const dateParts = date => Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  const day = date => { const p = dateParts(date); return `${p.year}-${p.month}-${p.day}`; };
  const addDays = (value, amount) => new Date(Date.parse(`${value}T12:00:00Z`) + amount * 86400000).toISOString().slice(0, 10);
  const weekOf = date => { const value = day(date); const weekday = new Date(`${value}T12:00:00Z`).getUTCDay(); return addDays(value, -((weekday + 6) % 7)); };
  const localInstant = (date, time) => {
    // Determine the UTC offset for the local calendar date, including DST transitions.
    const offsetName = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
      .formatToParts(new Date(`${date}T12:00:00Z`)).find(p => p.type === 'timeZoneName').value;
    return new Date(`${date}T${time}${offsetName.replace('GMT', '') || '+00:00'}`).toISOString();
  };
  const millis = value => value instanceof Date ? value.getTime() : Date.parse(value);
  const deadline = week => localInstant(addDays(week, 4), '17:00:00');
  const graceEnd = week => localInstant(addDays(week, 7), '09:00:00');
  const policy = Object.freeze({ startingPoints: 100, onTimePriority: 5, onTimeOptOut: 0, late: -3, missed: -10 });
  const key = (week, position) => `${week}:${position}`;
  const empty = () => ({ version: 2, records: {}, events: [] });
  const freshDraft = () => ({ capacity: '', note: '', entries: [] });
  const entry = (week, position) => ({ id: crypto.randomUUID(), title: '', desiredResult: '', projectId: '', initiativeId: '', status: 'good', due: addDays(week, 4), support: '', tasks: [], owner: position });
  const validate = (draft, initiatives) => {
    if (!['enterprise', 'capacity'].includes(draft.capacity)) return 'Choose whether you can prioritize an enterprise initiative this week.';
    const entries = draft.entries.filter(e => e.title.trim());
    if (draft.capacity === 'enterprise' && (!entries.length || !entries.some(e => e.initiativeId))) return 'Add at least one priority linked to an enterprise initiative, or select the capacity option.';
    for (const e of entries) {
      if (!e.desiredResult.trim()) return 'Describe the desired result for each priority.';
      if (!e.due || !/^\d{4}-\d{2}-\d{2}$/.test(e.due)) return 'Set a due date for each priority.';
      if (!e.projectId || !initiatives.some(i => i.id === e.projectId)) return 'Link each priority to a project plan.';
      if (e.initiativeId && e.projectId !== e.initiativeId) return 'Choose the project supporting the selected enterprise initiative.';
      if (e.initiativeId && !initiatives.some(i => i.id === e.initiativeId)) return 'Choose an available enterprise initiative.';
      if (draft.capacity === 'capacity' && e.initiativeId) return 'Capacity-only submissions cannot contain an enterprise commitment.';
      if (e.tasks.some(t => !t.title.trim() || !t.owner || !t.due)) return 'Give each action item a title, responsible position, and due date.';
    }
    if (draft.entries.some(e => !e.title.trim() && (e.desiredResult.trim() || e.tasks.length))) return 'Finish the partially entered priority, or remove it.';
    return '';
  };
  const saveDraft = (state, week, position, draft) => {
    const next = clone(state), id = key(week, position);
    next.records[id] = { ...next.records[id], week, position, draft: clone(draft) };
    return next;
  };
  const scoreEvent = (week, capacity, firstAt) => {
    if (millis(firstAt) <= millis(deadline(week))) {
      return capacity === 'enterprise'
        ? { type: 'on_time_priority', reason: 'On-time enterprise priority', points: policy.onTimePriority }
        : { type: 'on_time_opt_out', reason: 'On-time enterprise opt-out', points: policy.onTimeOptOut };
    }
    if (millis(firstAt) <= millis(graceEnd(week))) return { type: 'late_submission', reason: 'Late weekly submission', points: policy.late };
    return { type: 'missed_submission', reason: 'Weekly submission missed grace window', points: policy.missed };
  };
  const submit = (state, week, position, draft, initiatives, now = new Date()) => {
    const error = validate(draft, initiatives);
    if (error) throw new Error(error);
    if (week > weekOf(now)) throw new Error('You can save a future draft; submit it when that week begins.');
    const next = saveDraft(state, week, position, draft), record = next.records[key(week, position)];
    const firstAt = record.submitted?.firstAt || now.toISOString();
    record.submitted = { firstAt, updatedAt: now.toISOString(), snapshot: { ...clone(draft), entries: draft.entries.filter(e => e.title.trim()).map((e, index) => ({ ...clone(e), rank: index + 1 })) } };
    const eventId = `${week}:${position}:weekly-score`, event = scoreEvent(week, draft.capacity, firstAt);
    const existing = next.events.find(e => e.id === eventId);
    if (!existing) next.events.push({ id: eventId, week, position, recordedAt: firstAt, ...event });
    else if (millis(now) <= millis(deadline(week)) && millis(firstAt) <= millis(deadline(week))) Object.assign(existing, event, { updatedAt: now.toISOString() });
    return next;
  };
  const assessMissed = (state, week, positions, now = new Date()) => {
    if (millis(now) <= millis(graceEnd(week))) throw new Error('Missed submissions are assessed after Monday at 9 a.m. Eastern.');
    const next = clone(state);
    for (const item of positions) {
      const position = typeof item === 'string' ? item : item.id, eventId = `${week}:${position}:weekly-score`;
      if (!next.records[key(week, position)]?.submitted && !next.events.some(e => e.id === eventId)) {
        next.events.push({ id: eventId, week, position, type: 'missed_submission', reason: 'Weekly submission missed grace window', recordedAt: now.toISOString(), points: policy.missed });
      }
    }
    return next;
  };
  const score = (state, position) => policy.startingPoints + state.events.filter(e => e.position === position).reduce((sum, e) => sum + e.points, 0);
  const carry = (draft, fromWeek, toWeek, position) => ({ capacity: '', note: '', entries: draft.entries.map(e => ({
    ...clone(e), id: crypto.randomUUID(), carriedFrom: e.id, owner: position, status: 'watch', due: addDays(toWeek, 4),
    tasks: e.tasks.filter(t => !['complete', 'cancelled'].includes(t.status)).map(t => ({ ...t, id: crypto.randomUUID(), carriedFrom: t.id, due: addDays(toWeek, 4), status: 'open' })),
  })) });
  globalThis.CompassWeeklyModel = { zone, policy, clone, day, addDays, weekOf, deadline, graceEnd, key, empty, freshDraft, entry, validate, saveDraft, submit, assessMissed, score, carry };
})();
