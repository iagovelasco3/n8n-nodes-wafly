#!/usr/bin/env python3
"""Run the packed node in an isolated real n8n with a local HTTP fixture."""
import argparse, json, os, pathlib, shutil, subprocess, uuid

p = argparse.ArgumentParser()
p.add_argument('--image', required=True)
p.add_argument('--tarball', required=True)
p.add_argument('--out', required=True)
p.add_argument('--workflows', default='all-operations,legacy-expressions,continue-on-fail,legacy-pairing,account-only,mutation-failures')
a = p.parse_args()
root = pathlib.Path(__file__).resolve().parents[2]
out = pathlib.Path(a.out).resolve()
out.mkdir(parents=True, exist_ok=True)
os.chmod(out, 0o777)
subprocess.run(['node', str(root/'tests/runtime/generate.cjs'), str(out)], cwd=root, check=True)
shutil.copyfile(a.tarball, out/'package.tgz')
(out/'data').mkdir(exist_ok=True)
os.chmod(out/'data', 0o777)
suffix = uuid.uuid4().hex[:8]
network = 'wafly-n8n160-' + suffix
fixture = network + '-fixture'
engine = network + '-engine'

def run(args, name):
    result = subprocess.run(args, text=True, capture_output=True, timeout=180)
    (out/(name+'.log')).write_text(result.stdout+result.stderr)
    if result.returncode:
        raise RuntimeError(name+' failed: '+(result.stdout+result.stderr)[-3500:])
    return result.stdout

def execution(text):
    decoder = json.JSONDecoder()
    for i, c in enumerate(text):
        if c != '{': continue
        try: value, _ = decoder.raw_decode(text[i:])
        except ValueError: continue
        if isinstance(value, dict) and 'data' in value and isinstance(value['data'], dict) and 'resultData' in value['data']:
            assert not value['data']['resultData'].get('error'), value['data']['resultData']['error']
            return value
    raise RuntimeError('CLI output did not include an execution result: '+text[-2000:])

summary = {'image': a.image, 'tarball': str(pathlib.Path(a.tarball).resolve()), 'workflows': {}}
try:
    run(['docker', 'network', 'create', network], 'network-create')
    run(['docker', 'run', '-d', '--name', fixture, '--network', network,
         '--network-alias', 'wafly-n8n-160-fixture', '-v', str(out)+':/work',
         '--entrypoint', 'node', a.image, '/work/fixture.cjs'], 'fixture-start')
    run(['docker', 'run', '-d', '--name', engine, '--network', network,
         '-v', str(out)+':/work', '-v', str(out/'data')+':/home/node/.n8n',
         '-e', 'N8N_ENCRYPTION_KEY=wafly-isolated-test-key-160',
         '-e', 'N8N_DIAGNOSTICS_ENABLED=false', '-e', 'N8N_VERSION_NOTIFICATIONS_ENABLED=false',
         '-e', 'N8N_TEMPLATES_ENABLED=false', '-e', 'N8N_PERSONALIZATION_ENABLED=false',
         '-e', 'N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false', '-e', 'N8N_DEFAULT_BINARY_DATA_MODE=default',
         '--entrypoint', 'sleep', a.image, 'infinity'], 'engine-start')
    # This is the layout used by the community package installer. No source or
    # dev dependencies are mounted into n8n; it only receives the packed files.
    run(['docker','exec',engine,'sh','-c',
         'mkdir -p /home/node/.n8n/nodes/node_modules/n8n-nodes-wafly && '
         'tar -xzf /work/package.tgz -C /home/node/.n8n/nodes/node_modules/n8n-nodes-wafly --strip-components=1'], 'install-tarball')
    run(['docker','exec',engine,'n8n','import:credentials','--input=/work/credentials.json'], 'import-credentials')
    run(['docker','exec',engine,'node','/work/credential-check.cjs'], 'credential-check')
    summary['credentialChecks'] = 3
    for name in a.workflows.split(','):
        workflow_path = out/(name+'.json')
        workflow_data = json.loads(workflow_path.read_text())
        workflow_data['id'] = 'wafly160' + name.replace('-', '')
        workflow_path.write_text(json.dumps(workflow_data))
        run(['docker','exec',engine,'n8n','import:workflow','--input=/work/'+name+'.json'], name+'-import')
        raw = run(['docker','exec',engine,'n8n','execute','--id='+workflow_data['id'],'--rawOutput'], name)
        data = execution(raw)
        (out/(name+'-execution.json')).write_text(json.dumps(data, indent=2))
        runs = data['data']['resultData']['runData']
        if name == 'all-operations':
            expected = json.loads((out/'expected-operations.json').read_text())
            assert all(n in runs for n in expected), set(expected)-set(runs)
            for node in expected:
                result = runs[node][-1]
                assert not result.get('error'), result
                values = result['data']['main'][0]
                assert values, node
                for item in values:
                    assert isinstance(item['json'], dict), (node,item)
                    assert item.get('pairedItem') == {'item': 0}, (node,item)
            audio = runs['call:callRecording'][-1]['data']['main'][0][0]['binary']['data']
            assert audio['mimeType'] == 'audio/mpeg', audio
            assert audio['fileName'] == 'recording-TEST_VALUE.mp3', audio
            assert audio['data'] == 'SUQzAP+A', audio
            assert len(runs['group:listGroups'][-1]['data']['main'][0]) == 2
            summary['operationsExecuted'] = len(expected)
        elif name == 'legacy-expressions':
            values = runs['Map Previous Input'][-1]['data']['main'][0]
            assert [v['json']['marker'] for v in values] == ['alpha','beta'], values
            assert [v['json']['phone'] for v in values] == ['5511999999999','5511888888888'], values
        elif name == 'continue-on-fail':
            item = runs['Expected HTTP Failure'][-1]['data']['main'][0][0]
            assert item['json']['error'] == 'Request failed. Check node credentials and configuration.', item
        elif name == 'legacy-pairing':
            assert runs['Legacy Pairing Body'][-1]['data']['main'][0]
        elif name == 'account-only':
            assert runs['Account List'][-1]['data']['main'][0]
            assert runs['Account Preview'][-1]['data']['main'][0][0]['json']['created'] is False
        elif name == 'mutation-failures':
            for name in ['Create 401', 'Create 409', 'Publish 401', 'Cancel 401']:
                assert runs[name][-1]['data']['main'][0][0]['json']['error'] == 'Request failed. Check node credentials and configuration.'
            name = 'mutation-failures'
        summary['workflows'][name] = 'passed'
    records = [json.loads(line) for line in (out/'requests.jsonl').read_text().splitlines()]
    assert all(row['authenticated'] and not row['problems'] for row in records)
    # Since 1.6.1 requests go through n8n's httpRequestWithAuthentication (required for
    # verified community nodes). n8n core retries a request exactly once on HTTP 401,
    # so an unauthorized call may reach the fixture twice; the API rejects both before
    # any mutation runs. HTTP 409 is never retried, which proves there is no generic retry.
    HTTP401_HITS = (1, 2) if 'continue-on-fail' in a.workflows.split(',') else (0,)
    assert sum(row.get('body',{}).get('message') == 'FAIL401' for row in records if row.get('body')) in HTTP401_HITS
    if 'mutation-failures' in a.workflows.split(','):
        assert sum((row.get('body') or {}).get('receivedCallbackUrl') == 'https://fixture.test/fail401' for row in records) in (1, 2)
        assert sum((row.get('body') or {}).get('receivedCallbackUrl') == 'https://fixture.test/fail409' for row in records) == 1
        assert sum((row.get('body') or {}).get('caption') == 'FAIL401' for row in records) in (1, 2)
        assert sum(row['path'].endswith('/SIMULATE401') for row in records) in (1, 2)
    summary.update({'httpRequests':len(records),'authAndContractChecks':'passed','result':'passed'})
finally:
    for name in [engine,fixture]:
        subprocess.run(['docker','logs',name], text=True, stdout=open(out/(name+'-container.log'),'w'), stderr=subprocess.STDOUT)
        subprocess.run(['docker','rm','-f',name], capture_output=True)
    subprocess.run(['docker','network','rm',network], capture_output=True)
    (out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
