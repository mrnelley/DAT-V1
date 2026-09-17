const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function mountArchive(root,store){
 root.innerHTML=`<h3>Archived records</h3><p>Historical notes. These records cannot be edited and do not affect current rollups or points.</p><form class="admin-filter"><label class="field">Quarter<select name="period"><option value="2026-Q1">Q1 2026</option><option value="2026-Q2">Q2 2026</option></select></label><label class="field">Search<input name="search" type="search" maxlength="200"></label><button class="quiet-button">Search archive</button></form><p role="status"></p><div class="archive-results"></div>`;
 let generation=0;const form=root.querySelector('form'),result=root.querySelector('[role="status"]'),list=root.querySelector('.archive-results');
 const load=async()=>{const token=++generation;result.textContent='Loading archive…';list.replaceChildren();
  try{const rows=await store.adminArchive(form.elements.period.value,form.elements.search.value);if(token!==generation)return;
   list.innerHTML=rows.map(r=>{const c=r.content;return `<article class="card learn-card"><h4>${esc(c.title)}</h4><p>${esc(c.positionTitles.join(' · '))}</p>${c.area?`<p>${esc(c.area)}</p>`:''}${c.kpiText?`<p><strong>Target:</strong> ${esc(c.kpiText)}</p>`:''}<p>${esc(c.progressNote||'No progress note was provided.')}</p>${c.relatedProjectPlans?.length?`<p><strong>Related project plans:</strong> ${c.relatedProjectPlans.map(p=>esc(p.title)).join('; ')}</p>`:''}${c.reportedFacts?.length?`<details><summary>Reported figures</summary><ul>${c.reportedFacts.map(f=>`<li>${esc(f.name)}: ${esc(f.value)} ${esc(f.unit)} · ${esc(f.basis)}</li>`).join('')}</ul></details>`:''}<small>${esc(r.period)} · Read-only</small></article>`;}).join('')||'<p>No archived records match this view.</p>';result.textContent=`${rows.length} archived records`;
  }catch(error){if(token===generation)result.textContent=error.message;}
 };
 form.onsubmit=e=>{e.preventDefault();load();};form.elements.period.onchange=load;await load();
}
