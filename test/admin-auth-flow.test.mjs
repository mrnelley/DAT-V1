import test from 'node:test';
import assert from 'node:assert/strict';
import { authFlowForHash } from '../src/features/metric-entry/authFlow.js';
import { createAuthSession, describeAuthCallback } from '../src/features/metric-entry/authSession.js';
test('ordinary navigation and sign-in preserve PKCE',()=>{
  for(const hash of ['', '#admin', '#metrics', '#access_token=incomplete'])assert.equal(authFlowForHash(hash),'pkce');
});
test('invitation callbacks use the recipient-compatible Auth flow',()=>{
  assert.equal(authFlowForHash('#access_token=test-access&refresh_token=test-refresh&type=invite'),'implicit');
});

test('missing PKCE verifier produces a recovery message instead of a silent sign-in loop',async()=>{
 const callback=describeAuthCallback(new URL('https://compass.example/auth/callback?code=secret'));
 let cleaned=0;
 const reader=createAuthSession({initialize:async()=>({error:null}),getSession:async()=>({data:{session:null},error:null})},callback,()=>cleaned++);
 assert.equal(await reader.session(),null);
 assert.match(reader.problem(),/same browser and profile/);
 assert.doesNotMatch(JSON.stringify(callback),/secret/);
 await reader.session();assert.equal(cleaned,1);
 reader.clearProblem();await reader.session();assert.equal(reader.problem(),'');
});

test('expired callback errors are surfaced even when getSession returns no error',async()=>{
 const reader=createAuthSession({initialize:async()=>({error:{code:'otp_expired'}}),getSession:async()=>({data:{session:null},error:null})},describeAuthCallback(new URL('https://compass.example/#error=access_denied&error_code=otp_expired')));
 await reader.session();assert.match(reader.problem(),/expired or has already been used/);
});

test('callback waits for exchange; a successful session clears failure and cleans the URL once',async()=>{
 let resolveInitialization,finished=false,cleaned=0;
 const auth={initialize:()=>new Promise(resolve=>{resolveInitialization=resolve;}),getSession:async()=>{assert.equal(finished,true);return {data:{session:{user:{id:'user'}}},error:null};}};
 const reader=createAuthSession(auth,describeAuthCallback(new URL('https://compass.example/auth/callback?code=secret')),()=>cleaned++);
 const pending=reader.session();finished=true;resolveInitialization({error:null});
 assert.equal((await pending).user.id,'user');assert.equal(reader.problem(),'');assert.equal(cleaned,1);
});

test('bare callback explains incomplete verification while ordinary signed-out navigation stays quiet',async()=>{
 for(const [path,expected] of [['/auth/callback',/no verification code/],['/',/^$/]]){
  const reader=createAuthSession({initialize:async()=>({error:null}),getSession:async()=>({data:{session:null},error:null})},describeAuthCallback(new URL('https://compass.example'+path)));
  await reader.session();assert.match(reader.problem(),expected);
 }
});
