import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { mountSignIn } from '../src/features/metric-entry/signInView.js';
import { departmentMetrics, contributedRevenueCategories } from '../src/features/planning/catalog.js';
const source=readFileSync('public/compass/metric-entry.js','utf8');
const setup=store=>{
  const dom=new JSDOM('<button data-surface="metrics" aria-pressed="true"></button><div id="surface"></div>',{url:'http://localhost',runScripts:'outside-only'});
  dom.window.CompassMetricStore=store;dom.window.eval(source);return dom;
};
const context={positionTitle:'Manager, Enterprise Initiatives',roles:['admin'],departments:['Finance','Community Relations'],writableDepartments:['Finance','Community Relations'],metricDefinitions:departmentMetrics,contributionCategories:contributedRevenueCategories};
test('hosted form saves, reloads and corrects entries without local storage',async()=>{
  const entries=[];
  const store={session:async()=>({}),context:async()=>context,list:async d=>entries.filter(e=>e.department===d),save:async p=>{
    const i=entries.findIndex(e=>e.id===p.id);const row={...p,label:p.metricId,revision:(p.expectedRevision||0)+1};
    if(i<0)entries.push(row);else entries[i]=row;
  }};
  const dom=setup(store),w=dom.window,root=w.document.querySelector('#surface');
  await w.CompassMetricEntry.mount(root);
  let form=root.querySelector('#metric-entry'),f=form.elements;
  assert.equal(f.kind,undefined);
  f.metric.value='finance-5';f.metric.onchange();f.value.value='0';f.description.value='Monthly assessment';
  await form.onsubmit({preventDefault(){}});
  assert.equal(entries[0].value,0);assert.equal(w.localStorage.length,0);
  root.querySelector('[data-correct]').click();f.value.value='120';
  await form.onsubmit({preventDefault(){}});
  assert.equal(entries[0].revision,2);
  f.department.value='Community Relations';await f.department.onchange();
  f.metric.value='community-relations-1';f.metric.onchange();f.category.value='individual';
  assert.equal(root.querySelector('#category-label').hidden,false);
  f.value.value='250';f.description.value='Gift';await form.onsubmit({preventDefault(){}});
  assert.equal(entries[1].categoryId,'individual');assert.equal(entries[1].metricId,'community-relations-1');
  await w.CompassMetricEntry.mount(root);
  assert.match(root.querySelector('#entry-history').textContent,/120/);
  dom.window.close();
});
test('uncertain network retries reuse the same entry ID',async()=>{
  const requests=[];
  const dom=setup({session:async()=>({}),context:async()=>context,list:async()=>[],save:async p=>{requests.push(p);throw new Error('Connection interrupted');}});
  const root=dom.window.document.querySelector('#surface');await dom.window.CompassMetricEntry.mount(root);
  const form=root.querySelector('#metric-entry');form.elements.value.value='5';form.elements.description.value='Test';
  await form.onsubmit({preventDefault(){}});await form.onsubmit({preventDefault(){}});
  assert.equal(requests[0].id,requests[1].id);assert.match(root.textContent,/Connection interrupted/);
  dom.window.close();
});
test('signed-out users receive sign-in, not a browser-only save fallback',async()=>{
  const dom=setup({session:async()=>null});const root=dom.window.document.querySelector('#surface');
  let requested=false;dom.window.addEventListener('compass-auth-required',()=>{requested=true;});
  await dom.window.CompassMetricEntry.mount(root);
  assert.equal(requested,true);assert.equal(root.querySelector('#metric-entry'),null);
  dom.window.close();
});

test('failed callbacks explain recovery beside a usable sign-in form',async()=>{
 const dom=setup({session:async()=>null,signInProblem:()=> 'This sign-in link has expired. Request a new email.'});
 const root=dom.window.document.querySelector('#surface');mountSignIn(root,dom.window.CompassMetricStore);
 assert.match(root.querySelector('#signin-message').textContent,/expired/);
 assert.ok(root.querySelector('#microsoft-signin'));assert.equal(root.querySelector('input[type="email"]'),null);dom.window.close();
});

test('Microsoft is the primary sign-in action and does not request an email',async()=>{
 let microsoft=0,emails=0;
 const dom=setup({session:async()=>null,signInMicrosoft:async()=>{microsoft++;},sendCode:async()=>{emails++;}});
 const root=dom.window.document.querySelector('#surface');mountSignIn(root,dom.window.CompassMetricStore);
 assert.equal(root.querySelector('#metric-signin'),null);
 const button=root.querySelector('#microsoft-signin');await button.onclick();
 assert.equal(microsoft,1);assert.equal(emails,0);assert.equal(button.disabled,true);
 assert.match(root.querySelector('#signin-message').textContent,/Opening Microsoft/);dom.window.close();
});

test('Microsoft failures leave a retryable button and an accessible message',async()=>{
 const dom=setup({session:async()=>null,signInMicrosoft:async()=>{throw new Error('Provider unavailable');}});
 const root=dom.window.document.querySelector('#surface');mountSignIn(root,dom.window.CompassMetricStore);
 const button=root.querySelector('#microsoft-signin');await button.onclick();
 assert.equal(button.disabled,false);assert.match(root.querySelector('[role="status"]').textContent,/Provider unavailable/);dom.window.close();
});
