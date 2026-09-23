const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const roleLabels={admin:'System Admin',executive:'Executive',elt:'ELT',olt:'OLT',director:'Department Director',staff:'Department Staff',external:'Board / External'};
export function avatarMarkup(photo,name){
  return /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(photo||'')
    ?`<img src="${photo}" alt="">`
    :esc((name||'').split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase());
}
export function positionWork(weekly,positionId){
  const record=weekly?.records.find(r=>r.positionId===positionId);
  const document=record?.draft||record?.submitted;
  const priorities=document?.entries||[];
  return {record,priorities,tasks:priorities.flatMap(p=>(p.tasks||[]).map(t=>({...t,priority:p.title})))};
}
async function photoFromFile(file){
  if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Choose a JPG, PNG or WebP image under 10 MB.');
  const bitmap=await createImageBitmap(file);
  try{
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;
    const ctx=canvas.getContext('2d'),side=Math.min(bitmap.width,bitmap.height);
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,320,320);
    ctx.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,320,320);
    const photo=canvas.toDataURL('image/jpeg',0.8);
    if(photo.length>180000)throw new Error('Choose a smaller photo.');
    return photo;
  }finally{bitmap.close();}
}
export async function mountWorkspace(root,store){
  const data=await store.myWorkspace(),access=data.access;
  let profile=data.profile,photo=profile.photo,section='dashboard',dirty=false,busy=false;
  const work=positionWork(data.weekly,access.positionId);
  const enabled=key=>access.features?.[key]!==false;
  const action=(surface,label)=>`<button class="quiet-button" type="button" data-surface="${surface}">${label}</button>`;
  function dashboard(){
    const dates=Array.from({length:7},(_,i)=>{const d=new Date(`${data.weekly?.week||new Date().toISOString().slice(0,10)}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10);});
    return `<div class="workspace-grid"><article class="card learn-card"><h3>My weekly priorities</h3>${access.weekly?`<p>${work.record?.firstAt?'Submitted':'Not yet submitted'} · Week of ${esc(data.weekly.week)}</p>${work.priorities.map(p=>`<section class="workspace-priority"><h4>${esc(p.title)}</h4><p>${esc(p.desiredResult)}</p><p>Due ${esc(p.due)} · ${esc(p.status)}</p></section>`).join('')||'<p>No priorities entered for this week.</p>'}${enabled('weekly')?action('weekly','Open weekly accountability'):''}`:'<p>Weekly submission is not assigned to this position.</p>'}</article><article class="card learn-card"><h3>My action items</h3>${work.tasks.map(t=>`<p><strong>${esc(t.title)}</strong><br>${esc(t.priority)} · ${esc(t.status.replaceAll('_',' '))} · Due ${esc(t.due)}</p>`).join('')||'<p>No action items in your current weekly priorities.</p>'}${access.metrics&&enabled('metrics')?action('metrics','Record progress'):''}</article></div>${access.weekly?`<section class="card learn-card"><h3>This week’s deadlines</h3><div class="deadline-calendar">${dates.map(date=>`<article><h4><time datetime="${date}">${new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'))}</time></h4>${[...work.priorities,...work.tasks].filter(t=>t.due===date).map(t=>`<p>${esc(t.title)}</p>`).join('')||'<span aria-label="No deadlines">—</span>'}</article>`).join('')}</div></section>`:''}<section class="card learn-card"><h3>Property locations</h3><div class="property-locations">${data.properties.map(p=>{const address=[p.street,p.city,p.state,p.postal_code].filter(Boolean).join(', ')||p.location;return `<article><h4>${esc(p.name)}</h4><p>${esc(address)}</p>${p.population?`<p>${esc(p.population)}</p>`:''}<a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(address)}" target="_blank" rel="noopener noreferrer">View in Google Maps<span class="sr-only"> for ${esc(p.name)} (opens a new tab)</span></a></article>`;}).join('')||'<p>No properties assigned.</p>'}</div></section>`;
  }
  function profileForm(){return `<form class="entry-form" id="profile-form"><h3>My profile</h3><div class="profile-photo avatar">${avatarMarkup(photo,profile.displayName)}</div><label>Profile photo<input name="photoFile" type="file" accept="image/jpeg,image/png,image/webp"></label><button class="quiet-button" type="button" id="remove-photo">Remove photo</button><label>Display name<input name="displayName" value="${esc(profile.displayName)}" maxlength="150" required></label><p>${esc(profile.email)}</p><label>About my work<textarea name="bio" maxlength="1000">${esc(profile.bio)}</textarea></label><p><strong>${esc(access.positionTitle)}</strong><br>${(access.roles||[]).map(r=>esc(roleLabels[r]||r)).join(' · ')}</p><button type="submit" class="primary-button">Save profile</button><p role="status"></p></form>`;}
  function draw(){
    root.innerHTML=`<div class="hero"><div><h2>${esc(access.positionTitle)}</h2><p>${esc(profile.displayName)}</p></div></div><nav class="tabs" aria-label="My workspace"><button class="tab" data-workspace-section="dashboard" aria-pressed="${section==='dashboard'}">Working dashboard</button><button class="tab" data-workspace-section="profile" aria-pressed="${section==='profile'}">Profile</button></nav>${section==='dashboard'?dashboard():profileForm()}`;
    root.querySelectorAll('[data-workspace-section]').forEach(b=>b.onclick=()=>{if(busy||dirty&&!confirm('Discard unsaved profile changes?'))return;dirty=false;photo=profile.photo;section=b.dataset.workspaceSection;draw();});
    const form=root.querySelector('#profile-form');if(!form)return;
    form.oninput=()=>{dirty=true;};
    const preview=()=>{form.querySelector('.profile-photo').innerHTML=avatarMarkup(photo,form.elements.displayName.value);};
    form.elements.photoFile.onchange=async()=>{busy=true;form.querySelector('[type="submit"]').disabled=true;try{photo=await photoFromFile(form.elements.photoFile.files[0]);dirty=true;preview();form.querySelector('[role="status"]').textContent='Photo ready to save.';}catch(error){form.querySelector('[role="status"]').textContent=error.message;}finally{busy=false;form.querySelector('[type="submit"]').disabled=false;}};
    form.querySelector('#remove-photo').onclick=()=>{photo=null;dirty=true;preview();};
    form.onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;form.querySelector('[type="submit"]').disabled=true;try{
      const saved=await store.saveProfile({displayName:form.elements.displayName.value,bio:form.elements.bio.value,photo,expectedRevision:profile.revision});
      profile={...profile,...saved};dirty=false;form.querySelector('[role="status"]').textContent='Profile saved.';
      window.dispatchEvent(new Event('compass-profile-updated'));
    }catch(error){form.querySelector('[role="status"]').textContent=error.message;}finally{busy=false;form.querySelector('[type="submit"]').disabled=false;}};
  }
  draw();
  const guard=e=>{if(!root.isConnected){document.removeEventListener('click',guard,true);return;}if(e.target.closest('[data-surface]')&&(busy||dirty&&!confirm('Discard unsaved profile changes?'))){e.preventDefault();e.stopImmediatePropagation();}};
  document.addEventListener('click',guard,true);
}
