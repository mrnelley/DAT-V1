(() => {
  const M=window.CompassWeeklyModel;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const option=(id,title,value)=>`<option value="${esc(id)}" ${id===value?'selected':''}>${esc(title)}</option>`;
  const instant=v=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/New_York',timeZoneName:'short'}).format(new Date(v));
  let root, data, selected='', workingPosition='', view='rollup', draft, dirty=false, busy=false, generation=0, correctionReason='', draftRevision=0, refreshedAt=null, loading=false, departmentFilter='', search='';
  const maxPriorities=12;
  const actionStatusLabel=status=>status==='blocked'?'Stuck':status.replaceAll('_',' ');
  const store=()=>window.CompassMetricStore;
  const record=()=>data.records.find(r=>r.positionId===selected);
  const position=()=>data.positions.find(p=>p.id===selected);
  const active=()=>document.querySelector('[data-surface="weekly"][aria-pressed="true"]');
  const fresh=()=>({capacity:'',note:'',entries:[]});
  function actionDetails(e){return `${e.projectReference?`<p>Project or workplan: ${esc(e.projectReference)}</p>`:''}${e.tasks.length?`<details><summary>View action items</summary><ul>${e.tasks.map(t=>`<li><strong>${esc(t.title)}</strong><p>${esc(data.positions.find(p=>p.id===t.owner)?.title||t.owner)} · Due ${esc(t.due)} · ${esc(actionStatusLabel(t.status))}</p></li>`).join('')}</ul></details>`:''}`;}
  const entryType=e=>e.commitmentType||(e.objectiveId?'enterprise':'department');
  const entry=()=>({id:crypto.randomUUID(),title:'',desiredResult:'',commitmentType:draft.capacity==='capacity'?'department':'enterprise',objectiveId:'',departmentPriorityId:'',projectReference:'',due:M.addDays(data.week,4),status:'good',support:'',tasks:[]});
  function resetDraft(){draft=structuredClone(record()?.draft||fresh());draftRevision=record()?.revision||0;for(const e of draft.entries)e.commitmentType=entryType(e);dirty=false;correctionReason='';}
  const dateLabel=value=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
  const progressLabels={good:'On track',watch:'Watch',risk:'Off track',not_started:'Not started'};
  const sharedDocument=r=>r?.submitted;

  function departmentOptions(value){
    const rows=(data.departmentalObjectives||[]).filter(o=>o.active!==false||o.id===value);
    const own=position()?.department;
    const departments=[...new Set(rows.map(o=>o.department))].sort((a,b)=>a===own?-1:b===own?1:a.localeCompare(b));
    return departments.map(department=>`<optgroup label="${esc(department)}">${rows.filter(o=>o.department===department).sort((a,b)=>a.title.localeCompare(b.title)).map(o=>option(o.id,o.title+(o.active===false?' (retired)':''),value)).join('')}</optgroup>`).join('');
  }
  function commitmentFields(e,i){
    const type=entryType(e);
    return `<label class="field span-two">Priority supports<select data-entry="${i}" data-field="commitmentType">${option('enterprise','Enterprise priority',type)}${option('department','Department workplan priority',type)}</select></label>${type==='enterprise'?`<label class="field span-two">Enterprise objective<select data-entry="${i}" data-field="objectiveId"><option value="">Choose an enterprise objective</option>${data.objectives.map(o=>option(o.id,`${o.title} · ${o.period}`,e.objectiveId)).join('')}</select></label>`:`<label class="field span-two">${esc(data.week.slice(0,4))} department workplan priority<select data-entry="${i}" data-field="departmentPriorityId"><option value="">Choose a department workplan priority</option>${departmentOptions(e.departmentPriorityId)}</select></label>`}`;
  }
  function commitmentLabel(e){
    if(e.objectiveId)return data.objectives.find(o=>o.id===e.objectiveId)?.title||'Enterprise priority';
    const work=(data.departmentalObjectives||[]).find(o=>o.id===e.departmentPriorityId);
    return work?`${work.department} · ${work.title}`:'Department work';
  }
  function message(text,error=false){const el=root.querySelector('#weekly-message');if(el){el.hidden=!text;el.textContent=text;el.classList.toggle('error',error);}}
  function collect(){
    const form=root.querySelector('#weekly-form');if(!form)return;
    draft.capacity=form.querySelector('[name="capacity"]:checked')?.value||'';
    draft.note=form.elements.note.value;
    correctionReason=form.elements.correctionReason.value;
    for(const field of form.querySelectorAll('[data-entry][data-field]')){
      const e=draft.entries[Number(field.dataset.entry)];
      const target=field.dataset.task===undefined?e:e.tasks[Number(field.dataset.task)];target[field.dataset.field]=field.value;
    }
  }
  const field=(e,i,key,label,type='text')=>`<label class="field">${label}<input data-entry="${i}" data-field="${key}" type="${type}" value="${esc(e[key])}" maxlength="250"></label>`;
  const area=(e,i,key,label)=>`<label class="field span-two">${label}<textarea data-entry="${i}" data-field="${key}" maxlength="2000">${esc(e[key])}</textarea></label>`;
  function formEntry(e,i){return `<section class="entry-form" aria-labelledby="priority-heading-${i}"><div class="entry-heading"><h3 id="priority-heading-${i}">Priority ${i+1}</h3><button type="button" class="quiet-button" data-remove="${i}">Remove priority</button></div><div class="form-grid">${field(e,i,'title','Weekly priority')}${area(e,i,'desiredResult','Desired result')}${commitmentFields(e,i)}${field(e,i,'projectReference','Project or workplan reference (optional)')}${field(e,i,'due','Due date','date')}<label class="field">Progress<select data-entry="${i}" data-field="status">${[['good','On track'],['watch','Watch'],['risk','Off track']].map(([v,l])=>option(v,l,e.status)).join('')}</select></label>${area(e,i,'support','Support or risk')}</div><h4>Action items</h4>${e.tasks.map((t,j)=>`<div class="task-form"><label class="field span-two">Action item<input data-entry="${i}" data-task="${j}" data-field="title" value="${esc(t.title)}" maxlength="250"></label><label class="field">Responsible position<select data-entry="${i}" data-task="${j}" data-field="owner">${data.positions.map(p=>option(p.id,p.title,t.owner)).join('')}</select></label><label class="field">Due date<input type="date" data-entry="${i}" data-task="${j}" data-field="due" value="${esc(t.due)}"></label><label class="field">Status<select data-entry="${i}" data-task="${j}" data-field="status">${['open','in_progress','complete','blocked','cancelled'].map(s=>option(s,actionStatusLabel(s),t.status)).join('')}</select></label><button type="button" class="quiet-button" data-remove-task="${j}" data-parent="${i}">Remove action item</button></div>`).join('')}<button type="button" class="quiet-button" data-add-task="${i}">Add action item</button></section>`;}
  function mine(){
    if(!position()?.canEdit)return '<p>Select an assigned position to edit, or use Everyone’s priorities to review submissions.</p>';
    const r=record();
    return `<div class="weekly-layout"><form id="weekly-form" class="weekly-panel"><fieldset class="capacity"><legend>Can you prioritize an enterprise initiative this week?</legend><label><input type="radio" name="capacity" value="enterprise" ${draft.capacity==='enterprise'?'checked':''}> Yes, I can make an enterprise commitment.</label><label><input type="radio" name="capacity" value="capacity" ${draft.capacity==='capacity'?'checked':''}> I can’t prioritize an enterprise initiative this week.</label></fieldset><label class="field">Context (optional)<textarea name="note" maxlength="2000">${esc(draft.note)}</textarea></label>${draft.entries.map(formEntry).join('')}<div class="priority-expansion"><button type="button" class="add-priority-button" data-add ${draft.entries.length>=maxPriorities?'disabled':''} aria-describedby="priority-count"><span aria-hidden="true">+</span> Add priority</button><p id="priority-count" class="weekly-note" role="status">${draft.entries.length} of ${maxPriorities} priorities${draft.entries.length>=maxPriorities?' · Weekly limit reached':''}</p></div><div class="form-footer"><button type="button" class="quiet-button" data-carry>Bring forward last week</button></div><label class="field">Correction note (optional)<input name="correctionReason" maxlength="1000" value="${esc(correctionReason)}"></label><p class="weekly-note">${r?.firstAt?`Submitted ${esc(instant(r.firstAt))}. ${r.revision!==r.submittedRevision?'Unpublished draft changes.':''}`:'Not yet submitted.'}</p><div class="form-footer"><button type="button" class="quiet-button" data-save-draft>Save draft</button><button type="submit" class="primary-button">${r?.firstAt?'Update submission':'Submit this week'}</button></div></form><aside class="weekly-side"><section class="weekly-panel"><p class="eyebrow">Position points</p><div class="score-value">${position().points??'—'}</div><p>Starts at 100 and carries forward.</p><dl><dt>On-time enterprise priority</dt><dd>+5</dd><dt>On-time department workplan priority</dt><dd>+3</dd><dt>On-time opt-out without priorities</dt><dd>0</dd><dt>Submitted during grace</dt><dd>−3</dd><dt>Missed after grace</dt><dd>−10</dd></dl><p class="weekly-note">Grace ends ${esc(instant(data.boundaries.grace_at))}. One award per week: +5 for enterprise work, otherwise +3 for departmental work. Edits do not earn a second award.</p></section></aside></div>`;
  }
  function boardCards(){
    const rows=data.positions.filter(p=>!departmentFilter||(p.department||'Organization-wide')===departmentFilter).map(p=>({p,r:data.records.find(x=>x.positionId===p.id)})).filter(({p,r})=>`${p.title} ${p.department||''} ${JSON.stringify(sharedDocument(r)||{})}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>Number(!!sharedDocument(b.r))-Number(!!sharedDocument(a.r))||a.p.title.localeCompare(b.p.title));
    return rows.length?rows.map(({p,r},index)=>{
      const s=sharedDocument(r),entries=s?.entries||[];
      const status=r?.exempt?'Exempt':s?(s.capacity==='capacity'&&!entries.length?'No enterprise capacity':'Submitted'):r?.expected?'Not submitted':'No priorities yet';
      return `<article class="rollup-card" style="--card-accent:${['var(--hdc-sky)','var(--hdc-sunshine)','var(--hdc-indigo)','var(--hdc-grass)'][index%4]}"><header class="rollup-head"><div class="position-monogram" aria-hidden="true">${esc(p.title.split(/[ ,]+/).filter(Boolean).slice(0,2).map(x=>x[0]).join(''))}</div><div class="rollup-owner"><p class="weekly-eyebrow">${esc(p.department||'Organization-wide')}</p><h3>${esc(p.title)}</h3></div><span class="submission-tag ${s?'submitted':'waiting'}">${esc(status)}</span></header>${s?.note?`<p class="rollup-context">${esc(s.note)}</p>`:''}${entries.map((e,i)=>`<section class="rollup-entry"><div class="priority-heading"><span class="priority-number">${i+1}</span><h4>${esc(e.title||'Untitled priority')}</h4><span class="priority-progress ${Object.hasOwn(progressLabels,e.status)?e.status:'pending'}">${esc(progressLabels[e.status]||'Not assessed')}</span></div><p class="priority-result">${esc(e.desiredResult||'Desired result to follow.')}</p><p class="priority-alignment"><span>${entryType(e)==='enterprise'?'Enterprise':'Department'}</span>${esc(commitmentLabel(e))}</p><div class="priority-meta"><span>Due ${esc(e.due||'Not set')}</span><span>${(e.tasks||[]).filter(t=>t.status==='complete').length} / ${(e.tasks||[]).length} action items complete</span></div>${actionDetails({...e,tasks:e.tasks||[]})}${e.support?`<p class="priority-support"><strong>Support needed</strong> ${esc(e.support)}</p>`:''}</section>`).join('')}${!entries.length?`<p class="board-empty-owner">${s?'No priority commitments recorded for this week.':'Their priorities will appear here when submitted.'}</p>`:''}<footer class="rollup-footer"><span>${r?.lastAt?'Updated '+esc(instant(r.lastAt)):r?.firstAt?'Submitted '+esc(instant(r.firstAt)):'Awaiting an update'}</span></footer></article>`;
    }).join(''):'<div class="board-empty"><h3>No matching priorities</h3><p>Try another department or search term.</p></div>';
  }
  function rollup(){
    const docs=data.records.map(sharedDocument).filter(Boolean),entries=docs.flatMap(s=>s.entries||[]),tasks=entries.flatMap(e=>e.tasks||[]);
    return `<section class="weekly-board" aria-label="Everyone’s priorities"><div class="board-summary"><div><strong>${entries.length}</strong><span>Priorities in focus</span></div><div><strong>${docs.length}<small> / ${data.positions.length}</small></strong><span>Positions sharing work</span></div><div><strong>${tasks.filter(t=>t.status==='complete').length}<small> / ${tasks.length}</small></strong><span>Actions completed</span></div></div><div class="board-filterbar"><label class="field board-search">Find a priority or position<input id="weekly-search" type="search" placeholder="Search the week…" value="${esc(search)}"></label><label class="field">Department<select id="weekly-department"><option value="">All departments</option>${[...new Set(data.positions.map(p=>p.department||'Organization-wide'))].sort().map(d=>option(d,d,departmentFilter)).join('')}</select></label></div><div class="rollup-list" id="weekly-board-cards">${boardCards()}</div></section>`;
  }
  function review(){return `<section class="weekly-panel"><h3>${esc(data.week.slice(0,4))} position scoreboard</h3><div class="review-table"><table><thead><tr><th>Position</th><th>Points this year</th><th>Current points</th></tr></thead><tbody>${data.positions.filter(p=>p.points!==null).map(p=>`<tr><td>${esc(p.title)}</td><td>${data.events.filter(e=>e.positionId===p.id).reduce((s,e)=>s+e.points,0)}</td><td>${p.points}</td></tr>`).join('')}</tbody></table></div><p>Annual totals follow the cycle’s Monday date. Points never reset automatically.</p></section>`;}
  function render(){
    root.innerHTML=`<div id="weekly-workspace"><div class="weekly-hero"><div><p class="weekly-eyebrow">Our week, together</p><h2>${view==='rollup'?'Everyone’s priorities':view==='mine'?'Make room for what matters.':'Position scoreboard'}</h2><p>See the work. Find the connections. Move it forward.</p><span class="weekly-deadline">Commitments due ${esc(instant(data.boundaries.deadline_at))}</span></div><div class="weekly-hero-week"><span>Week of</span><strong>${esc(dateLabel(data.week))}</strong><span>through ${esc(dateLabel(M.addDays(data.week,4)))}</span></div></div><div class="weekly-toolbar"><nav class="weekly-subnav" aria-label="Weekly views">${[['rollup','Everyone’s priorities'],['mine','My priorities'],['review','Position scoreboard']].map(([id,label])=>`<button type="button" class="quiet-button" data-view="${id}" aria-pressed="${view===id}">${label}</button>`).join('')}</nav><div class="weekly-freshness"><span id="weekly-refreshed" role="status">${loading?'Refreshing…':refreshedAt?'Refreshed '+esc(instant(refreshedAt)):''}</span><button type="button" class="quiet-button" data-refresh ${loading?'disabled':''}>↻ Refresh</button></div></div><div class="weekly-controls"><div class="week-picker"><button type="button" class="quiet-button" data-week-step="-7" aria-label="Previous week">←</button><label class="field">Week beginning<input type="date" id="weekly-week" value="${esc(data.week)}" step="7"></label><button type="button" class="quiet-button" data-week-step="7" aria-label="Next week">→</button></div>${view==='mine'?`<label class="field">Your position<select id="weekly-position">${data.positions.filter(p=>p.canEdit||p.id===selected).map(p=>option(p.id,p.title,selected)).join('')}</select></label><p class="weekly-entry-hint">Save your draft, then submit to share your commitments.</p>`:''}</div><div id="weekly-message" class="weekly-message" role="status" hidden></div>${view==='mine'?mine():view==='rollup'?rollup():review()}</div>`;
    const form=root.querySelector('#weekly-form');
    if(form){form.oninput=()=>{dirty=true;};form.onchange=event=>{
      dirty=true;
      if(event.target.dataset.field==='commitmentType'){
        collect();const e=draft.entries[Number(event.target.dataset.entry)];
        if(e.commitmentType==='department')e.objectiveId='';else e.departmentPriorityId='';
        render();root.querySelector(`[data-entry="${event.target.dataset.entry}"][data-field="commitmentType"]`).focus();
      }
    };form.onsubmit=e=>{e.preventDefault();save(true);};}
    if(form&&store().workspaceSession?.()?.allowWrites===false){
      form.querySelector('[type="submit"]').disabled=true;form.querySelector('[data-save-draft]').disabled=true;
      message('Viewing only. Return to Admin and enable saving to test changes.');
    }
    root.querySelector('#weekly-week').onchange=async e=>{if(dirty&&!confirm('Discard unsaved changes?')){e.target.value=data.week;return;}await load(e.target.value);};
    const picker=root.querySelector('#weekly-position');if(picker)picker.onchange=e=>{if(dirty&&!confirm('Discard unsaved changes?')){e.target.value=selected;return;}selected=e.target.value;resetDraft();render();};
    const searchInput=root.querySelector('#weekly-search');if(searchInput)searchInput.oninput=e=>{search=e.target.value;root.querySelector('#weekly-board-cards').innerHTML=boardCards();};
    const filter=root.querySelector('#weekly-department');if(filter)filter.onchange=e=>{departmentFilter=e.target.value;root.querySelector('#weekly-board-cards').innerHTML=boardCards();};
    root.querySelector('#weekly-workspace').onclick=async event=>{
      const b=event.target.closest('button');if(!b||b.disabled||busy)return;
      if(b.dataset.view){collect();view=b.dataset.view;render();await load(data.week,true);return;}
      if(b.hasAttribute('data-refresh')){collect();await load(data.week,true);return;}
      if(b.dataset.weekStep){if(dirty&&!confirm('Discard unsaved changes?'))return;await load(M.addDays(data.week,Number(b.dataset.weekStep)));return;}
      if(b.hasAttribute('data-save-draft')){await save(false);return;}
      collect();
      if(b.hasAttribute('data-add')){
        if(draft.entries.length>=maxPriorities)return;
        draft.entries.push(entry());dirty=true;render();
        root.querySelector(`[data-entry="${draft.entries.length-1}"][data-field="title"]`).focus();
      }
      if(b.dataset.remove!==undefined){draft.entries.splice(Number(b.dataset.remove),1);dirty=true;render();root.querySelector('[data-add]').focus();}
      if(b.dataset.addTask!==undefined){draft.entries[Number(b.dataset.addTask)].tasks.push({id:crypto.randomUUID(),title:'',owner:selected,due:M.addDays(data.week,4),status:'open'});dirty=true;render();}
      if(b.dataset.removeTask!==undefined){draft.entries[Number(b.dataset.parent)].tasks.splice(Number(b.dataset.removeTask),1);dirty=true;render();}
      if(b.hasAttribute('data-carry')){
        busy=true;try{const prior=await store().weekly(M.addDays(data.week,-7));const priorDraft=prior.records.find(r=>r.positionId===selected)?.submitted;
          if(!priorDraft){message('No previous submission to bring forward.');return;}
          const carried=new Set(draft.entries.map(e=>e.carriedFrom));
          const additions=priorDraft.entries.filter(e=>!carried.has(e.id));
          if(draft.entries.length+additions.length>maxPriorities){message(`There are ${additions.length} priorities to bring forward. Remove enough current priorities to stay within the weekly limit of ${maxPriorities}.`,true);return;}
          for(const e of additions){draft.entries.push({...structuredClone(e),id:crypto.randomUUID(),carriedFrom:e.id,due:M.addDays(data.week,4),tasks:e.tasks.filter(t=>!['complete','cancelled'].includes(t.status)).map(t=>({...t,id:crypto.randomUUID(),carriedFrom:t.id,due:M.addDays(data.week,4)}))});}
          dirty=true;render();
        }catch(error){message(error.message,true);}finally{busy=false;}
      }
    };
  }
  async function save(finalizing){
    if(busy)return;collect();
    const payload={positionId:selected,week:data.week,expectedRevision:draftRevision,draft:structuredClone(draft),correctionReason};
    busy=true;root.querySelectorAll('input,textarea,select,button').forEach(el=>el.disabled=true);
    try{await store().saveWeekly(payload,finalizing);dirty=false;const loaded=await load(data.week);if(loaded)message(finalizing?'Submitted to Compass.':'Draft saved to Compass.');else message('Saved to Compass, but the latest data could not be loaded. Refresh before editing again.',true);}
    catch(error){render();message(error.message,true);}
    finally{busy=false;}
  }
  async function load(week,preserveDraft=false){
    const token=++generation,priorPosition=workingPosition,priorSelected=selected;loading=true;
    const refresh=root.querySelector('[data-refresh]');if(refresh)refresh.disabled=true;
    const indicator=root.querySelector('#weekly-refreshed');if(indicator)indicator.textContent='Refreshing…';
    try{
      const result=await store().weekly(week);if(token!==generation||!active())return false;
      if(preserveDraft)collect();
      data=result;if(workingPosition!==data.positionId||!data.positions.some(p=>p.id===selected))selected=data.positions.find(p=>p.id===data.positionId)?.id||data.positions.find(p=>p.title===data.positionTitle)?.id||data.positions.find(p=>p.canEdit)?.id||data.positions[0]?.id||'';
      workingPosition=data.positionId;
      if(!preserveDraft||!dirty||priorPosition!==workingPosition||priorSelected!==selected)resetDraft();
      refreshedAt=new Date().toISOString();loading=false;render();return true;
    }catch(error){if(token!==generation||!active())return false;loading=false;const currentRefresh=root.querySelector('[data-refresh]');if(currentRefresh)currentRefresh.disabled=false;const status=root.querySelector('#weekly-refreshed');if(status)status.textContent='Refresh failed · showing last loaded data';if(root.querySelector('#weekly-message'))message(error.message,true);else root.innerHTML=`<p role="alert">${esc(error.message)}</p>`;return false;}
  }
  window.CompassWeekly={async mount(target){
    const mountToken=++generation;root=target;data=null;view='rollup';dirty=false;busy=false;loading=false;search='';departmentFilter='';refreshedAt=null;root.innerHTML='<p role="status">Loading everyone’s priorities…</p>';
    try{const session=store()&&await store().session();if(mountToken!==generation)return;if(!session){root.innerHTML='<p>Sign in through Record progress to access weekly accountability.</p>';return;}await load();}
    catch(error){if(mountToken===generation)root.innerHTML=`<p role="alert">${esc(error.message)}</p>`;}
  },selectInitiative(){}};
  document.addEventListener('click',event=>{const tab=event.target.closest('[data-surface]');if(tab&&active()){
    if(busy||(dirty&&!confirm('Discard unsaved weekly changes?'))){event.preventDefault();event.stopImmediatePropagation();}
    else{dirty=false;generation++;}
  }},true);
})();
