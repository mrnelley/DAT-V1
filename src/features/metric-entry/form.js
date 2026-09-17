(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  let generation = 0;
  async function mount(root) {
    const generationId = ++generation;
    const store = window.CompassMetricStore;
    root.innerHTML = '<p role="status">Connecting to Compass…</p>';
    try {
      if (!store) throw new Error('Hosted client is unavailable. Refresh the page or rebuild the client.');
      if (!await store.session()) {
        window.dispatchEvent(new Event('compass-auth-required'));
        return;
      }
      const access = await store.context();
      if (generationId !== generation || !document.querySelector('[data-surface="metrics"][aria-pressed="true"]')) return;
      const metrics = access.metricDefinitions;
      root.innerHTML = `<div class="hero"><div><h2>Record progress</h2><p>${esc(access.positionTitle)} · Connected to Compass</p></div></div>
      <p class="note">Choose a reporting month and measure. Corrections retain the previous entry in the record history.</p>
      <form id="metric-entry" class="entry-form"><label>Department<select name="department">${access.departments.map(d=>`<option>${esc(d)}</option>`).join('')}</select></label>
      <label>Measure<select name="metric"></select></label>
      <label id="category-label" hidden>Contribution category<select name="category">${access.contributionCategories.map(c=>`<option value="${esc(c.id)}">${esc(c.label)}</option>`).join('')}</select></label>
      <p id="entry-context" class="note"></p><label>Reporting month<input name="period" type="month" required></label>
      <label><span id="value-label">Recorded value</span><input name="value" type="number" step="any" required></label>
      <label>Description / source<textarea name="description" rows="3" required></textarea></label>
      <p id="revision-note" hidden>Correcting a saved entry. The previous version will be retained.</p>
      <div><button class="tab" type="submit">Save entry</button><button class="tab" type="button" id="cancel-edit" hidden>Cancel correction</button></div>
      <p id="entry-message" role="status" aria-live="polite"></p></form>
      <section><h3>Saved entries</h3><div id="entry-history" aria-live="polite"></div></section>`;
      const form = root.querySelector('#metric-entry'); const f = form.elements;
      const message = root.querySelector('#entry-message');
      const save = form.querySelector('[type="submit"]');
      let entries = [], editing = null, retry = null, historyGeneration = 0, saving = false;
      const now = new Date(); f.period.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      function context() {
        const revenue = f.metric.value === 'community-relations-1';
        root.querySelector('#category-label').hidden = !revenue; f.category.disabled = !revenue;
        if(revenue) f.value.min='0'; else f.value.removeAttribute('min');
        root.querySelector('#value-label').textContent = revenue ? 'Contribution amount (USD)' : 'Recorded value';
        root.querySelector('#entry-context').textContent = revenue ? 'Record each contribution once, with its category. It contributes to Contributed revenue total.'
          : f.metric.value==='finance-5' ? 'Finance · 2026 Financial resiliency · Excess cash to parent remains separately tracked.'
          : 'Recorded independently for this department. Enter the value from your source.';
        save.disabled = !access.writableDepartments.includes(f.department.value);
        if(save.disabled) message.textContent = 'Read-only access for this department.';
      }
      function cancel() { editing=null; retry=null; f.department.disabled=false; f.metric.disabled=false;
        root.querySelector('#revision-note').hidden=true; root.querySelector('#cancel-edit').hidden=true;
        f.value.value=''; f.description.value=''; save.textContent='Save entry'; context(); }
      async function history() {
        const historyId = ++historyGeneration; const department = f.department.value;
        const target=root.querySelector('#entry-history'); target.textContent='Loading saved entries…';
        try {
          const result = await store.list(department);
          if(historyId!==historyGeneration || generationId!==generation) return;
          entries=result;
          target.innerHTML=entries.length ? entries.map(e=>`<article class="note"><strong>${esc(e.label)}</strong><p>${esc(e.period)} · ${esc(e.value)}${e.categoryId ? ' USD' : ''} · Revision ${esc(e.revision)}</p><p>${esc(e.description)}</p>${access.writableDepartments.includes(department)?`<button class="tab" type="button" data-correct="${esc(e.id)}">Correct entry</button>`:''}</article>`).join('') : '<p>No entries for this department yet.</p>';
        } catch(error) { if(historyId===historyGeneration) target.textContent=error.message; }
      }
      async function department() {
        cancel(); message.textContent='';
        f.metric.innerHTML=metrics.filter(m=>!m.department||m.department===f.department.value).map(m=>`<option value="${esc(m.id)}">${esc(m.name)}${!m.department?' · cross-department':''}</option>`).join('');
        context(); await history();
      }
      f.department.onchange=department; f.metric.onchange=context;
      root.querySelector('#cancel-edit').onclick=cancel;
      root.querySelector('#entry-history').onclick=event=>{
        if(saving)return;
        const button=event.target.closest('[data-correct]'); if(!button)return;
        editing=entries.find(e=>e.id===button.dataset.correct); if(!editing)return;
        retry=null; f.metric.value=editing.metricId; f.period.value=editing.period; f.value.value=editing.value;
        f.description.value=editing.description; if(editing.categoryId) f.category.value=editing.categoryId;
        context(); f.department.disabled=true; f.metric.disabled=true;
        root.querySelector('#revision-note').hidden=false; root.querySelector('#cancel-edit').hidden=false;
        save.textContent='Save correction'; f.value.focus();
      };
      form.onsubmit=async event=>{
        event.preventDefault(); if(save.disabled)return;
        const revenue=f.metric.value==='community-relations-1'; const value=Number(f.value.value);
        if(!f.value.value.trim()||!Number.isFinite(value)||!f.description.value.trim()) { message.textContent='Enter a value and description.'; return; }
        const payload={metricId:f.metric.value,department:f.department.value,period:f.period.value,value,
          categoryId:revenue?f.category.value:null,description:f.description.value.trim()};
        const signature=JSON.stringify(payload);
        if(editing) {payload.id=editing.id;payload.expectedRevision=editing.revision;}
        else { if(!retry||retry.signature!==signature)retry={id:crypto.randomUUID(),signature}; payload.id=retry.id; }
        saving=true;
        for(const field of form.elements)field.disabled=true;
        message.textContent='Saving to Compass…';
        try { await store.save(payload); cancel(); message.textContent='Saved to Compass.'; await history(); }
        catch(error) { message.textContent=error.message.includes('one_metric_period') ? 'This measure already has an update for that month. Use Correct entry below.' : error.message; }
        finally {
          saving=false;
          for(const field of form.elements)field.disabled=false;
          context(); f.department.disabled=!!editing; f.metric.disabled=!!editing;
        }
      };
      await department();
    } catch(error) {
      root.innerHTML=`<p role="alert">${esc(error.message)}</p><button class="tab" id="metric-retry">Try again</button><button class="tab" id="metric-reset-session">Sign out</button>`;
      root.querySelector('#metric-retry').onclick=()=>mount(root);
      root.querySelector('#metric-reset-session').onclick=async()=>{ await store.signOut(); await mount(root); };
    }
  }
  window.CompassMetricEntry={mount};
})();
