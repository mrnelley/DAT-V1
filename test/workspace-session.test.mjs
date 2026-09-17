import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkspaceSession} from '../src/features/admin/workspaceSession.js';

test('view-as delegates calls without replacing the Admin auth session and restores normal routing on exit',async()=>{
 const calls=[];let changes=0;
 const session=createWorkspaceSession(async(name,args)=>{calls.push({name,args});return name==='compass_admin_start_workspace'?{id:'server-issued',userId:'target',allowWrites:false}:{};},()=>changes++);
 await session.call('compass_access_context');
 await session.start('target');
 await session.call('compass_save_metric_entry',{payload:{id:'entry'}});
 assert.deepEqual(calls[2],{name:'compass_admin_workspace_call',args:{workspace_session:'server-issued',operation:'compass_save_metric_entry',arguments:{payload:{id:'entry'}}}});
 await session.end();await session.call('compass_admin_members');
 assert.equal(session.current(),null);assert.equal(changes,2);assert.equal(calls.at(-1).name,'compass_admin_members');
});

test('failed start or failed exit does not silently switch identity',async()=>{
 let fail=true;
 const session=createWorkspaceSession(async()=>{if(fail)throw new Error('Offline');return {id:'session',userId:'target'};},()=>{});
 await assert.rejects(session.start('target'),/Offline/);assert.equal(session.current(),null);
 fail=false;await session.start('target',true);fail=true;
 await assert.rejects(session.end(),/Offline/);assert.equal(session.current().userId,'target');
 session.clear();assert.equal(session.current(),null);
});
