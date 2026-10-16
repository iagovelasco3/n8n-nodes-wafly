const fs = require('node:fs');
const path = require('node:path');
const { operations, parametersFor } = require('../helpers.cjs');
const dest = process.argv[2];
fs.mkdirSync(dest, { recursive: true });
const credential = { id: 'wafly-fixture-credential', name: 'Wafly Fixture' };
function wafly(name, parameters) { return { id: name, name, type: 'n8n-nodes-wafly.wafly', typeVersion: 1, position: [400, 0], parameters, credentials: { waflyApi: credential } }; }
function manual() { return { id: 'manual', name: 'Manual', type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [0, 0], parameters: {} }; }
function workflow(name, nodes, connections) { return { name, nodes, connections, active: false, settings: { executionOrder: 'v1' } }; }
const nodes = operations.map(({ resource, operation }) => wafly(resource + ':' + operation, parametersFor(resource, operation)));
const all = workflow('All Wafly 1.6.0 operations', [manual(), ...nodes], { Manual: { main: [nodes.map(n => ({ node: n.name, type: 'main', index: 0 }))] } });
fs.writeFileSync(path.join(dest, 'all-operations.json'), JSON.stringify(all));
const input = { id: 'input', name: 'Input', type: 'n8n-nodes-base.code', typeVersion: 2, position: [200, 0], parameters: { jsCode: "return [{json:{phone:'5511999999999',marker:'alpha'}},{json:{phone:'5511888888888',marker:'beta'}}];" } };
const send = wafly('Send', { resource: 'message', operation: 'sendText', phone: '={{$json.phone}}', message: '={{$json.marker}}' });
const map = { id: 'map', name: 'Map Previous Input', type: 'n8n-nodes-base.set', typeVersion: 3.4, position: [600, 0], parameters: { assignments: { assignments: [{ id: 'marker', name: 'marker', value: '={{$("Input").item.json.marker}}', type: 'string' }, { id: 'phone', name: 'phone', value: '={{$json.received.body.phone}}', type: 'string' }] }, options: {} } };
const linked = workflow('Saved v1 workflow with expressions and item linking', [manual(), input, send, map], {
  Manual: { main: [[{ node: 'Input', type: 'main', index: 0 }]] }, Input: { main: [[{ node: 'Send', type: 'main', index: 0 }]] }, Send: { main: [[{ node: 'Map Previous Input', type: 'main', index: 0 }]] },
});
fs.writeFileSync(path.join(dest, 'legacy-expressions.json'), JSON.stringify(linked));
const fail = wafly('Expected HTTP Failure', { resource: 'message', operation: 'sendText', phone: '5511999999999', message: 'FAIL401' });
fail.continueOnFail = true;
fs.writeFileSync(path.join(dest, 'continue-on-fail.json'), JSON.stringify(workflow('Legacy continueOnFail', [manual(), fail], { Manual: { main: [[{ node: fail.name, type: 'main', index: 0 }]] } })));
const legacyPair = wafly('Legacy Pairing Body', { resource: 'instanceExtra', operation: 'pairingCodePost', gp_body: '{"phone":"5511999999999"}' });
fs.writeFileSync(path.join(dest, 'legacy-pairing.json'), JSON.stringify(workflow('Legacy pairing JSON', [manual(), legacyPair], { Manual: { main: [[{ node: legacyPair.name, type: 'main', index: 0 }]] } })));
const mutations = [
  wafly('Create 401', { resource: 'partner', operation: 'partnerCreateInstance', gp_body: { acceptAutomaticBilling: true, receivedCallbackUrl: 'https://fixture.test/fail401' } }),
  wafly('Create 409', { resource: 'partner', operation: 'partnerCreateInstance', gp_body: { acceptAutomaticBilling: true, receivedCallbackUrl: 'https://fixture.test/fail409' } }),
  wafly('Publish 401', { resource: 'statusPublication', operation: 'publishStatus', gp_body: { requestId: 'status-runtime-401-001', type: 'image', content: 'BASE64', audienceMode: 'contacts', caption: 'FAIL401' } }),
  wafly('Cancel 401', { resource: 'partner', operation: 'externalCancelInstance', gp_instance: 'SIMULATE401' }),
];
for (const node of mutations) node.continueOnFail = true;
fs.writeFileSync(path.join(dest, 'mutation-failures.json'), JSON.stringify(workflow('Mutations never retry after HTTP failures', [manual(), ...mutations], { Manual: { main: [mutations.map(node => ({ node: node.name, type: 'main', index: 0 }))] } })));
const accountList = wafly('Account List', { resource: 'partner', operation: 'externalListInstances' });
const accountPreview = wafly('Account Preview', { resource: 'partner', operation: 'partnerCreateInstance', gp_body: '{}' });
for (const node of [accountList, accountPreview]) node.credentials.waflyApi = { id: 'wafly-account-only', name: 'Wafly Account Only' };
fs.writeFileSync(path.join(dest, 'account-only.json'), JSON.stringify(workflow('Account-only credentials', [manual(), accountList, accountPreview], { Manual: { main: [[{ node: accountList.name, type: 'main', index: 0 }, { node: accountPreview.name, type: 'main', index: 0 }]] } })));
fs.writeFileSync(path.join(dest, 'credentials.json'), JSON.stringify([
  { id: 'wafly-account-only', name: 'Wafly Account Only', type: 'waflyApi', data: { baseUrl: 'http://wafly-n8n-160-fixture:3000/api-bridge-whats', clientToken: 'FIXTURE_CLIENT_KEY', instance: '', token: '' } },
  { id: credential.id, name: credential.name, type: 'waflyApi', data: { baseUrl: 'http://wafly-n8n-160-fixture:3000/api-bridge-whats', clientToken: 'FIXTURE_CLIENT_KEY', instance: 'TEST_INSTANCE', token: 'TEST_TOKEN' } },
]));
fs.copyFileSync(path.join(__dirname, '../../schema/openapi.json'), path.join(dest, 'openapi.json'));
fs.copyFileSync(path.join(__dirname, 'fixture.cjs'), path.join(dest, 'fixture.cjs'));
fs.copyFileSync(path.join(__dirname, 'credential-check.cjs'), path.join(dest, 'credential-check.cjs'));
fs.writeFileSync(path.join(dest, 'expected-operations.json'), JSON.stringify(nodes.map(n => n.name)));
console.log('Generated runtime workflows for ' + nodes.length + ' operations.');
