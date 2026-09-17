// Dependencies are injected so authorization and retry behavior can be tested without sending email.
export function createUserHandler({createClient,env}) {
  const url=env('SUPABASE_URL'),anon=env('SUPABASE_ANON_KEY'),secret=env('SUPABASE_SERVICE_ROLE_KEY');
  const appUrl=new URL('/auth/callback',env('COMPASS_APP_URL')||'http://127.0.0.1:4174').href;
  const origins=new Set([new URL(appUrl).origin,'http://127.0.0.1:4174','http://localhost:4174']);
  return async request=>{
    const origin=request.headers.get('origin');
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',
      'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods':'POST, OPTIONS'};
    if(origin&&origins.has(origin))headers['Access-Control-Allow-Origin']=origin;
    const respond=(status,data)=>new Response(JSON.stringify(data),{status,headers});
    if(origin&&!origins.has(origin))return respond(403,{error:'This application address is not allowed.'});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return respond(405,{error:'Use POST.'});
    const authorization=request.headers.get('authorization')||'';
    if(!authorization.startsWith('Bearer '))return respond(401,{error:'Sign in required.'});
    try {
      if(!url||!anon||!secret)return respond(503,{error:'User management is not configured.'});
      const user=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
      const verified=await user.auth.getUser(authorization.slice(7));
      if(verified.error||!verified.data?.user)return respond(401,{error:'Sign in again to continue.'});
      const access=await user.rpc('compass_access_context');
      if(access.error||!access.data?.admin)return respond(403,{error:'Admin access required.'});
      if(Number(request.headers.get('content-length'))>12000)return respond(413,{error:'Request is too large.'});
      const raw=await request.text();if(raw.length>12000)return respond(413,{error:'Request is too large.'});
      let payload;try{payload=JSON.parse(raw);}catch{return respond(400,{error:'Invalid request.'});}
      const email=String(payload.email||'').trim().toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return respond(400,{error:'Enter a valid email address.'});
      const lookup=await user.rpc('compass_admin_user_lookup',{target_email:email});
      if(lookup.error)return respond(403,{error:'Unable to inspect this account.'});
      const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
      if(payload.action==='invite'){
        if(!lookup.data)return respond(404,{error:'Create this account first.'});
        if(lookup.data.confirmed)return respond(409,{error:'This account is already confirmed. The user can request a sign-in link.'});
        if(!lookup.data.assigned)return respond(409,{error:'Assign access before sending an invitation.'});
        const sent=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:appUrl});
        if(sent.error)return respond(400,{error:sent.error.message});
        await user.rpc('compass_admin_log_user_event',{target_user:lookup.data.id,event_name:'invitation_sent'});
        return respond(200,{userId:lookup.data.id,message:'Invitation sent.'});
      }
      if(payload.action!=='create')return respond(400,{error:'Unknown action.'});
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.requestId||''))return respond(400,{error:'A request ID is required.'});
      const roles=['admin','executive','elt','director','staff','external'];
      if(payload.positionIds!==undefined){
        if(!Array.isArray(payload.positionIds)||!payload.positionIds.length||payload.positionIds.some(id=>typeof id!=='string'))return respond(400,{error:'Select at least one position.'});
        const positionData=await user.rpc('compass_admin_positions');
        if(positionData.error)return respond(403,{error:'Unable to inspect position assignments.'});
        const selected=(positionData.data?.positions||[]).filter(p=>p.active&&payload.positionIds.includes(p.id));
        if(new Set(payload.positionIds).size!==selected.length)return respond(400,{error:'Choose active positions.'});
        payload.positionTitle=selected[0].title;payload.roles=['staff'];
        payload.departments=[...new Set(selected.map(p=>p.department).filter(Boolean))];
      }
      const departments=['Real Estate Development','Property Management','Human Resources','Resident Services','Community Relations','Finance'];
      if(typeof payload.positionTitle!=='string'||!payload.positionTitle.trim()||payload.positionTitle.trim().length>150||!Array.isArray(payload.roles)||!payload.roles.length||payload.roles.some(r=>!roles.includes(r))||!Array.isArray(payload.departments)||payload.departments.some(d=>!departments.includes(d)))return respond(400,{error:'Provide a position, valid roles and department scope.'});
      let id=lookup.data?.id;
      if(id&&lookup.data.requestId!==payload.requestId)return respond(409,{error:'This account already exists. Select it in Users to manage access.'});
      if(id&&lookup.data.assigned)return respond(200,{userId:id,message:'Account already created. The user can sign in with their email.'});
      if(!id){
        const created=await admin.auth.admin.createUser({email,email_confirm:false,app_metadata:{compass_provisioning_id:payload.requestId}});
        if(created.error)return respond(400,{error:created.error.message});
        id=created.data.user.id;
      }
      const assigned=await user.rpc('compass_set_metric_member',{payload:{userId:id,positionTitle:payload.positionTitle.trim(),roles:payload.roles,departments:payload.departments,active:true,positions:payload.positionIds||[]}});
      if(assigned.error)return respond(422,{userId:id,error:'Account created, but access could not be saved. Retry to finish: '+assigned.error.message});
      await user.rpc('compass_admin_log_user_event',{target_user:id,event_name:'user_created'});
      return respond(200,{userId:id,message:'Account connected. The person can sign in with Microsoft.'});
    }catch{return respond(500,{error:'User management could not finish. Retry the same request.'});}
  };
}
