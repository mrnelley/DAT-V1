import { createClient } from '@supabase/supabase-js';
import { authFlowForHash } from './authFlow.js';
import { createAuthSession, describeAuthCallback } from './authSession.js';
const callback = describeAuthCallback(location);
const client = createClient(process.env.COMPASS_SUPABASE_URL, process.env.COMPASS_SUPABASE_KEY, {
  auth: { flowType: authFlowForHash(location.hash), storageKey: 'compass-hosted-auth' },
});
const authSession = createAuthSession(client.auth, callback, () => history.replaceState(null, '', '/#metrics'));
async function rpc(name, args) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}
window.CompassMetricStore = {
  session: () => authSession.session(),
  signInProblem: () => authSession.problem(),
  async sendCode(email) {
    const {error} = await client.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    if(error) throw error;
    authSession.clearProblem();
  },
  async verifyCode(email, token) {
    const {error} = await client.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' });
    if(error) throw error;
  },
  async signOut() { const {error} = await client.auth.signOut(); if(error) throw error; },
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
  async manageUser(payload) {
    const {data,error}=await client.functions.invoke('compass-admin-users',{body:payload});
    if(error){let message=error.message;try{const body=await error.context.json();message=body.error||message;}catch{/* Network errors have no response body. */}throw new Error(message);}
    if(data?.error)throw new Error(data.error);
    return data;
  },
  list: department => rpc('compass_metric_entries', { target_department: department }),
  save: payload => rpc('compass_save_metric_entry', { payload }),
  weekly: week => rpc('compass_weekly_context', week ? { week_date: week } : {}),
  saveWeekly: (payload, finalizing) => rpc('compass_save_weekly', { payload, finalizing }),
};
