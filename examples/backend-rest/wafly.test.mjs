import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { configFromEnv, sendTestText, normalizeReceived, createInbox, createReceiver } from './wafly.mjs';

const env = {
  WAFLY_INSTANCE: 'fixture-instance', WAFLY_INSTANCE_TOKEN: 'fixture-token',
  WAFLY_CLIENT_TOKEN: 'fixture-client', WAFLY_TEST_PHONE: '5511999999999',
};
const event = () => ({ type: 'ReceivedCallback', instanceId: env.WAFLY_INSTANCE,
  messageId: 'fixture-message', phone: env.WAFLY_TEST_PHONE, text: { message: 'Olá' },
  fromMe: false, isGroup: false });
const secret = 'a'.repeat(48);

test('configuration accepts only Wafly hosts and non-placeholder credentials', () => {
  assert.equal(configFromEnv(env).baseUrl, 'https://wafly.com.br/api-bridge-whats');
  for (const base of ['http://wafly.com.br/api-bridge-whats', 'https://evil.example/api-bridge-whats',
    'https://wafly.com.br/api-bridge-whats?token=x', 'https://user@wafly.com.br/api-bridge-whats']) {
    assert.throws(() => configFromEnv({ ...env, WAFLY_BASE_URL: base }));
  }
  assert.throws(() => configFromEnv({ ...env, WAFLY_INSTANCE_TOKEN: 'SEU_TOKEN' }));
});

test('send keeps the contract, blocks redirects and does not confuse acceptance with delivery', async () => {
  let calls = 0;
  const result = await sendTestText(configFromEnv(env), env.WAFLY_TEST_PHONE, ' Olá ', async (url, options) => {
    calls++;
    assert.equal(url, 'https://wafly.com.br/api-bridge-whats/instances/fixture-instance/token/fixture-token/send-text');
    assert.equal(options.headers['Client-Token'], 'fixture-client');
    assert.equal(options.redirect, 'error');
    assert.deepEqual(JSON.parse(options.body), { phone: env.WAFLY_TEST_PHONE, message: 'Olá' });
    return new Response(JSON.stringify({ messageId: 'receipt' }), { status: 201 });
  });
  assert.deepEqual(result, { httpStatus: 201, acceptedByApi: true, messageId: 'receipt', delivered: null, read: null });
  assert.equal(calls, 1);
});

test('send refuses a different recipient and an empty message without an external call', async () => {
  const forbidden = () => { throw new Error('should not be called'); };
  await assert.rejects(sendTestText(configFromEnv(env), '5511888888888', 'Olá', forbidden), /número próprio/);
  await assert.rejects(sendTestText(configFromEnv(env), env.WAFLY_TEST_PHONE, '', forbidden), /Mensagem/);
});

test('send failures are sanitized, inconclusive when needed and never retried', async () => {
  let calls = 0;
  await assert.rejects(sendTestText(configFromEnv(env), env.WAFLY_TEST_PHONE, 'Olá', async () => {
    calls++; throw new Error('fixture-token fixture-client');
  }), /Resposta inconclusiva/);
  assert.equal(calls, 1);
  await assert.rejects(sendTestText(configFromEnv(env), env.WAFLY_TEST_PHONE, 'Olá', async () =>
    new Response('fixture-token', { status: 401 })), /HTTP 401/);
});

test('normalization ignores groups, echoes, other instances and events without text', () => {
  assert.equal(normalizeReceived(event(), env.WAFLY_INSTANCE).text, 'Olá');
  for (const change of [{ fromMe: true }, { isGroup: true }, { instanceId: 'other' },
    { type: 'DeliveryCallback' }, { text: undefined }, { messageId: '' }, { isEdit: true },
    { isNewsletter: true }, { broadcast: true }, { phone: 'invalid' }]) {
    assert.equal(normalizeReceived({ ...event(), ...change }, env.WAFLY_INSTANCE), null);
  }
});

test('journal persists before the ACK and deduplicates concurrency and restarts', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'wafly-rest-test-'));
  t.after(() => rm(dir, { recursive: true }));
  const filename = join(dir, 'inbox.ndjson');
  const record = await createInbox(filename);
  const normalized = normalizeReceived(event(), env.WAFLY_INSTANCE);
  assert.deepEqual(await Promise.all([record(normalized), record(normalized)]), [true, false]);
  assert.equal((await readFile(filename, 'utf8')).trim().split('\n').length, 1);
  assert.equal(await (await createInbox(filename))(normalized), false);
  await writeFile(filename, 'invalid journal\n');
  await assert.rejects(createInbox(filename));
});

async function receiver(t, record = async () => true) {
  const server = createReceiver({ instance: env.WAFLY_INSTANCE, secret, record });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, post: (body, path = secret, contentType = 'application/json') => fetch(`${base}/webhooks/wafly/${path}`,
    { method: 'POST', headers: { 'Content-Type': contentType }, body: typeof body === 'string' ? body : JSON.stringify(body) }) };
}

test('receiver over real local HTTP: secret, JSON, payload and health', async t => {
  let writes = 0;
  const { base, post } = await receiver(t, async () => { writes++; return true; });
  assert.equal((await fetch(`${base}/health`)).status, 200);
  assert.equal((await post(event(), 'wrong')).status, 404);
  assert.equal((await post(event(), secret, 'text/plain')).status, 415);
  assert.equal((await post('invalid')).status, 400);
  assert.equal((await post('x'.repeat(70000))).status, 413);
  const ignored = await post({ ...event(), fromMe: true });
  assert.deepEqual(await ignored.json(), { accepted: false, ignored: true });
  const accepted = await post(event());
  assert.deepEqual(await accepted.json(), { accepted: true, duplicate: false });
  assert.equal(writes, 1);
});

test('receiver acknowledges duplicates and refuses the ACK when persistence fails', async t => {
  const duplicate = await receiver(t, async () => false);
  assert.deepEqual(await (await duplicate.post(event())).json(), { accepted: true, duplicate: true });
  const failed = await receiver(t, async () => { throw new Error('private storage'); });
  assert.equal((await failed.post(event())).status, 503);
});

test('receiver requires a strong secret', () => {
  assert.throws(() => createReceiver({ instance: env.WAFLY_INSTANCE, secret: 'short', record: async () => true }));
});
