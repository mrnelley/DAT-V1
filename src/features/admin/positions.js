const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roles=[['executive','Executive'],['elt','ELT'],['director','OLT Director'],['staff','Department staff'],['external','Board / External']];
const features=[['strategic','2030 Plan Scorecard'],['annual','Annual Scorecard'],['metrics','Record progress'],['weekly','Weekly Accountability'],['learn','Learn']];

export async function mountPositions(panel,store,roster,onChanged=()=>{}){
 let data=await store.positions(),selected=null,dirty=false;
 const guard=()=>!dirty||confirm('Discard unsaved position changes?');
 function draw(){
  panel.innerHTML=`<h3>Positions</h3><p>Set up a workspace now. Connect a person when ready.</p><button class="primary-button" id="new-position">Create position</button><div class="admin-grid">${data.positions.map(p=>`<button class="linked" data-position="${esc(p.id)}"><strong>${esc(p.title)}</strong><span>${p.occupants.length?`${p.occupants.length} assigned`:'Vacant'} · ${esc(p.department||'Organization')} · ${p.active?'Active':'Archived'}</span></button>`).join('')}</div><div id="position-editor"></div>`;
  panel.querySelector('#new-position').onclick=()=>{if(guard())edit(null);};
  panel.querySelectorAll('[data-position]').forEach(b=>b.onclick=()=>{if(guard())edit(data.positions.find(p=>p.id===b.dataset.position));});
 }
 function edit(p){selected=p;dirty=false;const editor=panel.querySelector('#position-editor');
  editor.innerHTML=`<form class="entry-form" id="position-form"><h3>${p?'Edit position':'New position'}</h3><label>Position title<input name="title" value="${esc(p?.title)}" maxlength="150" required></label><label>Department<select name="department"><option value="">Organization-wide</option>${roster.departments.map(d=>`<option ${d===p?.department?'selected':''}>${esc(d)}</option>`).join('')}</select></label><fieldset><legend>Position roles</legend>${roles.map(([id,label])=>`<label class="check"><input type="checkbox" name="roles" value="${id}" ${(p?.roles||['staff']).includes(id)?'checked':''}>${label}</label>`).join('')}</fieldset><label>Scorecard access<select name="readScorecards"><option value="" ${p?.read_scorecards==null?'selected':''}>Role default</option><option value="true" ${p?.read_scorecards===true?'selected':''}>Allow</option><option value="false" ${p?.read_scorecards===false?'selected':''}>Deny</option></select></label><fieldset><legend>Workspace navigation</legend>${features.map(([key,label])=>`<label>${label}<select name="feature-${key}"><option value="" ${p?.features?.[key]==null?'selected':''}>Role default</option><option value="true" ${p?.features?.[key]===true?'selected':''}>Show</option><option value="false" ${p?.features?.[key]===false?'selected':''}>Hide</option></select></label>`).join('')}</fieldset><label class="check"><input name="active" type="checkbox" ${p?.active!==false?'checked':''}>Active position</label><p>Assign metric access in Metric governance. Connect people in Users. Executive, ELT and Director positions require weekly submissions once occupied by a confirmed account.</p><button class="primary-button" type="submit">Save position</button><p role="status"></p></form>`;
  const form=editor.querySelector('form');form.oninput=()=>{dirty=true;};form.onsubmit=async e=>{e.preventDefault();const f=new FormData(form),result=form.querySelector('[role="status"]'),button=form.querySelector('button');
   const chosen=f.getAll('roles');if(!chosen.length){result.textContent='Choose at least one position role.';return;}
   const visibility={...(selected?.features||{})};for(const [key] of features){const v=f.get('feature-'+key);if(v==='')delete visibility[key];else visibility[key]=v==='true';}
   button.disabled=true;
   try{const saved=await store.savePosition({id:selected?.id,title:f.get('title'),department:f.get('department'),roles:chosen,features:visibility,readScorecards:f.get('readScorecards')===''?null:f.get('readScorecards')==='true',active:f.has('active'),expectedRevision:selected?.revision??null});
    data=await store.positions();dirty=false;await onChanged();draw();edit(data.positions.find(p=>p.id===saved.id));panel.querySelector('[role="status"]').textContent='Position saved.';
   }catch(error){result.textContent=error.message;button.disabled=false;}
  };
 }
 draw();
}

export async function mountMetricGovernance(panel,store,roster){
 let data=await store.positions(),metricId=data.metrics[0]?.id,department='',dirty=false;
 const guard=()=>!dirty||confirm('Discard unsaved metric assignments?');
 function draw(){
  const metric=data.metrics.find(m=>m.id===metricId);if(!metric){panel.textContent='No metric definitions available.';return;}
  department=metric.department||department||roster.departments[0];
  panel.innerHTML=`<h3>Metric governance</h3><p>Choose which positions can view and record each measure.</p><label class="field">Measure<select id="governance-metric">${data.metrics.map(m=>`<option value="${m.id}" ${m.id===metricId?'selected':''}>${esc(m.name)} · ${esc(m.department||m.tracking_area)}</option>`).join('')}</select></label><label class="field">Reporting department<select id="governance-department" ${metric.department?'disabled':''}>${roster.departments.map(d=>`<option ${d===department?'selected':''}>${esc(d)}</option>`).join('')}</select></label><form class="entry-form" id="governance-form"><div class="admin-table-wrap"><table><thead><tr><th>Position</th><th>View</th><th>Record updates</th></tr></thead><tbody>${data.positions.filter(p=>p.active).map(p=>{const g=data.grants.find(g=>g.metric_id===metricId&&g.department===department&&g.position_id===p.id);return `<tr><th>${esc(p.title)}</th><td><input type="checkbox" name="read" value="${esc(p.id)}" aria-label="${esc(p.title)}: view" ${g?'checked':''}></td><td><input type="checkbox" name="write" value="${esc(p.id)}" aria-label="${esc(p.title)}: record updates" ${g?.can_write?'checked':''}></td></tr>`;}).join('')}</tbody></table></div><p>Scorecard access can separately allow leadership to read organization-wide measures. Recording updates requires an assignment here. System Admin retains full access.</p><button class="primary-button">Save metric assignments</button><p role="status"></p></form>`;
  const form=panel.querySelector('form');form.onchange=e=>{dirty=true;if(e.target.name==='write'&&e.target.checked)e.target.closest('tr').querySelector('[name="read"]').checked=true;if(e.target.name==='read'&&!e.target.checked)e.target.closest('tr').querySelector('[name="write"]').checked=false;};
  panel.querySelector('#governance-metric').onchange=e=>{if(!guard()){e.target.value=metricId;return;}metricId=e.target.value;dirty=false;draw();};
  panel.querySelector('#governance-department').onchange=e=>{if(!guard()){e.target.value=department;return;}department=e.target.value;dirty=false;draw();};
  form.onsubmit=async e=>{e.preventDefault();const f=new FormData(form),writes=f.getAll('write'),result=form.querySelector('[role="status"]'),button=form.querySelector('button');button.disabled=true;
   try{await store.setMetricPositions({metricId,department,expectedRevision:metric.governance_revision,positions:f.getAll('read').map(positionId=>({positionId,canWrite:writes.includes(positionId)}))});data=await store.positions();dirty=false;draw();panel.querySelector('[role="status"]').textContent='Metric assignments saved.';}catch(error){result.textContent=error.message;button.disabled=false;}
  };
 }
 draw();
}
