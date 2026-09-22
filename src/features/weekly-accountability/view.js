(() => {
  const M=window.CompassWeeklyModel;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const option=(id,title,value)=>`<option value="${esc(id)}" ${id===value?'selected':''}>${esc(title)}</option>`;
  const instant=v=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/New_York',timeZoneName:'short'}).format(new Date(v));
  let root, data, selected='', view='mine', draft, dirty=false, busy=false, generation=0, correctionReason='';
  const maxPriorities=12;
  const store=()=>window.CompassMetricStore;
  const record=()=>data.records.find(r=>r.positionId===selected);
  const position=()=>data.positions.find(p=>p.id===selected);
  const active=()=>document.querySelector('[data-surface="weekly"][aria-pressed="true"]');
  const fresh=()=>({capacity:'',note:'',entries:[]});
  function actionDetails(e){return `${e.projectReference?`<p>Project or workplan: ${esc(e.projectReference)}</p>`:''}${e.tasks.length?`<details><summary>View action items</summary><ul>${e.tasks.map(t=>`<li><strong>${esc(t.title)}</strong><p>${esc(data.positions.find(p=>p.id===t.owner)?.title||t.owner)} · Due ${esc(t.due)} · ${esc(t.status.replaceAll('_',' '))}</p></li>`).join('')}</ul></details>`:''}`;}
  const entry=()=>({id:crypto.randomUUID(),title:'',desiredResult:'',objectiveId:'',projectReference:'',due:M.addDays(data.week,4),status:'good',support:'',tasks:[]});
  function resetDraft(){draft=structuredClone(record()?.draft||fresh());dirty=false;correctionReason='';}
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
  function formEntry(e,i){return `<section class="entry-form" aria-labelledby="priority-heading-${i}"><div class="entry-heading"><h3 id="priority-heading-${i}">Priority ${i+1}</h3><button type="button" class="quiet-button" data-remove="${i}">Remove priority</button></div><div class="form-grid">${field(e,i,'title','Weekly priority')}${area(e,i,'desiredResult','Desired result')}<label class="field span-two">Enterprise objective<select data-entry="${i}" data-field="objectiveId"><option value="">Department work only</option>${data.objectives.map(o=>option(o.id,`${o.title} · ${o.period}`,e.objectiveId)).join('')}</select></label>${field(e,i,'projectReference','Project or workplan reference (optional)')}${field(e,i,'due','Due date','date')}<label class="field">Progress<select data-entry="${i}" data-field="status">${[['good','On track'],['watch','Watch'],['risk','Off track']].map(([v,l])=>option(v,l,e.status)).join('')}</select></label>${area(e,i,'support','Support or risk')}</div><h4>Action items</h4>${e.tasks.map((t,j)=>`<div class="task-form"><label class="field span-two">Action item<input data-entry="${i}" data-task="${j}" data-field="title" value="${esc(t.title)}" maxlength="250"></label><label class="field">Responsible position<select data-entry="${i}" data-task="${j}" data-field="owner">${data.positions.map(p=>option(p.id,p.title,t.owner)).join('')}</select></label><label class="field">Due date<input type="date" data-entry="${i}" data-task="${j}" data-field="due" value="${esc(t.due)}"></label><label class="field">Status<select data-entry="${i}" data-task="${j}" data-field="status">${['open','in_progress','complete','blocked','cancelled'].map(s=>option(s,s.replaceAll('_',' '),t.status)).join('')}</select></label><button type="button" class="quiet-button" data-remove-task="${j}" data-parent="${i}">Remove action item</button></div>`).join('')}<button type="button" class="quiet-button" data-add-task="${i}">Add action item</button></section>`;}
  function mine(){
    if(!position()?.canEdit)return '<p>Select an assigned position to edit, or use Team rollup to review submissions.</p>';
    const r=record();
    return `<div class="weekly-layout"><form id="weekly-form" class="weekly-panel"><fieldset class="capacity"><legend>Can you prioritize an enterprise initiative this week?</legend><label><input type="radio" name="capacity" value="enterprise" ${draft.capacity==='enterprise'?'checked':''}> Yes, I can make an enterprise commitment.</label><label><input type="radio" name="capacity" value="capacity" ${draft.capacity==='capacity'?'checked':''}> I can’t prioritize an enterprise initiative this week.</label></fieldset><label class="field">Context (optional)<textarea name="note" maxlength="2000">${esc(draft.note)}</textarea></label>${draft.entries.map(formEntry).join('')}<div class="priority-expansion"><button type="button" class="add-priority-button" data-add ${draft.entries.length>=maxPriorities?'disabled':''} aria-describedby="priority-count"><span aria-hidden="true">+</span> Add priority</button><p id="priority-count" class="weekly-note" role="status">${draft.entries.length} of ${maxPriorities} priorities${draft.entries.length>=maxPriorities?' � Weekly limit reached':''}</p></div><div class="form-footer"><button type="button" class="quiet-button" data-carry>Bring forward last week</button></div><label class="field">Correction reason (required after grace)<input name="correctionReason" maxlength="1000" value="${esc(correctionReason)}"></label><p class="weekly-note">${r?.firstAt?`Submitted ${esc(instant(r.firstAt))}. ${r.revision!==r.submittedRevision?'Unpublished draft changes.':''}`:'Not yet submitted.'}</p><div class="form-footer"><button type="button" class="quiet-button" data-save-draft>Save draft</button><button type="submit" class="primary-button">${r?.firstAt?'Update submission':'Submit this week'}</button></div></form><aside class="weekly-side"><section class="weekly-panel"><p class="eyebrow">Position points</p><div class="score-value">${position().points??'—'}</div><p>Starts at 100 and carries forward.</p><dl><dt>On-time enterprise priority</dt><dd>+5</dd><dt>On-time opt-out</dt><dd>0</dd><dt>Submitted during grace</dt><dd>−3</dd><dt>Missed after grace</dt><dd>−10</dd></dl><p class="weekly-note">Grace ends ${esc(instant(data.boundaries.grace_at))}. Edits do not earn a second award.</p></section></aside></div>`;
  }
  function rollup(){return `<div class="rollup-list">${data.positions.map(p=>{
    const r=data.records.find(x=>x.positionId===p.id),s=r?.submitted;
    const status=r?.exempt?'Exempt':s?(s.capacity==='capacity'?'No enterprise capacity':'Submitted'):r?.expected?'Not submitted':'No required submission';
    return `<article class="rollup-card"><h3>${esc(p.title)}</h3><p>${esc(status)}${r?.firstAt?' · '+esc(instant(r.firstAt)):''}</p>${s?`<p>${esc(s.note)}</p>${s.entries.map(e=>`<div class="rollup-entry"><strong>${esc(e.title)}</strong><p>${esc(e.desiredResult)}</p><p>${esc(data.objectives.find(o=>o.id===e.objectiveId)?.title||'Department work')} · Due ${esc(e.due)}</p><p>${e.tasks.filter(t=>t.status==='complete').length} / ${e.tasks.length} action items complete</p>${actionDetails(e)}${e.support?`<p>Support: ${esc(e.support)}</p>`:''}</div>`).join('')}`:''}${r?.draft&&r.revision!==r.submittedRevision?'<p class="weekly-note">Unpublished draft exists.</p>':''}</article>`;
    }).join('')}</div>`;}
  function review(){return `<section class="weekly-panel"><h3>${esc(data.week.slice(0,4))} position review</h3><div class="review-table"><table><thead><tr><th>Position</th><th>Year change</th><th>Current points</th></tr></thead><tbody>${data.positions.filter(p=>p.points!==null).map(p=>`<tr><td>${esc(p.title)}</td><td>${data.events.filter(e=>e.positionId===p.id).reduce((s,e)=>s+e.points,0)}</td><td>${p.points}</td></tr>`).join('')}</tbody></table></div><p>Annual totals follow the cycle’s Monday date. Points never reset automatically.</p></section>`;}
  function render(){
    root.innerHTML=`<div id="weekly-workspace"><div class="hero"><div><h2>Weekly accountability</h2><p>Due ${esc(instant(data.boundaries.deadline_at))}</p></div></div><div class="weekly-toolbar"><div class="weekly-controls"><label class="field">Week beginning<input type="date" id="weekly-week" value="${esc(data.week)}" min="${esc(data.startsOn)}" step="7"></label><label class="field">Position<select id="weekly-position">${data.positions.map(p=>option(p.id,p.title,selected)).join('')}</select></label></div><nav class="weekly-subnav" aria-label="Weekly views">${[['mine','My priorities'],['rollup','Team rollup'],['review','Annual review']].map(([id,label])=>`<button type="button" class="quiet-button" data-view="${id}" aria-pressed="${view===id}">${label}</button>`).join('')}</nav></div><div id="weekly-message" class="weekly-message" role="status" hidden></div>${view==='mine'?mine():view==='rollup'?rollup():review()}</div>`;
    const form=root.querySelector('#weekly-form');
    if(form){form.oninput=()=>{dirty=true;};form.onchange=()=>{dirty=true;};form.onsubmit=e=>{e.preventDefault();save(true);};}
    if(form&&store().workspaceSession?.()?.allowWrites===false){
      form.querySelector('[type="submit"]').disabled=true;form.querySelector('[data-save-draft]').disabled=true;
      message('Viewing only. Return to Admin and enable saving to test changes.');
    }
    root.querySelector('#weekly-week').onchange=async e=>{if(dirty&&!confirm('Discard unsaved changes?')){e.target.value=data.week;return;}await load(e.target.value);};
    root.querySelector('#weekly-position').onchange=e=>{if(dirty&&!confirm('Discard unsaved changes?')){e.target.value=selected;return;}selected=e.target.value;resetDraft();render();};
    root.querySelector('#weekly-workspace').onclick=async event=>{
      const b=event.target.closest('button');if(!b||b.disabled||busy)return;
      if(b.dataset.view){collect();view=b.dataset.view;render();return;}
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
    const payload={positionId:selected,week:data.week,expectedRevision:record()?.revision||0,draft:structuredClone(draft),correctionReason};
    busy=true;root.querySelectorAll('input,textarea,select,button').forEach(el=>el.disabled=true);
    try{await store().saveWeekly(payload,finalizing);dirty=false;await load(data.week);message(finalizing?'Submitted to Compass.':'Draft saved to Compass.');}
    catch(error){render();message(error.message,true);}
    finally{busy=false;}
  }
  async function load(week){
    const token=++generation;
    try{
      const result=await store().weekly(week);if(token!==generation||!active())return;
      data=result;if(!data.positions.some(p=>p.id===selected))selected=data.positions.find(p=>p.title===data.positionTitle)?.id||data.positions.find(p=>p.canEdit)?.id||data.positions[0]?.id||'';
      resetDraft();render();
    }catch(error){if(root.querySelector('#weekly-message'))message(error.message,true);else root.innerHTML=`<p role="alert">${esc(error.message)}</p>`;}
  }
  window.CompassWeekly={async mount(target){
    root=target;root.innerHTML='<p role="status">Loading weekly accountability…</p>';
    try{if(!store()||!await store().session()){root.innerHTML='<p>Sign in through Record progress to access weekly accountability.</p>';return;}await load();}
    catch(error){root.innerHTML=`<p role="alert">${esc(error.message)}</p>`;}
  },selectInitiative(){}};
  document.addEventListener('click',event=>{const tab=event.target.closest('[data-surface]');if(tab&&tab.dataset.surface!=='weekly'&&active()){
    if(busy||(dirty&&!confirm('Discard unsaved weekly changes?'))){event.preventDefault();event.stopImmediatePropagation();}
    else{dirty=false;generation++;}
  }},true);
})();
