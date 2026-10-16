const assert = require('node:assert/strict');
const { Workflow } = require('/usr/local/lib/node_modules/n8n/node_modules/n8n-workflow');
const { WaflyApi } = require('/home/node/.n8n/nodes/node_modules/n8n-nodes-wafly/dist/credentials/WaflyApi.credentials');
const workflow = new Workflow({ id: 'fixture', name: 'Credential Test', active: false,
  nodes: [{ name: 'Credential Test', type: 'fixture', typeVersion: 1, position: [0, 0], parameters: {} }],
  connections: {}, nodeTypes: { getByNameAndVersion() { return { description: { properties: [] } }; } },
});
const host = 'http://wafly-n8n-160-fixture:3000';
const request = new WaflyApi().test.request;
(async () => {
  for (const [credentials, expectedBase, expectedPath] of [
    [{ baseUrl: host + '/api-bridge-whats/', instance: 'ID', token: 'TOKEN' }, host + '/api-bridge-whats', '/instances/ID/token/TOKEN/status'],
    [{ baseUrl: host + '/api-bridge-whats/', instance: '', token: '' }, host + '/api-managment', '/external/instances?limit=1'],
    [{ baseUrl: host + '/custom', managementBaseUrl: host + '/api-managment/', instance: '', token: '' }, host + '/api-managment', '/external/instances?limit=1'],
  ]) {
    const resolve = expression => workflow.expression.resolveSimpleParameterValue.length < 4
      ? workflow.expression.resolveSimpleParameterValue(expression, { $credentials: credentials })
      : workflow.expression.resolveSimpleParameterValue(expression, {}, null, 0, 0, 'Credential Test', [], 'manual', { $credentials: credentials });
    const base = resolve(request.baseURL), path = resolve(request.url);
    assert.equal(base, expectedBase);
    assert.equal(path, expectedPath);
    const response = await fetch(base + path, { headers: { 'Client-Token': 'FIXTURE_CLIENT_KEY' } });
    assert.equal(response.status, 200);
  }
  console.log('Three read-only credential expressions and HTTP requests passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
