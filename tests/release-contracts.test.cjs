const assert = require('node:assert/strict');
const { test } = require('node:test');
const { WaflyApi } = require('../dist/credentials/WaflyApi.credentials');
const { GENERATED_OPERATIONS } = require('../dist/nodes/Wafly/GeneratedOperations');
const { Workflow } = require('n8n-workflow');
const legacy = require('./fixtures/legacy-1.5.5.json');
const { node, credentials, endpoints, operations, parametersFor, execute, matchContract } = require('./helpers.cjs');

test('all 104 published operation IDs, credential type and node typeVersion remain loadable', () => {
  assert.equal(legacy.operations.length, 104);
  assert.equal(node.description.name, legacy.nodeName);
  assert.equal(node.description.version, legacy.nodeVersion);
  assert.equal(node.description.credentials[0].name, legacy.credentialName);
  for (const [resource, value] of Object.entries(legacy.operationDefaults)) {
    assert.equal(node.description.properties.find(p => p.name === 'operation' && p.displayOptions.show.resource.includes(resource)).default, value);
  }
  for (const old of legacy.operations) assert.ok(operations.some(op => op.resource === old.resource && op.operation === old.operation), JSON.stringify(old));
  for (const name of ['clientToken', 'instance', 'token', 'baseUrl']) assert.ok(new WaflyApi().properties.some(p => p.name === name));
});

test('every public method and route is covered, and requests include required query/body fields', async () => {
  const covered = new Set();
  for (const { resource, operation } of operations) {
    const { calls } = await execute(parametersFor(resource, operation), { respond: request => request.encoding === 'arraybuffer' ? Buffer.from('ID3fixture') : {} });
    assert.equal(calls.length, 1, `${resource}:${operation}`);
    const request = calls[0];
    const endpoint = matchContract(request);
    if (!endpoint) {
      assert.ok(request.url.endsWith('/send-location') || request.url.endsWith('/webhook'), `Undocumented route: ${request.url}`);
      continue;
    }
    covered.add(endpoint.contract.operationId);
    const query = { ...Object.fromEntries(new URL(request.url).searchParams), ...request.qs };
    for (const field of endpoint.contract.parameters || []) {
      if (field.in === 'query' && field.required) assert.ok(field.name in query, `${operation} missing query ${field.name}`);
    }
    const body = endpoint.contract.requestBody;
    if (body?.required) assert.ok(request.body, `${operation} missing body`);
    if (request.body) for (const field of body?.content?.['application/json']?.schema?.required || []) {
      assert.notEqual(field.split('.').reduce((value, key) => value?.[key], request.body), undefined, `${operation} missing body field ${field}`);
    }
  }
  for (const endpoint of endpoints) assert.ok(covered.has(endpoint.contract.operationId), `Missing ${endpoint.contract.operationId}`);
  assert.equal(covered.size, 112);
});

test('deleting a message uses query parameters and preserves an explicit false owner', async () => {
  for (const deleteForEveryone of [false, true]) {
    const { calls, output } = await execute({ resource: 'message', operation: 'deleteMessage', phone: '5511999999999', messageId: 'MSG', deleteForEveryone, deleteParticipantPhone: '5511888888888' }, { respond: () => undefined });
    assert.deepEqual(calls[0].qs, { phone: '5511999999999', messageId: 'MSG', owner: deleteForEveryone, participantPhone: '5511888888888' });
    assert.equal(calls[0].body, undefined);
    assert.deepEqual(output, [[{ json: {}, pairedItem: { item: 0 } }]]);
  }
});

test('DELETE newsletter keeps its JSON body and community DELETE has none', async () => {
  const newsletter = await execute({ resource: 'newsletter', operation: 'deleteNewsletter', gp_body: '{"id":"CHANNEL@newsletter"}' });
  assert.equal(newsletter.calls[0].method, 'DELETE');
  assert.deepEqual(newsletter.calls[0].body, { id: 'CHANNEL@newsletter' });
  const community = await execute({ resource: 'community', operation: 'deleteCommunity', gp_communityId: 'GROUP' });
  assert.equal(community.calls[0].body, undefined);
});

test('management uses the matching host/path or explicit custom base without instance credentials', async () => {
  for (const [baseUrl, managementBaseUrl, expected] of [
    ['https://example.test/api-bridge-whats/', '', 'https://example.test/api-managment'],
    ['https://example.test/prefix/api-bridge-whats', '', 'https://example.test/prefix/api-managment'],
    ['https://bridge.test/custom', 'https://management.test/custom/', 'https://management.test/custom'],
  ]) {
    const { calls, output } = await execute({ resource: 'partner', operation: 'partnerCreateInstance', gp_body: '{}' }, { credentials: { baseUrl, managementBaseUrl, instance: '', token: '' }, respond: () => ({ created: false, mode: 'preview' }) });
    assert.equal(calls[0].url, expected + '/external/instances');
    assert.equal(calls[0].body, undefined);
    assert.equal(output[0][0].json.created, false);
  }
  await assert.rejects(execute({ resource: 'partner', operation: 'externalListInstances' }, { credentials: { baseUrl: 'https://custom.test/unrecognized' } }), /Management Base URL/);
});

test('card creation preserves explicit acceptance without manufacturing consent or retries', async () => {
  const body = { acceptAutomaticBilling: true, receivedCallbackUrl: 'https://fixture.test/callback' };
  const { calls } = await execute({ resource: 'partner', operation: 'partnerCreateInstance', gp_body: body });
  assert.deepEqual(calls[0].body, body);
  let attempts = 0;
  await assert.rejects(execute({ resource: 'partner', operation: 'partnerCreateInstance', gp_body: body }, { respond: () => { attempts++; throw { statusCode: 409, message: 'OPERATION_IN_PROGRESS' }; } }));
  assert.equal(attempts, 1);
});

test('Pix creation requires a stable valid key and forwards the exact header and body', async () => {
  const body = { creationPolicy: 'extra_instance_72h_v1' };
  for (const key of ['', 'short', 'invalid key', 'x'.repeat(129)]) {
    let attempts = 0;
    await assert.rejects(execute({ resource: 'partner', operation: 'partnerCreateInstance', gp_body: body, gh_idempotencyKey: key }, { respond: () => { attempts++; } }), /Idempotency-Key/);
    assert.equal(attempts, 0);
  }
  const { calls } = await execute({ resource: 'partner', operation: 'partnerCreateInstance', gp_body: body, gh_idempotencyKey: 'extra-pix-order-001' });
  assert.deepEqual(calls[0].headers, { 'Idempotency-Key': 'extra-pix-order-001' });
  assert.deepEqual(calls[0].body, body);
});

test('PATCH and escaped target IDs use the management service', async () => {
  const { calls } = await execute({ resource: 'partner', operation: 'externalRenameInstance', gp_instance: 'ID/with space', gp_body: { name: 'Support' } });
  assert.equal(calls[0].method, 'PATCH');
  assert.equal(calls[0].url, 'https://fixture.test/api-managment/external/instances/ID%2Fwith%20space');
  assert.deepEqual(calls[0].body, { name: 'Support' });
});

test('all webhook variants use their own callback and only the explicit JSON value', async () => {
  for (const event of ['Delivery', 'Connected', 'Disconnected']) {
    const operation = 'updateWebhook' + event;
    const { calls } = await execute({ resource: 'webhookExtra', operation, gp_body: { value: 'https://fixture.test/' + event } });
    assert.equal(calls[0].method, 'PUT');
    assert.ok(calls[0].url.endsWith('/update-webhook-' + event.toLowerCase()));
    assert.deepEqual(calls[0].body, { value: 'https://fixture.test/' + event });
  }
});

test('Status publication keeps requestId, audience rules and unknown receipts unchanged', async () => {
  const body = { requestId: 'status-image-test-001', type: 'image', content: 'BASE64', audienceMode: 'contacts_except', excluded: ['5511999999999'] };
  const result = await execute({ resource: 'statusPublication', operation: 'publishStatus', gp_body: body }, { respond: () => ({ state: 'unknown', requestId: body.requestId }) });
  assert.deepEqual(result.calls[0].body, body);
  assert.equal(result.output[0][0].json.state, 'unknown');
  assert.equal(result.calls.length, 1);
  const receipt = await execute({ resource: 'statusPublication', operation: 'statusPublicationReceipt', gp_requestId: body.requestId });
  assert.equal(receipt.calls[0].method, 'GET');
  assert.ok(receipt.calls[0].url.endsWith('/requests/' + body.requestId));
});

test('audio recording is exact binary data instead of JSON', async () => {
  const buffer = Buffer.from([0x49, 0x44, 0x33, 0, 0xff, 0x80]);
  const { calls, output } = await execute({ resource: 'call', operation: 'callRecording', gp_callId: 'CALL' }, { respond: () => buffer });
  assert.equal(calls[0].json, false);
  assert.equal(calls[0].encoding, 'arraybuffer');
  assert.equal(output[0][0].binary.data.mimeType, 'audio/mpeg');
  assert.deepEqual(Buffer.from(output[0][0].binary.data.data, 'base64'), buffer);
  assert.deepEqual(output[0][0].pairedItem, { item: 0 });
});

test('array, empty, primitive and object responses have valid JSON objects and input links', async () => {
  const responses = [[{ id: 'a' }, { id: 'b' }], [], undefined, true, { id: 'last' }];
  const { output } = await execute({ resource: 'group', operation: 'listGroups' }, { inputs: responses.map(() => ({ json: {} })), respond: (_req, index) => responses[index] });
  assert.deepEqual(output[0], [
    { json: { id: 'a' }, pairedItem: { item: 0 } }, { json: { id: 'b' }, pairedItem: { item: 0 } },
    { json: {}, pairedItem: { item: 2 } }, { json: { value: true }, pairedItem: { item: 3 } },
    { json: { id: 'last' }, pairedItem: { item: 4 } },
  ]);
});

test('continueOnFail preserves links across a failed item without exposing tokens', async () => {
  const result = await execute({ resource: 'instance', operation: 'getStatus' }, { inputs: [{ json: {} }, { json: {} }], continueOnFail: true, respond: (_req, index) => {
    if (!index) throw { statusCode: 401, message: credentials.token };
    return { connected: true };
  } });
  assert.equal(JSON.stringify(result.output).includes(credentials.token), false);
  assert.deepEqual(result.output[0].map(item => item.pairedItem), [{ item: 0 }, { item: 1 }]);
});

test('legacy transcription workflows retain false mirror default and explicit true is forwarded', async () => {
  for (const mirror of [undefined, false, true]) {
    const params = { resource: 'instance', operation: 'setTranscription', transcriptionMaxAudioSeconds: 60, transcriptionMonthlyCap: 50 };
    if (mirror !== undefined) params.transcriptionMirrorToText = mirror;
    const { calls } = await execute(params);
    assert.equal(calls[0].body.transcription.mirror_to_text, mirror === true);
    assert.equal(calls[0].body.api_key, undefined);
  }
});

test('malformed JSON, blank paths, unknown operations and missing instance credentials fail before HTTP', async () => {
  for (const [params, credentialOverride] of [
    [{ resource: 'newsletter', operation: 'createNewsletter', gp_body: '[]' }, {}],
    [{ resource: 'newsletter', operation: 'createNewsletter', gp_body: 'null' }, {}],
    [{ resource: 'partner', operation: 'externalGetInstance', gp_instance: '' }, {}],
    [{ resource: 'invalid', operation: 'invalid' }, {}],
    [{ resource: 'instanceExtra', operation: 'pairingCodePost' }, {}],
    [{ resource: 'instance', operation: 'getStatus' }, { instance: '', token: '' }],
  ]) {
    let called = false;
    await assert.rejects(execute(params, { credentials: credentialOverride, respond: () => { called = true; } }));
    assert.equal(called, false);
  }
});

test('credential test is read-only and selects account or instance route for old and new credentials', () => {
  const testRequest = new WaflyApi().test.request;
  assert.equal(testRequest.method, 'GET');
  const workflow = new Workflow({ id: 'test', name: 'Credential Test', active: false,
    nodes: [{ name: 'Credential Test', type: 'fixture', typeVersion: 1, position: [0, 0], parameters: {} }],
    connections: {}, nodeTypes: { getByNameAndVersion() { return { description: { properties: [] } }; } },
  });
  for (const [data, baseURL, url] of [
    [{ baseUrl: 'https://fixture.test/api-bridge-whats/', instance: 'ID', token: 'TOKEN' }, 'https://fixture.test/api-bridge-whats', '/instances/ID/token/TOKEN/status'],
    [{ baseUrl: 'https://fixture.test/api-bridge-whats/', instance: '', token: '' }, 'https://fixture.test/api-managment', '/external/instances?limit=1'],
    [{ baseUrl: 'https://fixture.test/custom', managementBaseUrl: 'https://management.test/custom/', instance: '', token: '' }, 'https://management.test/custom', '/external/instances?limit=1'],
  ]) {
    const evaluate = expression => workflow.expression.resolveSimpleParameterValue(expression, {}, null, 0, 0, 'Credential Test', [], 'manual', { $credentials: data });
    assert.equal(evaluate(testRequest.baseURL), baseURL);
    assert.equal(evaluate(testRequest.url), url);
  }
  assert.equal(GENERATED_OPERATIONS['newsletter:deleteNewsletter'].hasBody, true);
});
