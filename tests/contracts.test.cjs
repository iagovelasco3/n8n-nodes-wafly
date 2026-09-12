const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Wafly } = require('../dist/nodes/Wafly/Wafly.node');
const { WaflyApi } = require('../dist/credentials/WaflyApi.credentials');

const node = new Wafly();
const baseUrl = 'https://example.test/api-bridge-whats';
const basePath = '/instances/TEST_INSTANCE/token/TEST_TOKEN';

async function execute(parameters, respond = () => ({}), continueOnFail = false) {
  const calls = [];
  const context = {
    getInputData: () => [{ json: {} }],
    getCredentials: async () => ({ baseUrl, instance: 'TEST_INSTANCE', token: 'TEST_TOKEN' }),
    getNodeParameter: (name, _index, fallback) => parameters[name] ?? fallback,
    getNode: () => ({ name: 'Wafly', type: 'n8n-nodes-wafly.wafly', typeVersion: 1, position: [0, 0], parameters }),
    continueOnFail: () => continueOnFail,
    helpers: {
      async httpRequestWithAuthentication(credential, request) {
        assert.equal(credential, 'waflyApi');
        calls.push(request);
        return respond(request);
      },
      returnJsonArray(values) {
        return values.map((json) => {
          assert.equal(typeof json, 'object');
          assert.notEqual(json, null);
          return { json };
        });
      },
    },
  };
  const output = await node.execute.call(context);
  return { calls, output };
}

test('pairing GET and POST send a required phone in the query, with no JSON body', async () => {
  for (const [operation, method] of [['pairingCode', 'GET'], ['pairingCodePost', 'POST']]) {
    const field = node.description.properties.find((property) =>
      property.name === 'gq_phone' && property.displayOptions.show.operation.includes(operation));
    assert.equal(field.required, true);
    const result = await execute({ resource: 'instanceExtra', operation, gq_phone: ' 5511999999999 ' }, (request) => {
      assert.equal(request.method, method);
      assert.equal(request.url, `${baseUrl}${basePath}/pairing-code`);
      assert.deepEqual(request.qs, { phone: '5511999999999' });
      assert.equal(request.body, undefined);
      return { code: '1234-5678', message: 'Pairing code generated' };
    });
    assert.equal(result.output[0][0].json.code, '1234-5678');
  }
});

test('pairing preserves the phone saved in legacy JSON workflows', async () => {
  for (const gp_body of ['{"phone":"5511999999999"}', { phone: '5511999999999' }]) {
    const result = await execute({ resource: 'instanceExtra', operation: 'pairingCodePost', gp_body });
    assert.deepEqual(result.calls[0].qs, { phone: '5511999999999' });
    assert.equal(result.calls[0].body, undefined);
  }
});

test('missing pairing phone fails before making an HTTP request', async () => {
  let called = false;
  await assert.rejects(
    execute({ resource: 'instanceExtra', operation: 'pairingCode' }, () => { called = true; }),
    /phone field is required/,
  );
  assert.equal(called, false);
});

test('webhook Set and Delete use the public PUT/value contract and accept HTTP 204', async () => {
  for (const [operation, webhookUrl, value] of [
    ['setWebhook', ' https://example.test/webhook/production ', 'https://example.test/webhook/production'],
    ['deleteWebhook', undefined, ''],
  ]) {
    const result = await execute({ resource: 'webhook', operation, webhookUrl }, (request) => {
      assert.equal(request.method, 'PUT');
      assert.equal(request.url, `${baseUrl}${basePath}/update-webhook-received`);
      assert.deepEqual(request.body, { value });
      return undefined; // n8n HTTP helper response for 204 No Content
    });
    assert.deepEqual(result.output, [[{ json: {} }]]);
  }
});

test('Set Webhook cannot silently clear the configuration with an empty URL', async () => {
  let called = false;
  await assert.rejects(
    execute({ resource: 'webhook', operation: 'setWebhook', webhookUrl: ' ' }, () => { called = true; }),
    /Enter the production webhook URL/,
  );
  assert.equal(called, false);
});

test('Get Webhook returns the stored server response instead of a local success value', async () => {
  const stored = { webhookUrl: 'https://example.test/live', value: 'https://example.test/live' };
  const result = await execute({ resource: 'webhook', operation: 'getWebhook' }, (request) => {
    assert.equal(request.method, 'GET');
    assert.equal(request.url, `${baseUrl}${basePath}/webhook`);
    return stored;
  });
  assert.deepEqual(result.output, [[{ json: stored }]]);
});

test('HTTP authentication/server failures remain failed executions', async () => {
  for (const statusCode of [401, 404, 502]) {
    await assert.rejects(
      execute({ resource: 'webhook', operation: 'setWebhook', webhookUrl: 'https://example.test/live' }, () => {
        throw { statusCode, message: 'Upstream request failed' };
      }),
      (error) => error.name === 'NodeApiError' && error.httpCode === String(statusCode),
    );
  }
});

test('continueOnFail preserves failure without leaking the credential URL', async () => {
  const result = await execute({ resource: 'instance', operation: 'getStatus' }, () => {
    throw { statusCode: 401, message: `Request failed at ${baseUrl}${basePath}/status` };
  }, true);
  assert.deepEqual(result.output, [[{ json: { error: 'Request failed. Check node credentials and configuration.' } }]]);
  assert.equal(JSON.stringify(result.output).includes('TEST_TOKEN'), false);
});

test('QR, status, connect and disconnect keep the public routes and response payloads', async () => {
  for (const [resource, operation, suffix, method, payload] of [
    ['instance', 'getQrCode', '/qr-code', 'GET', { value: 'raw-qr' }],
    ['instanceExtra', 'getQrCode', '/qr-code/image', 'GET', { value: 'base64-png' }],
    ['instance', 'getStatus', '/status', 'GET', { connected: false, smartphoneConnected: false }],
    ['instance', 'connect', '/connect', 'POST', { value: true }],
    ['instance', 'disconnect', '/disconnect', 'GET', { value: true }],
  ]) {
    const result = await execute({ resource, operation }, (request) => {
      assert.equal(request.method, method);
      assert.equal(request.url, `${baseUrl}${basePath}${suffix}`);
      return payload;
    });
    assert.deepEqual(result.output, [[{ json: payload }]]);
  }
  assert.equal(new WaflyApi().authenticate.properties.headers['Client-Token'], '={{$credentials.clientToken}}');
});

test('schema generation keeps fields on their own endpoint and supports paginated queries', async () => {
  const bodyProperty = node.description.properties.find((property) => property.name === 'gp_body' &&
    property.displayOptions.show.resource.includes('instanceExtra'));
  assert.equal(bodyProperty.displayOptions.show.operation.includes('pairingCodePost'), false);
  assert.equal(bodyProperty.description.includes('passkeyResponse → phones'), false);
  const result = await execute({ resource: 'chat', operation: 'listChats', gq_page: '1', gq_pageSize: '20' });
  assert.deepEqual(result.calls[0].qs, { page: '1', pageSize: '20' });
});
