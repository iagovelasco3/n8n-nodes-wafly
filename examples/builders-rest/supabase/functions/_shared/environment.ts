/** Read existing platform keys; never create/rotate credentials. */
export function readServerKey(get:(name:string)=>string|undefined,mapName:string,singleName:string,legacyName:string){
 const raw=get(mapName);
 if(raw){try{const values=JSON.parse(raw);return typeof values?.default==='string'?values.default:'';}catch{return '';}}
 return get(singleName)??get(legacyName)??'';
}
