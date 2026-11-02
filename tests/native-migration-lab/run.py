#!/usr/bin/env python3
"""Execute only the existing synthetic lab; network none, no credentials."""
import datetime, hashlib, json, os, pathlib, shutil, subprocess, sys

source = pathlib.Path(__file__).resolve().parent
out = pathlib.Path(sys.argv[1]).resolve()
out.mkdir(parents=True, exist_ok=True)
os.chmod(out, 0o777)
for file in source.iterdir():
    if file.is_file(): shutil.copy2(file, out/file.name)
image = 'n8nio/n8n:2.43.7'
started = datetime.datetime.now(datetime.timezone.utc).isoformat()

def run(command, log, cwd=None):
    result = subprocess.run(command, text=True, capture_output=True, cwd=cwd, timeout=420)
    (out/log).write_text(result.stdout+result.stderr)
    if result.returncode: raise RuntimeError(log+': '+(result.stdout+result.stderr)[-3500:])
    return result.stdout

checks = json.loads(run(['node','testar-kit-20261022.mjs'], '93-checks.log', out).strip())
assert checks['checks'] == 93 and checks['syntheticCases'] == 13 and checks['networkCalls'] == 0
original = json.loads((out/'laboratorio-n8n-20261022.json').read_text())
assert len(original['nodes']) == 4 and original['active'] is False
assert all(n['type'] in ['n8n-nodes-base.manualTrigger','n8n-nodes-base.code','n8n-nodes-base.stickyNote'] for n in original['nodes'])
assert not any(n.get('credentials') for n in original['nodes'])
import_copy = dict(original, id='waflyOfflineMigrationLab20261022')
(out/'import.json').write_text(json.dumps(import_copy, ensure_ascii=False))
run(['docker','pull',image], 'image-pull.log')
digest = json.loads(run(['docker','image','inspect',image], 'image-inspect.log'))[0]['RepoDigests']
command = 'n8n --version > /work/n8n-version.log && n8n import:workflow --input=/work/import.json > /work/import.log 2>&1 && n8n execute --id=waflyOfflineMigrationLab20261022 --rawOutput > /work/execution.log 2>&1 && n8n export:workflow --id=waflyOfflineMigrationLab20261022 --output=/work/exported-laboratorio-n8n.json --pretty > /work/export.log 2>&1'
run(['docker','run','--rm','--network','none','--cap-drop','ALL','--security-opt','no-new-privileges',
     '-v',str(out)+':/work',
     '-e','N8N_DIAGNOSTICS_ENABLED=false','-e','N8N_VERSION_NOTIFICATIONS_ENABLED=false',
     '-e','N8N_TEMPLATES_ENABLED=false','-e','N8N_PERSONALIZATION_ENABLED=false',
     '-e','N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false',
     '-e','N8N_ENCRYPTION_KEY=offline-synthetic-lab-only-not-a-credential',
     '--entrypoint','sh',image,'-c',command], 'container.log')
text = (out/'execution.log').read_text()
decoder = json.JSONDecoder()
execution = None
for i,char in enumerate(text):
    if char != '{': continue
    try: value,_ = decoder.raw_decode(text[i:])
    except ValueError: continue
    if isinstance(value,dict) and isinstance(value.get('data'),dict) and 'resultData' in value['data']:
        execution=value;break
assert execution is not None, text[-3000:]
data=execution['data']['resultData']
assert not data.get('error'),data.get('error')
runs=data['runData']
samples=runs['Amostras sintéticas'][-1]['data']['main'][0]
outputs=runs['Normalizar e conferir'][-1]['data']['main'][0]
assert len(samples)==len(outputs)==13
fixtures=json.loads((out/'amostras-20261022.json').read_text())
assert [r['json'] for r in samples] == fixtures['cases']
seen=set()
for i,(sample,row) in enumerate(zip(fixtures['cases'],outputs)):
    actual=row['json']; assert actual['sample']==sample['name']
    assert actual['accepted']==sample['expectedAccepted']
    if sample.get('expectedReason'): assert actual['reason']==sample['expectedReason']
    if actual['accepted']:
        event=actual['event'];assert event['instance']==sample['expectedInstance']
        assert event['provider']==sample['provider']
        assert event['is_group'] is False and event['from_me'] is False
        assert json.loads(event['dedupe_key'])==[sample['provider'],sample['expectedInstance'],event['message_id']]
        assert actual['duplicate_in_sample']==(event['dedupe_key'] in seen)
        seen.add(event['dedupe_key'])
    else: assert 'event' not in actual and actual['duplicate_in_sample'] is False
    assert row.get('pairedItem') == {'item':i},row
(out/'outputs.json').write_text(json.dumps([r['json'] for r in outputs], ensure_ascii=False,indent=2)+'\n')
(out/'execution-result.json').write_text(json.dumps(execution,ensure_ascii=False,indent=2)+'\n')
exported=json.loads((out/'exported-laboratorio-n8n.json').read_text())
if isinstance(exported,list): assert len(exported)==1;exported=exported[0]
assert exported['nodes']==original['nodes']
assert exported['connections']==original['connections']
assert all(exported['settings'].get(k)==v for k,v in original['settings'].items())
assert exported['active'] is False
assert exported['name']==original['name']
summary={'passed':True,'started_utc':started,'completed_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'n8n_version':(out/'n8n-version.log').read_text().strip(),'image':image,'image_digests':digest,
 'network_mode':'none','diagnostics':False,'credentials':0,'external_API_calls':0,'WhatsApp_sends':0,
 'manual_trigger':True,'nodes':4,'samples':13,'existing_Node_checks':checks['checks'],
 'actual_n8n_CLI_import_execute_export':True,'export_nodes_connections_equal_original':True,
 'original_settings_preserved':True,'output_rows':len(outputs),'accepted_rows':sum(r['json']['accepted'] for r in outputs),
 'rejected_rows':sum(not r['json']['accepted'] for r in outputs),
 'input_sha256':hashlib.sha256((out/'laboratorio-n8n-20261022.json').read_bytes()).hexdigest(),
 'export_sha256':hashlib.sha256((out/'exported-laboratorio-n8n.json').read_bytes()).hexdigest(),
 'limits':['Synthetic offline lab only; no hosted n8n Cloud account execution.','No WhatsApp, Wafly, OpenAI, live webhook, buffer or customer environment tested.','In-sample duplicate detection is not persistent or atomic production idempotency.']}
(out/'assertions.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
