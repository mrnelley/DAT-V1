// Give each caller an action label; keep transport details consistent across services.
export async function invokeEdgeFunction(client, functionName, {action, body}) {
  let result;
  try {result=await client.functions.invoke(functionName,{body});}
  catch(error){result={error};}
  const {data,error}=result;
  if(!error&&!data?.error)return data;
  const status=Number(error?.context?.status)||null;
  let detail=data?.error;
  if(error?.context?.json){try{detail=(await error.context.json())?.error||detail;}catch{/* A gateway may return a non-JSON response. */}}
  const network=error?.name==='FunctionsFetchError'||error instanceof TypeError||/Failed to send a request/i.test(error?.message||'');
  const code=network?'connection':status===401?'sign_in':status===403?'permission':status===422?'assignment_incomplete':status===429?'rate_limit':status>=500?'service_unavailable':status?'request_rejected':'service_error';
  let reason;
  if(network)reason='Could not reach the service. Your connection or this app address may be blocking the request. Completion could not be confirmed; retry this same form.';
  else if(status===401)reason='Your sign-in could not be verified. Sign in again, then retry.';
  else if(status===403)reason=typeof detail==='string'?detail:'Your account does not have permission for this action.';
  else if(status===429)reason='Too many requests. Wait a minute before retrying.';
  else if(status>=500||error?.name==='FunctionsRelayError')reason='The service is temporarily unavailable. Completion could not be confirmed; retry this same form.';
  else reason=typeof detail==='string'?detail:'The request could not be completed. Retry this same form.';
  const failure=new Error(`${action} failed: ${reason} [${functionName} · ${code}${status?` · HTTP ${status}`:''}]`);
  failure.name='CompassServiceError';failure.functionName=functionName;failure.operation=action;failure.code=code;failure.status=status;
  throw failure;
}
