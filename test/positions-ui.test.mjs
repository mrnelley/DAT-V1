import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildSync} from 'esbuild';
import {JSDOM} from 'jsdom';
const code=buildSync({stdin:{contents:"import {mountPositions,mountMetricGovernance} from './src/features/admin/positions.js';window.positionUI={mountPositions,mountMetricGovernance};",resolveDir:process.cwd()},bundle:true,write:false,format:'iife'}).outputFiles[0].text;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('a vacant position is configured without collecting an email or creating an account',async()=>{
 const dom=new JSDOM('<section></section>',{url:'https://hdc-compass.dev',runScripts:'outside-only'}),w=dom.window,panel=w.document.querySelector('section');w.eval(code);
 const data={positions:[],metrics:[],grants:[]},saved=[];
 const store={positions:async()=>data,savePosition:async p=>{saved.push(p);const row={...p,id:'permanent-id',revision:1,occupants:[],read_scorecards:p.readScorecards};data.positions.push(row);return row;}};
 await w.positionUI.mountPositions(panel,store,{departments:['Finance']});panel.querySelector('#new-position').click();
 assert.equal(panel.querySelector('[type="email"]'),null);const form=panel.querySelector('form');form.elements.title.value='Finance lead';form.elements.department.value='Finance';form.elements['feature-annual'].value='false';
 await form.onsubmit({preventDefault(){}});
 assert.equal(saved[0].title,'Finance lead');assert.equal(saved[0].features.annual,false);assert.equal('email' in saved[0],false);
 assert.match(panel.textContent,/Vacant/);assert.match(panel.textContent,/Position saved/);dom.window.close();
});
test('metric governance assigns the same measure to multiple positions with separate write access',async()=>{
 const dom=new JSDOM('<section></section>',{runScripts:'outside-only'}),w=dom.window,panel=w.document.querySelector('section');w.eval(code);
 const data={positions:[{id:'a',title:'Finance',active:true},{id:'b',title:'Operations',active:true}],metrics:[{id:'cash',name:'Days cash',department:'Finance',governance_revision:2}],grants:[]};let saved;
 await w.positionUI.mountMetricGovernance(panel,{positions:async()=>data,setMetricPositions:async p=>{saved=p;}},{departments:['Finance']});
 const read=panel.querySelectorAll('[name="read"]'),write=panel.querySelector('[name="write"]');read[0].checked=true;read[1].checked=true;write.checked=true;
 await panel.querySelector('form').onsubmit({preventDefault(){}});
 assert.deepEqual(JSON.parse(JSON.stringify(saved.positions)),[{positionId:'a',canWrite:true},{positionId:'b',canWrite:false}]);assert.equal(saved.expectedRevision,2);dom.window.close();
});
test('working-position selection reloads the role surface without changing the login',async()=>{
 const app=buildSync({entryPoints:['src/features/scorecards/app.js'],bundle:true,write:false,format:'iife'}).outputFiles[0].text;
 const dom=new JSDOM(readFileSync('index.html','utf8'),{url:'https://hdc-compass.dev/#learn',runScripts:'outside-only'}),w=dom.window;let current='a';
 w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.CompassMetricStore={session:async()=>({user:{id:'same-user'}}),access:async()=>({positionId:current,positionTitle:current==='a'?'Director':'Staff',positions:[{id:'a',title:'Director'},{id:'b',title:'Staff'}],admin:false,metrics:current==='a',scorecards:current==='a',weekly:current==='a'}),selectPosition:id=>{current=id;w.dispatchEvent(new w.Event('compass-position-changed'));}};
 w.eval(app);await tick();const select=w.document.querySelector('[aria-label="Working position"]');select.value='b';select.dispatchEvent(new w.Event('change'));await tick();
 assert.equal(w.document.querySelector('[data-surface="metrics"]').hidden,true);assert.match(w.document.querySelector('.account small').textContent,/Staff/);assert.equal(w.document.querySelector('#microsoft-signin'),null);dom.window.close();
});
