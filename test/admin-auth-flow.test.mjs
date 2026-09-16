import test from 'node:test';
import assert from 'node:assert/strict';
import { authFlowForHash } from '../src/features/metric-entry/authFlow.js';
test('ordinary navigation and sign-in preserve PKCE',()=>{
  for(const hash of ['', '#admin', '#metrics', '#access_token=incomplete'])assert.equal(authFlowForHash(hash),'pkce');
});
test('invitation callbacks use the recipient-compatible Auth flow',()=>{
  assert.equal(authFlowForHash('#access_token=test-access&refresh_token=test-refresh&type=invite'),'implicit');
});
