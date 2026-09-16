import { readFileSync } from 'node:fs';
const env=Object.fromEntries(readFileSync('.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{
  const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];
}));
const url=env.VITE_SUPABASE_URL,key=env.VITE_SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_ANON_KEY;
for(const name of ['compass_metric_context','compass_save_metric_entry']){
  const response=await fetch(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
    body:JSON.stringify(name==='compass_save_metric_entry'?{payload:{}}:{}),signal:AbortSignal.timeout(15000)});
  const result=await response.json();
  if(![401,403].includes(response.status)||result.code!=='42501') throw new Error(`${name}: unexpected response ${response.status} (${result.code})`);
  console.log(`${name}: signed-out API access correctly rejected`);
}
