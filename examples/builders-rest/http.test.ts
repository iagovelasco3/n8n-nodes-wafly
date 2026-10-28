import {createHandler} from './core.ts';
Deno.test('native Deno HTTP: authenticated preview, external network prohibited',async()=>{
 let authCalls=0;
 const handler=createHandler({origin:'https://app.example',ownerId:'11111111-1111-4111-8111-111111111111',
   supabaseUrl:'https://test.supabase.co',publicKey:'SYNTHETIC',dispatch:false},{fetch:(async(input)=>{
   if(String(input)!=='https://test.supabase.co/auth/v1/user')throw new Error('Forbidden transport');
   authCalls++;return new Response(JSON.stringify({id:'11111111-1111-4111-8111-111111111111'}));
 })as typeof fetch});
 const server=Deno.serve({hostname:'127.0.0.1',port:0,onListen:()=>{}},handler);
 try{
  const response=await fetch('http://127.0.0.1:'+server.addr.port,{method:'POST',
   headers:{Origin:'https://app.example',Authorization:'Bearer SYNTHETIC','Content-Type':'application/json'},
   body:JSON.stringify({message:'Simulação'})});
  const value=await response.json();
  if(response.status!==200||value.state!=='preview'||value.delivery!=='not_checked'||authCalls!==1)throw new Error('Native HTTP preview failed');
 }finally{await server.shutdown();}
});
