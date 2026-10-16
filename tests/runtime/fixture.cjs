// Local HTTP contract fixture. Never forwards requests to Wafly or WhatsApp.
const http = require('node:http');
const fs = require('node:fs');
const spec = require('./openapi.json');
const audio = Buffer.from([0x49, 0x44, 0x33, 0, 0xff, 0x80]);
const contracts = Object.entries(spec.paths).flatMap(([path, methods]) => Object.entries(methods)
  .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
  .map(([method, value]) => ({ method: method.toUpperCase(), path, value, regex: new RegExp('^' + path.replace(/\{[^}]+\}/g, '[^/]+') + '$') })));
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://fixture');
  if (url.pathname === '/health') { res.end('ok'); return; }
  let raw = '';
  for await (const chunk of req) raw += chunk;
  let body;
  try { body = raw ? JSON.parse(raw) : undefined; } catch { res.writeHead(400); res.end('Invalid JSON'); return; }
  let path = url.pathname.replace(/\/send-contact$/, '/send-contacts').replace(/\/qr-code$/, '/qr-code/image');
  const contract = contracts.find(c => c.method === req.method && c.regex.test(path));
  const problems = [];
  if (req.headers['client-token'] !== 'FIXTURE_CLIENT_KEY') problems.push('Client-Token not injected');
  if (!contract && !path.endsWith('/send-location') && !path.endsWith('/webhook')) problems.push('Unknown method or route');
  for (const field of contract?.value.parameters || []) {
    if (field.required && field.in === 'query' && !url.searchParams.has(field.name)) problems.push('Missing query ' + field.name);
  }
  const content = contract?.value.requestBody?.content?.['application/json'];
  if (contract?.value.requestBody?.required && body === undefined) problems.push('Missing body');
  if (body) for (const field of content?.schema?.required || []) {
    if (field.split('.').reduce((v, k) => v?.[k], body) === undefined) problems.push('Missing body field ' + field);
  }
  const record = { method: req.method, path, query: Object.fromEntries(url.searchParams), body, idempotencyKey: req.headers['idempotency-key'], authenticated: req.headers['client-token'] === 'FIXTURE_CLIENT_KEY', problems };
  fs.appendFileSync('/work/requests.jsonl', JSON.stringify(record) + '\n');
  res.setHeader('Content-Type', 'application/json');
  if (problems.length) { res.writeHead(400); res.end(JSON.stringify({ error: problems.join(', ') })); return; }
  const failure = body?.message === 'FAIL401' || body?.message === 'FAIL409' ? Number(body.message.slice(4))
    : body?.receivedCallbackUrl?.endsWith('/fail401') || body?.caption === 'FAIL401' || path.endsWith('/SIMULATE401') ? 401
    : body?.receivedCallbackUrl?.endsWith('/fail409') ? 409 : null;
  if (failure) {
    res.writeHead(failure); res.end(JSON.stringify({ error: 'Intentional fixture failure' })); return;
  }
  if (contract?.value.operationId === 'call-recording') { res.writeHead(200, { 'Content-Type': 'audio/mpeg' }); res.end(audio); return; }
  if (path.includes('/update-webhook-')) { res.writeHead(204); res.end(); return; }
  if (path.endsWith('/status')) { res.end(JSON.stringify({ connected: true, smartphoneConnected: true })); return; }
  if (path.endsWith('/groups')) { res.end(JSON.stringify([{ id: 'group-one' }, { id: 'group-two' }])); return; }
  if (req.method === 'POST' && path === '/api-managment/external/instances') {
    res.end(JSON.stringify({ created: body?.acceptAutomaticBilling === true || body?.creationPolicy === 'extra_instance_72h_v1', mode: body?.acceptAutomaticBilling || body?.creationPolicy ? 'live' : 'preview', received: record })); return;
  }
  res.end(JSON.stringify({ fixture: true, received: record }));
}).listen(3000, '0.0.0.0', () => console.log('Contract fixture listening on 3000'));
