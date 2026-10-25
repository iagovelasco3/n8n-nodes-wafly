const assert = require('node:assert/strict');
const { Wafly } = require('../dist/nodes/Wafly/Wafly.node');
const { GENERATED_OPERATIONS } = require('../dist/nodes/Wafly/GeneratedOperations');
const spec = require('../schema/openapi.json');
const node = new Wafly();
const credentials = { baseUrl: 'https://fixture.test/api-bridge-whats', clientToken: 'ACCOUNT_KEY', instance: 'TEST_INSTANCE', token: 'TEST_TOKEN' };
const endpoints = Object.entries(spec.paths).flatMap(([path, methods]) => Object.entries(methods)
  .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
  .map(([method, contract]) => ({ method: method.toUpperCase(), path, contract })));
const operations = node.description.properties.filter(p => p.name === 'operation').flatMap(p =>
  p.displayOptions.show.resource.flatMap(resource => p.options.map(op => ({ resource, operation: op.value }))));
function visible(property, params) {
  return Object.entries(property.displayOptions?.show || {}).every(([key, values]) => values.includes(params[key]));
}
function contractForGenerated(resource, operation) {
  const generated = GENERATED_OPERATIONS[`${resource}:${operation}`];
  if (!generated) return;
  const path = (generated.isPartner ? '/api-managment' : '/api-bridge-whats/instances/{instance}/token/{token}') + generated.path;
  return endpoints.find(ep => ep.method === generated.method && ep.path === path)?.contract;
}
function parametersFor(resource, operation) {
  const params = { resource, operation };
  const contract = contractForGenerated(resource, operation);
  for (const field of node.description.properties) {
    if (['resource', 'operation'].includes(field.name) || !visible(field, params)) continue;
    let value = field.default;
    if (field.name === 'gp_body') value = contract?.requestBody?.content?.['application/json']?.example || {};
    else if (field.name === 'webhookUrl') value = 'https://fixture.test/webhook';
    else if (field.type === 'json') value = '[]';
    else if (field.type === 'number') value = value || 1;
    else if (field.type === 'string' && !value) value = field.name.toLowerCase().includes('phone') ? '5511999999999' : 'TEST_VALUE';
    params[field.name] = value;
  }
  return params;
}
async function execute(params, options = {}) {
  const calls = [];
  const inputs = options.inputs || [{ json: {} }];
  const context = {
    getInputData: () => inputs,
    getCredentials: async () => ({ ...credentials, ...options.credentials }),
    getNodeParameter: (name, index, fallback) => {
      const value = params[name];
      return typeof value === 'function' ? value(index) : value ?? fallback;
    },
    getNode: () => ({ name: 'Wafly', type: 'n8n-nodes-wafly.wafly', typeVersion: 1, position: [0, 0], parameters: params }),
    continueOnFail: () => !!options.continueOnFail,
    helpers: {
      async httpRequest() {
        throw new Error('httpRequest must not be used: the node authenticates through httpRequestWithAuthentication');
      },
      async httpRequestWithAuthentication(credentialType, request) {
        // n8n injects Client-Token from the credential's `authenticate` block.
        assert.equal(credentialType, 'waflyApi');
        assert.equal(request.headers['Client-Token'], undefined);
        calls.push(request);
        return options.respond ? options.respond(request, calls.length - 1) : {};
      },
      async prepareBinaryData(data, fileName, mimeType) { return { data: data.toString('base64'), fileName, mimeType }; },
    },
  };
  return { calls, output: await node.execute.call(context) };
}
function matchContract(request) {
  let path = new URL(request.url).pathname;
  if (path.endsWith('/send-contact')) path = path.replace(/\/send-contact$/, '/send-contacts');
  if (path.endsWith('/qr-code')) path += '/image';
  return endpoints.find(ep => ep.method === request.method && new RegExp('^' + ep.path.replace(/\{[^}]+\}/g, '[^/]+') + '$').test(path));
}
module.exports = { node, credentials, spec, endpoints, operations, parametersFor, execute, matchContract };
