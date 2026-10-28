/** Paste inside an ALREADY authenticated app with an existing Supabase client.
 * Keep the returned action object alive across renders (for example useRef).
 * No server credential belongs here. No automatic invocation on mount.
 */
type Client = { functions:{ invoke:(name:string,args:{body:{message:string}})=>Promise<{
  data?:{state?:string;messageId?:string;delivery?:string};error?:unknown
}>}};
export function manualWaflyAction(supabase:Client){
  let used=false;
  return async(message:string)=>{
    if(used)throw new Error('Esta ação já foi iniciada; confira o resultado antes de outra tentativa.');
    used=true;
    try{
      const {data,error}=await supabase.functions.invoke('wafly-send-text',{body:{message}});
      if(error)throw new Error('Resultado não confirmado. Confira o backend; não repita automaticamente.');
      if(data?.state==='preview')return 'Simulação concluída. Nenhuma mensagem enviada.';
      if(data?.state==='accepted'&&data.messageId)return 'Aceito pela API. Entrega não consultada.';
      throw new Error('Resultado não confirmado. Confira o backend; não repita automaticamente.');
    }catch{throw new Error('Confira o resultado no backend antes de tentar novamente.');}
  };
}
