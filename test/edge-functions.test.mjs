import test from 'node:test';
import assert from 'node:assert/strict';
import {invokeEdgeFunction} from '../src/lib/edgeFunctions.js';
const body={requestId:'unchanged-retry-id'};
const invoke=result=>invokeEdgeFunction({functions:{invoke:async(name,args)=>{assert.equal(name,'compass-admin-users');assert.equal(args.body,body);return result;}}},'compass-admin-users',{action:'Connect person to position',body});

test('connection failures identify the operation, service and uncertain outcome',async()=>{
 await assert.rejects(invoke({error:{name:'FunctionsFetchError',message:'Failed to send a request to the Edge Function'}}),e=>{
  assert.equal(e.operation,'Connect person to position');assert.equal(e.functionName,'compass-admin-users');assert.equal(e.code,'connection');assert.equal(e.status,null);
  assert.match(e.message,/Connect person to position failed/);assert.match(e.message,/Completion could not be confirmed/);assert.doesNotMatch(e.message,/Failed to send a request to the Edge Function/);return true;
 });
});
test('HTTP failures distinguish sign-in, permission, assignment, rate and service failures',async()=>{
 for(const [status,code,detail,match] of [[401,'sign_in','Invalid JWT',/Sign in again/],[403,'permission','Admin access required.',/Admin access required/],[422,'assignment_incomplete','Account created, but access could not be saved. Retry to finish.',/Account created, but access could not be saved/],[429,'rate_limit','limit',/Wait a minute/],[503,'service_unavailable','internal',/temporarily unavailable/],[409,'request_rejected','This account already exists.',/already exists/]]){
  await assert.rejects(invoke({error:{name:'FunctionsHttpError',context:new Response(JSON.stringify({error:detail}),{status})}}),e=>{assert.equal(e.code,code);assert.equal(e.status,status);assert.match(e.message,match);return true;});
 }
});
test('non-JSON gateway failures and payload errors remain purpose-specific',async()=>{
 await assert.rejects(invoke({error:{context:new Response('unavailable',{status:502})}}),/Connect person to position failed.*temporarily unavailable/);
 await assert.rejects(invoke({data:{error:'Choose active positions.'}}),/Choose active positions/);
 assert.deepEqual(await invoke({data:{userId:'created'}}),{userId:'created'});
});
test('new operations can reuse the error contract and thrown network errors are handled',async()=>{
 await assert.rejects(invokeEdgeFunction({functions:{invoke:async()=>{throw new TypeError('fetch failed');}}},'future-service',{action:'Publish quarterly report',body}),e=>{assert.equal(e.code,'connection');assert.match(e.message,/Publish quarterly report failed/);assert.match(e.message,/future-service/);return true;});
});
