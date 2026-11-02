#!/usr/bin/env python3
"""Native example processes against a loopback fixture; no external forwarding."""
import argparse, datetime, hashlib, http.server, json, os, pathlib, socket, subprocess, threading, time, urllib.parse

p=argparse.ArgumentParser()
p.add_argument('--runtime',choices=['php','java'],required=True)
p.add_argument('--executable',required=True)
p.add_argument('--source',required=True)
p.add_argument('--out',required=True)
p.add_argument('--class-dir')
p.add_argument('--jars')
a=p.parse_args();out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
source=pathlib.Path(a.source).resolve()
if a.runtime=='php':
    version=subprocess.run([a.executable,'-v'],capture_output=True,text=True,check=True)
    modules=subprocess.check_output([a.executable,'-r','echo json_encode(["version"=>PHP_VERSION,"curl"=>extension_loaded("curl"),"json"=>extension_loaded("json")]);'],text=True)
    info=json.loads(modules);assert info['version'].startswith('8.') and info['curl'] and info['json'],info
    subprocess.run([a.executable,'-l',str(source)],capture_output=True,text=True,check=True)
    command=[a.executable,str(source)]
else:
    version=subprocess.run([a.executable,'-version'],capture_output=True,text=True,check=True)
    command=[a.executable,'-Djdk.httpclient.disableRetryConnect=true','-Djdk.httpclient.enableAllMethodRetry=false','-cp',str(pathlib.Path(a.class_dir).resolve())+os.pathsep+str(pathlib.Path(a.jars).resolve()/'*'),'EnviarMensagem20261102']
(out/'runtime-version.log').write_text(version.stdout+version.stderr)
client='SYNTHETIC_ACCOUNT_HEADER'
instance='instância/ QA+%~'
token='SYNTHETIC_TOKEN/+á%~'
phone='5511000000000'
message='Olá, "mundo"!\nBarra \\ e emoji 🚀'
expected_path='/api-bridge-whats/instances/'+urllib.parse.quote(instance,safe='')+'/token/'+urllib.parse.quote(token,safe='')+'/send-text'
state={}
class Server(http.server.ThreadingHTTPServer): daemon_threads=True
class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def do_GET(self): self.handle_request()
    def do_POST(self): self.handle_request()
    def handle_request(self):
        case=state['case']
        raw=self.rfile.read(int(self.headers.get('Content-Length','0')))
        case['records'].append({'method':self.command,'path':self.path,'client':self.headers.get('Client-Token'),'content_type':self.headers.get('Content-Type'),'raw':raw})
        if case.get('drop'):
            self.connection.shutdown(socket.SHUT_RDWR);self.connection.close();return
        if case.get('delay'): time.sleep(case['delay'])
        body=case.get('raw')
        if body is None: body=json.dumps(case.get('body'),ensure_ascii=False).encode('utf8')
        try:
            self.send_response(case.get('status',200));self.send_header('Content-Type','application/json; charset=utf-8')
            if 300<=case.get('status',200)<400: self.send_header('Location','/followup-SECRET_REDIRECT')
            self.send_header('Content-Length',str(len(body)));self.send_header('Connection','close');self.end_headers();self.wfile.write(body)
        except (BrokenPipeError,ConnectionResetError): pass
server=Server(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port)+'/api-bridge-whats'
cases=[
 {'name':'native-success-without-value','body':{'messageId':'SYNTHETIC_REQUEST_ID','instance':'sample','message':''},'ok':True},
 {'name':'legacy-true-success','body':{'messageId':'SYNTHETIC_REQUEST_ID','value':True},'ok':True},
 {'name':'HTTP401','status':401,'body':{'error':'SECRET_RESPONSE_BODY'}},
 {'name':'HTTP402','status':402,'body':{'error':'SECRET_RESPONSE_BODY'}},
 {'name':'HTTP500','status':500,'body':{'error':'SECRET_RESPONSE_BODY'}},
 {'name':'HTTP302-no-follow','status':302,'body':{'messageId':'SYNTHETIC_REQUEST_ID'}},
 {'name':'HTTP307-no-follow','status':307,'body':{'messageId':'SYNTHETIC_REQUEST_ID'}},
 {'name':'value-false','body':{'messageId':'SYNTHETIC_REQUEST_ID','value':False}},
 {'name':'value-wrong-type','body':{'messageId':'SYNTHETIC_REQUEST_ID','value':'true'}},
 {'name':'error-present','body':{'messageId':'SYNTHETIC_REQUEST_ID','error':'SECRET_RESPONSE_BODY'}},
 {'name':'missing-id','body':{}},
 {'name':'empty-id','body':{'messageId':''}},
 {'name':'whitespace-id','body':{'messageId':'  \n '}},
 {'name':'numeric-id','body':{'messageId':123}},
 {'name':'null-id','body':{'messageId':None}},
 {'name':'object-id','body':{'messageId':{'private':'SECRET_RESPONSE_BODY'}}},
 {'name':'duplicate-suppression-id','body':{'messageId':'DUPLICATE_SYNTHETIC'}},
 {'name':'malformed-JSON','raw':b'{SECRET_RESPONSE_BODY'},
 {'name':'non-object-JSON','body':[{'messageId':'SYNTHETIC_REQUEST_ID'}]},
 {'name':'trailing-JSON','raw':b'{"messageId":"SYNTHETIC_REQUEST_ID"} SECRET_RESPONSE_BODY'},
 {'name':'connection-drop-no-retry','drop':True},
 {'name':'timeout15-no-retry','delay':16,'body':{'messageId':'SYNTHETIC_REQUEST_ID'}},
 {'name':'missing-env-no-request','env':{'WAFLY_CLIENT_TOKEN':None},'no_request':True},
 {'name':'invalid-phone-no-request','env':{'WAFLY_PHONE':'+5511000000000'},'no_request':True},
 {'name':'empty-message-no-request','env':{'WAFLY_MESSAGE':'  '},'no_request':True},
 {'name':'header-newline-no-request','env':{'WAFLY_CLIENT_TOKEN':'bad\r\nSECRET_HEADER'},'no_request':True},
 {'name':'HTTP-non-loopback-rejected','env':{'WAFLY_BASE_URL':'http://fixture.invalid'},'no_request':True},
]
results=[]
try:
    for case in cases:
        case['records']=[];state['case']=case
        env={k:v for k,v in os.environ.items() if not k.startswith('WAFLY_') and k not in ['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy','JAVA_TOOL_OPTIONS','JDK_JAVA_OPTIONS','_JAVA_OPTIONS']}
        env.update({'WAFLY_CLIENT_TOKEN':client,'WAFLY_INSTANCE':instance,'WAFLY_TOKEN':token,'WAFLY_PHONE':phone,'WAFLY_MESSAGE':message,'WAFLY_BASE_URL':base,'NO_PROXY':'127.0.0.1,localhost'})
        for key,value in case.get('env',{}).items():
            if value is None: env.pop(key,None)
            else: env[key]=value
        start=time.monotonic();proc=subprocess.run(command,env=env,capture_output=True,text=True,timeout=25);elapsed=time.monotonic()-start
        combined=proc.stdout+proc.stderr
        for secret in [client,instance,token,phone,message,'SECRET_RESPONSE_BODY','SECRET_HEADER','SECRET_REDIRECT',base]:
            assert secret not in combined,(case['name'],'sensitive output')
        if case.get('ok'):
            assert proc.returncode==0 and proc.stderr=='',(case['name'],proc.returncode)
            assert json.loads(proc.stdout)=={'messageId':'SYNTHETIC_REQUEST_ID'}
        else:
            assert proc.returncode!=0 and proc.stdout=='',(case['name'],proc.returncode)
            assert proc.stderr=='Envio não confirmado pela API. O resultado pode ser incerto; confira antes de repetir.\n',(case['name'],'unexpected diagnostic')
        expected_count=0 if case.get('no_request') else 1
        assert len(case['records'])==expected_count,(case['name'],'request count',len(case['records']))
        for record in case['records']:
            assert record['method']=='POST' and record['path']==expected_path,(case['name'],'method/path/encoding')
            assert record['client']==client and record['content_type']=='application/json'
            assert json.loads(record['raw'].decode('utf8'))=={'phone':phone,'message':message}
        if case.get('delay'): assert 14<=elapsed<=23,(case['name'],elapsed)
        results.append({'case':case['name'],'passed':True,'requests':len(case['records']),'duration_seconds':round(elapsed,3),'exit_status':proc.returncode})
finally:
    server.shutdown();server.server_close()
summary={'passed':True,'runtime':a.runtime,'version':(version.stdout+version.stderr).strip(),'source_file':source.name,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'native_cases':len(results),'results':results,'UTF8_headers_path_body_verified':True,'single_attempt_and_no_redirect_verified':True,'timeout_seconds':15,'secret_safe_stdout_stderr_verified':True,'external_provider_requests':0,'WhatsApp_sends':0,'fixture':'loopback only; no forwarding','completed_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(out/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='results'},ensure_ascii=False,indent=2))
