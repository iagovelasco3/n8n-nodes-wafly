/** Wafly Builder Starter. Server-only. Importing this module never sends. */
export type Config = {
  origin: string; ownerId: string; supabaseUrl: string; publicKey: string;
  secretKey?: string; instance?: string; instanceToken?: string;
  clientToken?: string; testPhone?: string; dispatch?: boolean;
};
export type Result = { state: string; delivery: 'not_checked'; messageId?: string };
export type Dependencies = { fetch: typeof fetch; timeoutMs?: number };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SEGMENT = /^[a-zA-Z0-9_-]{8,160}$/;
const json = (status: number, body: object, origin?: string) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store', ...(origin ? {'Access-Control-Allow-Origin':origin,
    'Vary':'Origin', 'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods':'POST, OPTIONS'} : {}) },
});

function safeOrigin(s: string) {
  try { const u = new URL(s); return u.origin === s && u.protocol === 'https:'; } catch { return false; }
}
function safeSupabase(s: string) {
  try { const u = new URL(s); return u.origin === s && u.protocol === 'https:' && u.hostname.endsWith('.supabase.co'); } catch { return false; }
}

/** A first, manual, single-owner test. Not a multi-tenant notification service. */
export function createHandler(config: Config, dependencies: Dependencies) {
  const call = dependencies.fetch;
  const timeout = dependencies.timeoutMs ?? 10_000;
  return async (req: Request): Promise<Response> => {
    if (!safeOrigin(config.origin) || !safeSupabase(config.supabaseUrl) ||
        !UUID.test(config.ownerId) || !config.publicKey) return json(503,{error:'setup_required'});
    const origin = req.headers.get('origin');
    if (origin !== config.origin) return json(403,{error:'origin_not_allowed'});
    if (req.method === 'OPTIONS') return new Response(null,{status:204,headers:{
      'Access-Control-Allow-Origin':config.origin,'Vary':'Origin',
      'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Max-Age':'600',
    }});
    const fail = (status:number,error:string) => json(status,{error},config.origin);
    if (req.method !== 'POST') return fail(405,'method_not_allowed');
    if (!(req.headers.get('content-type')??'').toLowerCase().startsWith('application/json')) return fail(415,'json_required');
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ') || auth.length > 8192) return fail(401,'sign_in_required');
    let user: {id?:string};
    try {
      const response = await call(config.supabaseUrl+'/auth/v1/user',{
        headers:{'apikey':config.publicKey,'Authorization':auth}, signal:AbortSignal.timeout(timeout), redirect:'error',
      });
      if (!response.ok) return fail(401,'invalid_session');
      user = await response.json();
    } catch { return fail(503,'session_check_unavailable'); }
    if (user.id !== config.ownerId) return fail(403,'owner_only');

    let payload: {message?:unknown};
    try {
      // Read at most 8 KiB, including a body without Content-Length.
      const reader=req.body?.getReader(); if(!reader)return fail(400,'invalid_json');
      const chunks:Uint8Array[]=[];let length=0;
      while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;
        if(length>8192){await reader.cancel();return fail(413,'body_too_large');}chunks.push(value);}
      const bytes=new Uint8Array(length);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}
      payload=JSON.parse(new TextDecoder().decode(bytes));
    } catch { return fail(400,'invalid_json'); }
    if (!payload || Array.isArray(payload) || typeof payload !== 'object' ||
        Object.keys(payload).some(k=>k!=='message') || typeof payload.message !== 'string' ||
        !payload.message.trim() || payload.message.length>1000) return fail(400,'invalid_message');
    // Preview never reserves an operation, calls Wafly, or requires Wafly credentials.
    if (config.dispatch !== true) return json(200,{state:'preview',delivery:'not_checked',
      notice:'Simulação: nenhuma mensagem foi enviada. Configure e revise o backend antes de habilitar.'},config.origin);
    if (!config.secretKey || !config.instance || !SEGMENT.test(config.instance) ||
        !config.instanceToken || !SEGMENT.test(config.instanceToken) || !config.clientToken ||
        /[\r\n]/.test(config.clientToken) || !/^\d{10,15}$/.test(config.testPhone??'')) return fail(503,'private_setup_required');

    const table=config.supabaseUrl+'/rest/v1/wafly_builder_first_attempts';
    const dbHeaders:Record<string,string>={'apikey':config.secretKey,
      'Content-Type':'application/json','Prefer':'return=minimal'};
    // Modern sb_secret_ keys are not JWTs: apikey only. Legacy service-role JWTs
    // retain their existing bearer path; no key rotation or creation is performed.
    if(!config.secretKey.startsWith('sb_secret_')) dbHeaders.Authorization='Bearer '+config.secretKey;
    // The database primary key permits only ONE attempt per configured owner.
    // This persists across browser reloads, edge instances and response timeouts.
    try {
      const reservation=await call(table,{method:'POST',headers:dbHeaders,
        body:JSON.stringify({owner_id:user.id,state:'reserved'}),
        signal:AbortSignal.timeout(timeout),redirect:'error'});
      if(reservation.status===409)return fail(409,'attempt_already_reserved_reconcile_first');
      if(!reservation.ok)return fail(503,'reservation_failed_no_dispatch');
    } catch {return fail(503,'reservation_uncertain_no_dispatch');}

    let status=502;
    let result:Result={state:'uncertain',delivery:'not_checked'};
    try {
      const response=await call('https://wafly.com.br/api-bridge-whats/instances/'+config.instance+
        '/token/'+config.instanceToken+'/send-text',{method:'POST',redirect:'error',
        headers:{'Client-Token':config.clientToken,'Content-Type':'application/json'},
        body:JSON.stringify({phone:config.testPhone,message:payload.message.trim()}),
        signal:AbortSignal.timeout(timeout)});
      if(response.ok){
        // Public send-text contract: root messageId. A 2xx without that proof is uncertain.
        const data=await response.json();
        if(typeof data?.messageId==='string' && data.messageId.startsWith('DUPLICATE_')){
          result={state:'duplicate_blocked',delivery:'not_checked'};status=409;
        } else if(typeof data?.messageId==='string' && data.messageId.trim() && data.messageId.length<=256){
          result={state:'accepted',messageId:data.messageId,delivery:'not_checked'};status=200;
        }
      } else if([400,401,403,404,422,429].includes(response.status)){
        result={state:'rejected',delivery:'not_checked'};status=502;
      }
    } catch { /* Do not log token-bearing URLs, bodies or raw exceptions. Never retry. */ }
    try{
      const update=await call(table+'?owner_id=eq.'+encodeURIComponent(config.ownerId),{
        method:'PATCH',headers:dbHeaders,body:JSON.stringify({state:result.state,
          provider_message_id:result.messageId??null,updated_at:new Date().toISOString()}),
        signal:AbortSignal.timeout(timeout),redirect:'error'});
      if(!update.ok)return json(status,{...result,record:'reconciliation_required'},config.origin);
    } catch {return json(status,{...result,record:'reconciliation_required'},config.origin);}
    return json(status,result,config.origin);
  };
}
