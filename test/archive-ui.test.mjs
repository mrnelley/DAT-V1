import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountArchive} from '../src/features/admin/archive.js';
test('archive offers Q1/Q2 and escaped read-only notes',async()=>{
 const dom=new JSDOM('<section></section>'),root=dom.window.document.querySelector('section'),calls=[];
 await mountArchive(root,{adminArchive:async(period,search)=>{calls.push({period,search});return [{period,content:{title:'<script>unsafe</script>',positionTitles:['Director of HR'],progressNote:'Historical note',reportedFacts:[]}}];}});
 assert.equal(root.querySelectorAll('option').length,2);assert.equal(root.querySelectorAll('textarea,[contenteditable]').length,0);
 assert.equal(root.querySelectorAll('script').length,0);assert.match(root.textContent,/Historical note/);assert.match(root.textContent,/Read-only/);
 const select=root.querySelector('select');select.value='2026-Q2';select.dispatchEvent(new dom.window.Event('change'));await new Promise(r=>setImmediate(r));
 assert.equal(calls.at(-1).period,'2026-Q2');dom.window.close();
});
test('archive permission errors do not reveal cached records',async()=>{
 const dom=new JSDOM('<section>Old content</section>'),root=dom.window.document.querySelector('section');
 await mountArchive(root,{adminArchive:async()=>{throw new Error('Admin access required');}});
 assert.match(root.textContent,/Admin access required/);assert.ok(!root.textContent.includes('Old content'));dom.window.close();
});
