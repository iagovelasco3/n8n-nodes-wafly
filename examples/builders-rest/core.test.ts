import { createHandler, type Config } from './core.ts';
import {readServerKey} from './supabase/functions/_shared/environment.ts';
const OWNER='11111111-1111-4111-8111-111111111111';
const OTHER='22222222-2222-4222-8222-222222222222';
const BASE:Config={origin:'https://app.example',ownerId:OWNER,supabaseUrl:'https://test.supabase.co',publicKey:'sb_publishable_SYNTHETIC',
  secretKey:'sb_secret_SYNTHETIC',instance:'TEST_INSTANCE_123',instanceToken:'TEST_INSTANCE_TOKEN_123',
  clientToken:'TEST_CLIENT_TOKEN',testPhone:'5511999999999',dispatch:true};
function assert(ok:unknown,message='assertion failed'):asserts ok{if(!ok)throw new Error(message);}
const body=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
function request(value:unknown={message:'Confirmação simulada'},options:{origin?:string,auth?:string,method?:string,raw?:string,contentType?:string}={}){
  return new Request('https://edge.example/wafly-send-text',{method:options.method??'POST',
    headers:{Origin:options.origin??BASE.origin,Authorization:options.auth??'Bearer SYNTHETIC_SESSION',
      'Content-Type':options.contentType??'application/json'},
    ...((options.method??'POST')==='POST'?{body:options.raw??JSON.stringify(value)}:{})});
}
type MockOptions={user?:string;authStatus?:number;authThrows?:boolean;reservationStatus?:number;reservationThrows?:boolean;
  providerStatus?:number;providerBody?:unknown;providerThrows?:boolean;updateFails?:boolean;delay?:number};
function mock(options:MockOptions={}){
  const calls:{url:string,method:string,headers:Headers,body:unknown}[]=[];
  let reserved=false,providerCalls=0;
  const transport=async(input:RequestInfo|URL,init:RequestInit={})=>{
    const url=String(input),method=init.method??'GET';
    calls.push({url,method,headers:new Headers(init.headers),body:init.body?JSON.parse(String(init.body)):null});
    if(url.endsWith('/auth/v1/user')){if(options.authThrows)throw new Error('synthetic');return body({id:options.user??OWNER},options.authStatus??200);}
    if(url.includes('/rest/v1/')&&method==='POST'){
      if(options.reservationThrows)throw new Error('synthetic reservation timeout');
      if(reserved)return body({},409);
      reserved=true;return body({},options.reservationStatus??201);
    }
    if(url.includes('/send-text')){
      providerCalls++;if(options.delay)await new Promise(r=>setTimeout(r,options.delay));
      if(options.providerThrows)throw new Error('synthetic provider timeout');
      return body(options.providerBody??{messageId:'SYNTHETIC_MESSAGE_ID'},options.providerStatus??200);
    }
    if(url.includes('/rest/v1/')&&method==='PATCH')return body({},options.updateFails?503:200);
    throw new Error('Unexpected external call blocked');
  };
  return{fetch:transport as typeof fetch,calls,count:()=>providerCalls};
}
async function run(config:Config={...BASE},options:MockOptions={},req=request()){
  const m=mock(options),response=await createHandler(config,{fetch:m.fetch})(req);
  return{m,response,data:await response.json()};
}
Deno.test('preview is default: auth only, no reservation or Wafly dispatch',async()=>{
  const {m,data}=await run({...BASE,dispatch:false,clientToken:undefined,secretKey:undefined});
  assert(data.state==='preview'&&m.calls.length===1&&m.count()===0);
});
Deno.test('missing setup, HTTP origin and other origin fail closed',async()=>{
  for(const cfg of [{...BASE,origin:'*'},{...BASE,origin:'http://app.example'},
    {...BASE,supabaseUrl:'https://attacker.example'},{...BASE,ownerId:'bad'}]){
    const {response,m}=await run(cfg);assert(response.status===503&&m.calls.length===0);
  }
  const {response,m}=await run(BASE,{},request({}, {origin:'https://evil.example'}));assert(response.status===403&&m.calls.length===0);
});
Deno.test('CORS preflight exact origin, no auth or dispatch',async()=>{
  const m=mock(),r=await createHandler(BASE,{fetch:m.fetch})(request(undefined,{method:'OPTIONS'}));
  assert(r.status===204&&r.headers.get('Access-Control-Allow-Origin')===BASE.origin&&m.calls.length===0);
});
Deno.test('method, JSON type and missing bearer refused',async()=>{
  for(const req of [request({}, {method:'GET'}),request({}, {contentType:'text/plain'}),request({}, {auth:'not_bearer'})]){
    const {response,m}=await run(BASE,{},req);assert(response.status>=400&&m.count()===0);
  }
});
Deno.test('fresh auth proof required; another authenticated user cannot send',async()=>{
  for(const option of [{authStatus:401},{authThrows:true},{user:OTHER}]){
    const {response,m}=await run(BASE,option);assert(response.status>=400&&m.count()===0&&m.calls.length===1);
  }
});
Deno.test('invalid/oversized payload refused; client cannot select phone or instance',async()=>{
  for(const value of [null,[],{}, {message:''},{message:'x'.repeat(1001)},{message:'x',phone:'5511111111111'},
    {message:'x',instance:OTHER}]){const{response,m}=await run(BASE,{},request(value));assert(response.status===400&&m.count()===0);}
  const{response,m}=await run(BASE,{},request({}, {raw:'x'.repeat(8200)}));assert(response.status===413&&m.count()===0);
});
Deno.test('private setup and URL segments checked before reservation',async()=>{
  for(const cfg of [{...BASE,clientToken:''},{...BASE,instanceToken:'../evil?x=1'},
    {...BASE,instance:'bad/instance'},{...BASE,testPhone:'(11)123'},{...BASE,secretKey:''}]){
    const {response,m}=await run(cfg);assert(response.status===503&&m.count()===0&&m.calls.length===1);
  }
});
Deno.test('single API request: exact endpoint, private auth and body',async()=>{
  const {data,response,m}=await run();assert(response.status===200&&data.state==='accepted'&&data.delivery==='not_checked'&&m.count()===1);
  const call=m.calls.find(c=>c.url.endsWith('/send-text'))!;
  assert(call.url==='https://wafly.com.br/api-bridge-whats/instances/TEST_INSTANCE_123/token/TEST_INSTANCE_TOKEN_123/send-text');
  assert(call.headers.get('Client-Token')===BASE.clientToken);
  assert((call.body as {phone:string}).phone===BASE.testPhone);
  assert(m.calls[1].method==='POST'&&m.calls[1].url.includes('/rest/v1/'));
});
Deno.test('concurrent clicks reserve once; new handler shares durable reservation',async()=>{
  const m=mock({delay:10}),h=createHandler(BASE,{fetch:m.fetch});
  const result=await Promise.all([h(request()),h(request())]);
  assert(m.count()===1&&result.some(r=>r.status===409)&&result.some(r=>r.status===200));
  const again=await createHandler(BASE,{fetch:m.fetch})(request());assert(again.status===409&&m.count()===1);
});
Deno.test('uncertain reservation or database errors never dispatch',async()=>{
  for(const options of [{reservationThrows:true},{reservationStatus:503},{reservationStatus:409}]){
    const {response,m}=await run(BASE,options);assert(response.status>=400&&m.count()===0);
  }
});
Deno.test('2xx without a valid messageId is uncertain, not delivered',async()=>{
  for(const value of [{},{messageId:''},{messageId:12},{messageId:'   '},{messageId:'x'.repeat(257)}]){
    const {data,m}=await run(BASE,{providerBody:value});assert(data.state==='uncertain'&&data.delivery==='not_checked'&&m.count()===1);
  }
});
Deno.test('provider timeout/5xx: uncertain, no retry across handler recreation',async()=>{
  for(const opt of [{providerThrows:true},{providerStatus:503}]){
    const m=mock(opt),first=await createHandler(BASE,{fetch:m.fetch})(request()),data=await first.json();
    assert(data.state==='uncertain');const again=await createHandler(BASE,{fetch:m.fetch})(request());
    assert(again.status===409&&m.count()===1);
  }
});
Deno.test('provider rejection and DUPLICATE are not new accepted sends',async()=>{
  const rejected=await run(BASE,{providerStatus:401});assert(rejected.data.state==='rejected');
  const duplicate=await run(BASE,{providerBody:{messageId:'DUPLICATE_test'}});assert(duplicate.data.state==='duplicate_blocked'&&duplicate.response.status===409);
});
Deno.test('receipt write failure preserves acceptance and requires reconciliation',async()=>{
  const {data,m}=await run(BASE,{updateFails:true});assert(data.state==='accepted'&&data.record==='reconciliation_required'&&m.count()===1);
});
Deno.test('error response reveals no secret, phone or token-bearing URL',async()=>{
  const {data}=await run(BASE,{providerBody:{secret:BASE.instanceToken},providerStatus:500});
  const s=JSON.stringify(data);for(const value of [BASE.instanceToken,BASE.clientToken,BASE.testPhone,'/token/'])assert(!s.includes(value!));
});
Deno.test('modern key uses apikey only; legacy JWT retains bearer',async()=>{
 const modern=await run();const db=modern.m.calls.find(c=>c.method==='POST'&&c.url.includes('/rest/v1/'))!;
 assert(db.headers.get('apikey')===BASE.secretKey&&!db.headers.has('Authorization'));
 const legacy=await run({...BASE,secretKey:'LEGACY_SYNTHETIC_JWT'});
 const old=legacy.m.calls.find(c=>c.method==='POST'&&c.url.includes('/rest/v1/'))!;
 assert(old.headers.get('Authorization')==='Bearer LEGACY_SYNTHETIC_JWT');
});
Deno.test('platform key maps, local fallback and malformed maps fail closed',()=>{
 const get=(v:Record<string,string>)=>(name:string)=>v[name];
 assert(readServerKey(get({MAP:'{"default":"sb_secret_SYNTHETIC"}',LEGACY:'old'}),'MAP','ONE','LEGACY')==='sb_secret_SYNTHETIC');
 assert(readServerKey(get({ONE:'local',LEGACY:'old'}),'MAP','ONE','LEGACY')==='local');
 assert(readServerKey(get({LEGACY:'old'}),'MAP','ONE','LEGACY')==='old');
 assert(readServerKey(get({MAP:'invalid',LEGACY:'old'}),'MAP','ONE','LEGACY')==='');
});
