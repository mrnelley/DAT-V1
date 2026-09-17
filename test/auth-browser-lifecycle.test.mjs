import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSync } from 'esbuild';
import { JSDOM } from 'jsdom';

const code=buildSync({entryPoints:['src/bootstrap.js'],bundle:true,write:false,format:'iife',define:{'import.meta.env':JSON.stringify({VITE_SUPABASE_URL:'https://auth.example.invalid',VITE_SUPABASE_ANON_KEY:'public-test-key'})}}).outputFiles[0].text;
const user={id:'11111111-1111-4111-8111-111111111111',email:'admin@example.invalid',user_metadata:{full_name:'Test Administrator'}};
const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp:Math.floor(Date.now()/1000)+3600},'signature'].map(v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url')).join('.');
const response=body=>new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}});
async function until(check){for(let i=0;i<100;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,10));}assert.fail('Application did not reach the expected state');}
function browser(url,stored={}){
 const dom=new JSDOM(readFileSync('index.html','utf8'),{url,runScripts:'outside-only'}),w=dom.window,calls=[];
 Object.assign(w,{Request,Response,Headers,structuredClone});
 for(const [key,value] of Object.entries(stored))w.localStorage.setItem(key,value);
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.fetch=async(input,options={})=>{
  const path=new URL(typeof input==='string'?input:input.url).pathname;calls.push({path,body:options.body,headers:options.headers});
  if(path==='/auth/v1/token'){
   const request=JSON.parse(options.body);assert.equal(request.auth_code,'return-code');assert.equal(request.code_verifier,'browser-verifier');
   return response({access_token:token,refresh_token:'test-refresh',token_type:'bearer',expires_in:3600,user});
  }
  if(path==='/auth/v1/user')return response(user);
  if(path==='/rest/v1/rpc/compass_access_context')return response({positionTitle:'Manager, Enterprise Initiatives',admin:true,metrics:true,weekly:true});
  if(path==='/rest/v1/rpc/compass_scorecard_data')return response({metrics:[],objectives:[],contributions:[],week:'2026-09-14'});
  if(path==='/rest/v1/rpc/compass_scorecard_targets')return response([]);
  if(path==='/rest/v1/rpc/compass_metric_context')return response({positionTitle:'Manager, Enterprise Initiatives',departments:['Finance'],writableDepartments:['Finance'],metricDefinitions:[{id:'finance-5',name:'Excess cash to parent',department:'Finance'}],contributionCategories:[]});
  if(path==='/rest/v1/rpc/compass_metric_entries')return response([]);
  throw new Error('Unexpected request '+path);
 };
 w.eval(code);return {dom,w,calls};
}

test('real Supabase client exchanges callback code, displays identity and form, and restores session after reload',async()=>{
 const first=browser('https://hdc-compass.dev/auth/callback?code=return-code',{'compass-hosted-auth-code-verifier':JSON.stringify('browser-verifier')});
 try{
  await until(()=>first.w.document.querySelector('.account strong')?.textContent==='Test Administrator');
  await until(()=>first.w.document.querySelectorAll('.health-signal').length===5);
  assert.equal(first.calls.filter(c=>c.path==='/auth/v1/token').length,1);
  const stored=first.w.localStorage.getItem('compass-hosted-auth');assert.ok(stored);
  assert.equal(first.w.location.search,'');assert.equal(first.w.document.querySelector('#microsoft-signin'),null);
  first.w.document.querySelector('[data-surface="metrics"]').click();await until(()=>first.w.document.querySelector('#metric-entry'));
  assert.equal(first.w.document.querySelector('.account strong').textContent,'Test Administrator');
  assert.equal(first.w.document.querySelector('#metric-signin'),null);
  const second=browser('https://hdc-compass.dev/',{'compass-hosted-auth':stored});
  try{await until(()=>second.w.document.querySelectorAll('.health-signal').length===5);assert.equal(second.calls.filter(c=>c.path==='/auth/v1/token').length,0);assert.equal(second.w.document.querySelector('.account strong').textContent,'Test Administrator');}finally{second.dom.window.close();}
 }finally{first.dom.window.close();}
});

test('returning on a different origin without its verifier stays signed out with an explicit recovery message',async()=>{
 const {dom,w,calls}=browser('https://older-deployment.example/auth/callback?code=return-code');
 try{await until(()=>w.document.querySelector('#microsoft-signin'));assert.match(w.document.querySelector('#signin-message').textContent,/browser verification/);assert.equal(calls.filter(c=>c.path.includes('/rest/')).length,0);}finally{dom.window.close();}
});
