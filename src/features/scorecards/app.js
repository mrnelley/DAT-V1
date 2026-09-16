import { mountCommandCenter } from '../admin/commandCenter.js';
import { describeAuthCallback } from '../metric-entry/authSession.js';
import { mountSignIn } from '../metric-entry/signInView.js';
import { pillars, strategicMetrics, departmentMetrics, quarterlyObjectives } from '../planning/catalog.js';
import { strategyAliases, strategyObjectives } from '../planning/strategyObjectives.js';
import { dictionaryTerms } from '../../data/learnDictionary.js';
import { annualRollups, strategicRollups, initiativeRollups, mixRollup } from './rollups.js';

const outlet=document.querySelector('#surface'),store=window.CompassMetricStore;
let root=outlet,authPhase='loading',sessionUser=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>v==null?'Not reported':new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(v);
const labels={good:'On track',watch:'Watch',risk:'Off track',pending:'Awaiting assessment'};
const badge=s=>`<span class="badge ${s}"><span class="dot"></span>${labels[s]}</span>`;
const monthNow=()=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',timeZone:'America/New_York'}).format(new Date()).replace(/^(\d{2})\/(\d{4})$/,'$2-$1');
let view=location.hash.slice(1)||'strategic',month=monthNow(),token=0,access=null,data=null,groups=[];
if(describeAuthCallback(location).active)view='strategic';
if(view==='record-progress')view='metrics';
if(!['strategic','annual','weekly','metrics','learn','admin'].includes(view))view='strategic';
const workspaceNav=document.querySelector('nav[aria-label="Compass"]');
const signOutButton=document.createElement('button');
signOutButton.type='button';signOutButton.className='quiet-button';signOutButton.textContent='Sign out';signOutButton.hidden=true;
document.querySelector('.account').append(signOutButton);
signOutButton.onclick=async()=>{signOutButton.disabled=true;try{await store.signOut();sessionUser=null;access=null;view='strategic';history.replaceState(null,'','/#strategic');await render();}catch(error){root.textContent=error.message;}finally{signOutButton.disabled=false;}};
const dialog=document.querySelector('#detail'),body=document.querySelector('#detail-body');
function detail(title,html){body.innerHTML=`<h2 id="detail-title" tabindex="-1">${esc(title)}</h2>${html}`;dialog.showModal();body.querySelector('h2').focus();}
document.querySelector('#close').onclick=()=>dialog.close();
function readings(ms){return ms.length?ms.map(m=>`<p><strong>${number(m.value)}</strong> · ${esc(m.department)}</p>`).join(''):'<p>No update for this reporting month.</p>';}
function targetText(t){return t.operator==='mix'?'33 / 33 / 33':t.operator==='benchmark'?'Above national average':`${({gt:'> ',gte:'≥ ',lt:'< ',lte:'≤ '})[t.operator]||''}${number(t.value)}${t.upper?'–'+t.upper:''} ${t.unit||''}`;}
async function identity(expected=token){
  const session=await store.session();if(expected!==token)return;
  sessionUser=session?.user?.id|| (session?'authenticated':null);
  if(!session){access=null;authPhase='signed-out';return;}
  authPhase='access-check';
  let nextAccess;
  try{nextAccess=await store.access();}catch{await store.context();nextAccess=await store.access();}
  if(expected!==token)return;
  access=nextAccess;authPhase='ready';
  document.querySelector('.account strong').textContent=access.positionTitle;
  document.querySelector('.account small').textContent='Connected to Compass';
  document.querySelector('[data-surface="admin"]').hidden=!access.admin;
  document.querySelector('[data-surface="weekly"]').hidden=!access.weekly;
  for(const key of ['strategic','annual','metrics','weekly','learn']){const b=document.querySelector(`[data-surface="${key}"]`);if(b)b.hidden=access.features?.[key]===false||(key==='weekly'&&!access.weekly)||(['strategic','annual','metrics'].includes(key)&&!access.metrics);}
}
function learn(){
  root.innerHTML=`<div class="hero"><div><h2>Learn</h2><p>Planning language and the work it connects.</p></div></div><nav class="tabs" aria-label="Learn"><button class="tab" data-learn="catalog">Planning catalog</button><button class="tab" data-learn="dictionary">Dictionary</button></nav><div id="learn-content"></div>`;
  const content=root.querySelector('#learn-content');
  const catalog=()=>{content.innerHTML=pillars.map(p=>`<article class="card learn-card"><h3>${esc(p.title)}</h3>${p.strategies.map(s=>`<details><summary>${esc(strategyAliases[s.id]||s.title)}</summary>${strategyObjectives.filter(o=>o.strategyId===s.id).map(o=>`<p>${esc(o.title)}</p>`).join('')}</details>`).join('')}<details><summary>2030 measures</summary>${strategicMetrics.filter(m=>m.pillarId===p.id).map(m=>`<p>${esc(m.name)} · ${esc(targetText(m.target))}</p>`).join('')}</details></article>`).join('')+`<article class="card learn-card"><h3>Quarterly priorities · Q3 2026</h3>${quarterlyObjectives.map(o=>`<p>${esc(o.title)}</p>`).join('')}</article>`;};
  root.querySelector('[data-learn="catalog"]').onclick=catalog;
  root.querySelector('[data-learn="dictionary"]').onclick=()=>{content.innerHTML='<label class="field">Find a term<input id="dictionary-search" type="search"></label><div id="terms"></div>';const render=()=>{const q=content.querySelector('input').value.toLowerCase();content.querySelector('#terms').innerHTML=dictionaryTerms.filter(t=>`${t.term} ${t.translation}`.toLowerCase().includes(q)).map(t=>`<article class="card learn-card"><h3>${esc(t.term)}</h3><p>${esc(t.translation||t.shortDefinition)}</p></article>`).join('')||'<p>No matching terms.</p>';};content.querySelector('input').oninput=render;render();};catalog();
}
async function admin(){
  const expected=token,roster=await store.members();if(view!=='admin'||expected!==token)return;
  const roles=['admin','executive','elt','director','staff','external'];
  root.innerHTML=`<div class="hero"><div><h2>Admin</h2><p>Manage positions and access.</p></div></div><p class="note">Create accounts here, assign access, and send invitations when ready.</p><label class="field">Account<select id="admin-user"><option value="">Choose an account</option>${roster.members.map(m=>`<option value="${esc(m.userId)}">${esc(m.email)} · ${esc(m.positionTitle||'Needs assignment')}</option>`).join('')}</select></label><div id="member-editor"></div>`;
  root.insertAdjacentHTML('beforeend',`<details class="card learn-card"><summary>Annual measure targets</summary><p>Set the approved comparison for a department measure. Values below a minimum or above a maximum receive a Watch signal.</p><form class="entry-form" id="target-form"><label>Year<input type="number" name="year" min="2026" max="2100" value="${month.slice(0,4)}" required></label><label>Measure<select name="metricId">${departmentMetrics.filter(m=>!/^community-relations-[2-5]$/.test(m.id)).map(m=>`<option value="${m.id}">${esc(m.department||m.trackingArea)} · ${esc(m.name)}</option>`).join('')}</select></label><label>Comparison<select name="operator"><option value="gte">At least</option><option value="gt">Greater than</option><option value="lte">At most</option><option value="lt">Less than</option></select></label><label>Target<input type="number" step="any" name="value" required></label><button class="primary-button" type="submit">Save target</button><p role="status" id="target-result"></p></form></details>`);
  const targetForm=root.querySelector('#target-form'),targetResult=root.querySelector('#target-result');let targetRevision=null,targetLoad=0;
  const loadTarget=async()=>{const n=++targetLoad;targetForm.querySelector('button').disabled=true;try{const targets=await store.targets(Number(targetForm.elements.year.value));if(n!==targetLoad)return;const target=targets.find(t=>t.metricId===targetForm.elements.metricId.value);targetRevision=target?.revision??null;targetForm.elements.value.value=target?.value??'';targetForm.elements.operator.value=target?.operator||'gte';targetResult.textContent=target?'Current target loaded.':'No target set.';targetForm.querySelector('button').disabled=false;}catch(error){targetResult.textContent=error.message;}};
  targetForm.elements.year.onchange=loadTarget;targetForm.elements.metricId.onchange=loadTarget;
  targetForm.onsubmit=async event=>{event.preventDefault();targetForm.querySelector('button').disabled=true;try{await store.saveTarget({metricId:targetForm.elements.metricId.value,year:Number(targetForm.elements.year.value),operator:targetForm.elements.operator.value,value:Number(targetForm.elements.value.value),expectedRevision:targetRevision});await loadTarget();targetResult.textContent='Target saved.';root.dispatchEvent(new Event('compass-admin-saved'));}catch(error){targetResult.textContent=error.message;targetForm.querySelector('button').disabled=false;}};await loadTarget();
  root.querySelector('#admin-user').onchange=e=>{
    const member=roster.members.find(m=>m.userId===e.target.value),editor=root.querySelector('#member-editor');if(!member){editor.innerHTML='';return;}
    const checks=(name,items,selected)=>items.map(([id,title])=>`<label class="check"><input type="checkbox" name="${name}" value="${esc(id)}" ${selected.includes(id)?'checked':''}>${esc(title)}</label>`).join('');
    editor.innerHTML=`<form class="entry-form" id="admin-form"><label>Position title<input name="positionTitle" required maxlength="150" value="${esc(member.positionTitle)}"></label><label class="check"><input type="checkbox" name="active" ${member.active?'checked':''}>Account active</label><fieldset><legend>Roles</legend>${checks('roles',roles.map(r=>[r,r==='director'?'OLT Director':r==='elt'?'ELT':r[0].toUpperCase()+r.slice(1)]),member.roles)}</fieldset><fieldset><legend>Department scope</legend>${checks('departments',roster.departments.map(d=>[d,d]),member.departments)}</fieldset><fieldset><legend>Additional positions</legend>${checks('positions',roster.positions.map(p=>[p.id,p.title]),member.positions)}</fieldset><fieldset><legend>Access overrides</legend><p>Role default follows the selected roles. Deny removes access.</p>${[['readMetrics','Read metrics and scorecards'],['writeMetrics','Record metric updates'],['readWeekly','Read weekly accountability'],['writeWeekly','Submit weekly priorities']].map(([key,label])=>`<label>${label}<select name="${key}">${[[null,'Role default'],[true,'Allow'],[false,'Deny']].map(([v,l])=>`<option value="${v==null?'':v}" ${member[key]===v?'selected':''}>${l}</option>`).join('')}</select></label>`).join('')}</fieldset><button type="submit" class="primary-button">Save access</button><p role="status" id="admin-result"></p></form>`;
    editor.querySelector('form').onsubmit=async event=>{event.preventDefault();const form=event.target,fields=new FormData(form),result=editor.querySelector('#admin-result'),button=form.querySelector('button');button.disabled=true;result.textContent='Saving…';
      const payload={userId:member.userId,positionTitle:fields.get('positionTitle'),active:fields.has('active'),roles:fields.getAll('roles'),departments:fields.getAll('departments'),positions:fields.getAll('positions')};
      for(const key of ['readMetrics','writeMetrics','readWeekly','writeWeekly'])payload[key]=fields.get(key)===''?null:fields.get(key)==='true';
      try{await store.saveMember(payload);Object.assign(member,payload);result.textContent='Access saved.';root.dispatchEvent(new Event('compass-admin-saved'));await identity();if(!access?.admin)await render();}catch(error){result.textContent=error.message;}finally{button.disabled=false;}
    };
  };
  if(expected===token)await mountCommandCenter(root,store,roster);
}
function showMix(){const mix=mixRollup(data);return `<p class="detail-summary">Reporting month ${esc(month)} · Balance target 33 / 33 / 33. Status awaits an approved tolerance.</p>${mix.streams.map((s,i)=>`<section class="detail-section"><h3>Stream ${i+1} · ${s.share==null?'Share unavailable':number(s.share)+'%'}</h3>${s.components.map(c=>`<h4>${esc(c.name)}</h4>${readings(c.observations)}`).join('')}<p>Total: ${number(s.value)}</p></section>`).join('')}<section class="detail-section"><h3>Contribution categories</h3>${data.contributions.map(c=>`<p>${esc(c.categoryId)}: ${number(c.value)}</p>`).join('')||'<p>No contributions recorded.</p>'}</section>`;}
function showInitiatives(){const items=initiativeRollups(data);detail('Enterprise priorities',`<p class="detail-summary">Submitted weekly progress · Week of ${esc(data.week)}. These signals reflect linked weekly commitments.</p>${items.map(o=>`<section class="detail-section"><h3>${esc(o.title)}</h3>${badge(o.status)}${o.updates.length?o.updates.map(u=>`<div class="commitment"><strong>${esc(u.position)}</strong><p>${esc(u.title)}</p><p>${esc(u.result)}</p></div>`).join(''):'<p>No linked submission for this week.</p>'}</section>`).join('')||'<p>No enterprise priorities configured for this quarter.</p>'}`);}
function scorecards(){
  const strategic=view==='strategic';groups=strategic?strategicRollups(data):annualRollups(data);
  const priorities=initiativeRollups(data),reported=priorities.filter(p=>p.updates.length).length;
  root.innerHTML=`<div class="hero"><div><h2>${strategic?'2030 Plan Scorecard':'Annual Scorecard'}</h2><p>${strategic?'Long-term outcomes':'Department measures and enterprise priorities'}</p></div><div class="hero-meta"><label>Reporting month <input id="report-month" type="month" value="${esc(month)}" required></label><div class="health-signals">${groups.map((g,i)=>`<button class="health-signal ${g.status}" data-group="${i}" aria-label="${esc(g.name)}: ${labels[g.status]}" title="${esc(g.name)}: ${labels[g.status]}"><span class="dot"></span></button>`).join('')}</div></div></div><div class="legend">${Object.keys(labels).map(s=>badge(s)).join('')}</div><p class="footnote">${strategic?'Signals compare reported values with 2030 targets; they do not forecast delivery.':'Values are reported for the selected month. Department measures await approved targets before receiving a status.'}</p><div class="cards ${strategic?'':'annual'}">${groups.map((g,i)=>`<article class="card"><button class="card-head" data-group="${i}"><span class="group-title"><h3>${esc(g.name)}</h3></span>${badge(g.status)}</button><div class="metrics">${g.metrics.map((m,j)=>`<button class="metric ${m.status}" data-item="${i}:${j}"><span class="metric-name"><span class="dot"></span>${esc(m.name)}</span><span class="metric-value"><strong>${m.mix?'View mix':m.readings.length===1?number(m.readings[0].value):m.readings.length?m.readings.length+' department updates':'Not reported'}</strong></span><span>${strategic?esc(targetText(m.target)):''}</span><span class="chevron">›</span></button>`).join('')}${g.name==='Enterprise Priorities'?`<button class="linked" data-priorities><strong>Priority initiatives on track</strong><span>${priorities.filter(p=>p.status==='good').length} / ${priorities.length}</span></button><p class="footnote">${reported} of ${priorities.length} have linked submissions this week.</p>`:g.name==='Advocacy'?'<p class="footnote">Advocacy work is tracked through linked enterprise priorities across departments.</p>':''}${g.name==='Revenue'?'<button class="linked" data-mix><strong>Revenue mix and contribution categories</strong><span>›</span></button>':''}</div></article>`).join('')}</div>`;
  root.querySelector('#report-month').onchange=e=>{if(e.target.value){month=e.target.value;render();}};
  root.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{const g=groups[Number(b.dataset.group)];if(g.name==='Enterprise Priorities'){showInitiatives();return;}detail(g.name,g.metrics.map(m=>`<section class="detail-section"><h3>${esc(m.name)}</h3>${readings(m.readings)}${m.target?`<p>${view==='strategic'?'2030':'Annual'} target: ${esc(targetText(m.target))}</p>`:''}</section>`).join('')||'<p>Related weekly work appears under Enterprise Priorities.</p>');});
  root.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{const [i,j]=b.dataset.item.split(':').map(Number),m=groups[i].metrics[j];detail(m.name,m.mix?showMix():`${readings(m.readings)}${m.target?`<p class="note">2030 target: ${esc(targetText(m.target))}</p>`:''}<p class="detail-summary">${esc(month)} · ${m.readings.length?'Saved metric updates.':'Record a metric update to begin tracking this measure.'}</p>`);});
  root.querySelector('[data-priorities]')?.addEventListener('click',showInitiatives);root.querySelector('[data-mix]')?.addEventListener('click',()=>detail('Revenue mix',showMix()));
}
async function render(){
  root=document.createElement('div');outlet.replaceChildren(root);
  const current=++token;document.querySelectorAll('[data-surface]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.surface===view)));
  document.querySelector('.intro h1').textContent=({metrics:'Record progress',weekly:'Weekly accountability',admin:'Admin',learn:'Learn'})[view]||'Enterprise scorecards';
  root.innerHTML='<p role="status">Loading Compass…</p>';
  workspaceNav.hidden=true;signOutButton.hidden=true;
  try{
    await identity(current);if(current!==token)return;
    if(!access){
      data=null;groups=[];if(dialog.open)dialog.close();
      document.querySelector('.account strong').textContent='Your workspace';document.querySelector('.account small').textContent='Signed out';document.querySelector('.avatar').textContent='';
      document.querySelector('.intro h1').textContent='Compass';document.querySelector('[data-surface="admin"]').hidden=true;
      mountSignIn(root,store);return;
    }
    workspaceNav.hidden=false;signOutButton.hidden=false;
    const selectedTab=workspaceNav.querySelector(`[data-surface="${view}"]`);
    if(selectedTab?.hidden){const available=[...workspaceNav.querySelectorAll('[data-surface]')].find(b=>!b.hidden);if(available){view=available.dataset.surface;history.replaceState(null,'','/#'+view);await render();return;}}
    if(view==='learn'){learn();return;}
    if(view==='metrics'){await window.CompassMetricEntry.mount(root);return;}
    if(access?.features?.[view]===false&&view!=='admin'){root.innerHTML='<p>This section is hidden for your account. Choose another section.</p>';return;}
    if(view==='weekly'){await window.CompassWeekly.mount(root);return;}
    if(view==='admin'){await admin();return;}
    data=await store.scorecards(month);if(current===token)scorecards();
  }catch(error){if(current===token){signOutButton.hidden=!sessionUser;root.innerHTML=`${authPhase==='access-check'?'<h2>Your Microsoft sign-in is complete</h2><p>Compass could not open your assigned workspace. Contact Manager, Enterprise Initiatives if retrying does not resolve this.</p>':''}<p role="alert">${esc(error.message)}</p><button class="quiet-button" data-retry>Try again</button>`;}}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-surface]');if(b){view=b.dataset.surface;history.replaceState(null,'','#'+view);render();}if(e.target.closest('[data-retry]'))render();});
store.onAuthChange?.((event,session)=>{
  const nextUser=session?.user?.id||(session?'authenticated':null);
  if(event==='SIGNED_OUT'||(nextUser!==sessionUser&&event!=='INITIAL_SESSION')){access=null;data=null;sessionUser=nextUser;render();}
});
window.addEventListener('compass-auth-required',()=>render());
render();
