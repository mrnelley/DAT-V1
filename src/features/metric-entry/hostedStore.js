import { createClient } from '@supabase/supabase-js';
import { authFlowForHash, signInWithMicrosoft } from './authFlow.js';
import { createAuthSession, describeAuthCallback } from './authSession.js';
import { createWorkspaceSession } from '../admin/workspaceSession.js';
import { invokeEdgeFunction } from '../../lib/edgeFunctions.js';
const callback = describeAuthCallback(location);
const client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY, {
  auth: { flowType: authFlowForHash(location.hash), storageKey: 'compass-hosted-auth' },
});
const authSession = createAuthSession(client.auth, callback, () => history.replaceState(null, '', '/#strategic'));
let selectedPosition=null;
async function directRpc(name, args) {
  const request=client.rpc(name,args);
  if(selectedPosition)request.setHeader('x-compass-position',selectedPosition);
  const { data, error } = await request;
  if (error) {if(error.message.startsWith('This position is no longer assigned'))selectedPosition=null;throw new Error(error.message);}
  return data;
}
const workspace = createWorkspaceSession(directRpc, () => window.dispatchEvent(new Event('compass-workspace-changed')));
const rpc = (name, args) => workspace.call(name, args);
window.CompassMetricStore = {
  session: () => authSession.session(),
  workspaceSession: () => workspace.current(),
  startWorkspace: (userId, allowWrites) => {selectedPosition=null;return workspace.start(userId, allowWrites);},
  endWorkspace: () => {selectedPosition=null;return workspace.end();},
  selectPosition(positionId) {selectedPosition=positionId||null;window.dispatchEvent(new Event('compass-position-changed'));},
  positions: () => rpc('compass_admin_positions'),
  savePosition: payload => rpc('compass_admin_save_position',{payload}),
  setMetricPositions: payload => rpc('compass_admin_set_metric_positions',{payload}),
  signInProblem: () => authSession.problem(),
  onAuthChange(listener) {
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {workspace.clear();selectedPosition=null;}
      // Leave Supabase's callback before making further authenticated requests.
      setTimeout(() => listener(event, session), 0);
    });
    return () => data.subscription.unsubscribe();
  },
  async signInMicrosoft() {
    await signInWithMicrosoft(client.auth, location.origin);
    authSession.clearProblem();
  },
  async sendCode(email) {
    const {error} = await client.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    if(error) throw error;
    authSession.clearProblem();
  },
  async verifyCode(email, token) {
    const {error} = await client.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' });
    if(error) throw error;
  },
  async signOut() { const {error} = await client.auth.signOut({scope:'local'}); if(error) throw error; },
  myWorkspace: () => rpc('compass_my_workspace'),
  saveProfile: payload => rpc('compass_save_profile',{payload}),
  context: () => rpc('compass_metric_context'),
  access: () => rpc('compass_access_context'),
  async scorecards(month) {
    const [data,targets]=await Promise.all([rpc('compass_scorecard_data',{report_month:`${month}-01`}),rpc('compass_scorecard_targets',{target_year:Number(month.slice(0,4))})]);
    return {...data,targets};
  },
  targets: year => rpc('compass_scorecard_targets',{target_year:year}),
  saveTarget: payload => rpc('compass_set_scorecard_target',{payload}),
  members: () => rpc('compass_admin_members'),
  saveMember: payload => rpc('compass_set_metric_member', { payload }),
  adminWorkspace: () => rpc('compass_admin_workspace'),
  saveTeam: payload => rpc('compass_admin_save_team',{payload}),
  saveProperty: payload => rpc('compass_admin_save_property',{payload}),
  setFeature: (userId,key,value) => rpc('compass_admin_set_feature',{target_user:userId,feature:key,enabled_value:value}),
  adminRecords: (kind,page=0,search='') => rpc('compass_admin_records',{record_kind:kind,page_number:page,search_text:search}),
  adminArchive: (period,search='') => rpc('compass_admin_archive',{archive_period:period,search_text:search}),
  async manageUser(payload) {
    if(workspace.current())throw new Error('Return to your Admin account to manage users.');
    return invokeEdgeFunction(client,'compass-admin-users',{
      action:payload.action==='invite'?'Send Compass invitation':'Connect person to position',body:payload,
    });
  },
  list: department => rpc('compass_metric_entries', { target_department: department }),
  save: payload => rpc('compass_save_metric_entry', { payload }),
  weekly: week => rpc('compass_weekly_context', week ? { week_date: week } : {}),
  saveWeekly: (payload, finalizing) => rpc('compass_save_weekly', { payload, finalizing }),
};
