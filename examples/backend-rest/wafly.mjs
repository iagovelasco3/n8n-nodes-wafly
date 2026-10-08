import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { mkdir, open, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const required = (env, name) => {
  const value = env[name]?.trim();
  if (!value || /^(SUA_|SEU_|GERAR_)/.test(value)) throw new Error(`Configure ${name}`);
  return value;
};

export function configFromEnv(env = process.env) {
  const base = new URL(env.WAFLY_BASE_URL || 'https://wafly.com.br/api-bridge-whats');
  if (base.protocol !== 'https:' || !['wafly.com.br', 'wafly.io'].includes(base.hostname)
      || base.pathname !== '/api-bridge-whats' || base.search || base.hash
      || base.username || base.password || base.port) throw new Error('Base Wafly inválida');
  return {
    baseUrl: base.href,
    instance: required(env, 'WAFLY_INSTANCE'),
    instanceToken: required(env, 'WAFLY_INSTANCE_TOKEN'),
    clientToken: required(env, 'WAFLY_CLIENT_TOKEN'),
    testPhone: required(env, 'WAFLY_TEST_PHONE'),
  };
}

export async function sendTestText(config, phone, message, fetchImpl = fetch) {
  if (!/^\d{10,15}$/.test(phone) || phone !== config.testPhone) {
    throw new Error('Somente o número próprio configurado para teste é permitido');
  }
  if (typeof message !== 'string' || !message.trim() || message.length > 1000) {
    throw new Error('Mensagem deve ter entre 1 e 1000 caracteres');
  }
  const endpoint = `${config.baseUrl}/instances/${encodeURIComponent(config.instance)}`
    + `/token/${encodeURIComponent(config.instanceToken)}/send-text`;
  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: { 'Client-Token': config.clientToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message: message.trim() }),
    });
  } catch {
    // Um timeout pode ocorrer depois do aceite. Não reenviar automaticamente.
    throw new Error('Resposta inconclusiva; reconcilie antes de repetir o envio');
  }
  if (!response.ok) throw new Error(`API recusou o envio: HTTP ${response.status}`);
  const body = await response.json().catch(() => null);
  return {
    httpStatus: response.status,
    acceptedByApi: true,
    messageId: body?.messageId ?? body?.zapiMessageId ?? body?.id ?? null,
    delivered: null, read: null,
  };
}

export function normalizeReceived(body, instance) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  if (body.type !== 'ReceivedCallback' || body.instanceId !== instance
      || body.fromMe !== false || body.isGroup !== false
      || body.isNewsletter === true || body.isEdit === true || body.broadcast === true
      || body.waitingMessage === true || body.isStatusReply === true) return null;
  if (typeof body.messageId !== 'string' || !body.messageId || body.messageId.length > 200
      || typeof body.phone !== 'string' || !/^\d{10,15}$/.test(body.phone)
      || typeof body.text?.message !== 'string' || !body.text.message.trim()
      || body.text.message.length > 10000) return null;
  return {
    instanceId: instance, messageId: body.messageId, phone: body.phone,
    text: body.text.message, receivedAt: new Date().toISOString(),
  };
}

export async function createInbox(filename) {
  await mkdir(dirname(filename), { recursive: true, mode: 0o700 });
  const seen = new Set();
  const journal = await readFile(filename, 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '';
    throw error;
  });
  for (const line of journal.split('\n').filter(Boolean)) {
    const event = JSON.parse(line); // Falhar fechado se o journal estiver corrompido.
    seen.add(JSON.stringify([event.instanceId, event.messageId]));
  }
  let pending = Promise.resolve();
  return async event => {
    const write = async () => {
      const key = JSON.stringify([event.instanceId, event.messageId]);
      if (seen.has(key)) return false;
      const file = await open(filename, 'a', 0o600);
      try { await file.writeFile(`${JSON.stringify(event)}\n`); await file.sync(); }
      finally { await file.close(); }
      seen.add(key);
      return true;
    };
    const job = pending.then(write);
    pending = job.catch(() => {});
    return job;
  };
}

function sameSecret(actual, expected) {
  const a = Buffer.from(actual), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createReceiver({ instance, secret, record }) {
  if (!instance || !secret || secret.length < 48 || /^(SEU_|GERAR_)/.test(secret)) {
    throw new Error('Instância e segredo próprio de pelo menos 48 caracteres são obrigatórios');
  }
  return createServer(async (req, res) => {
    const reply = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(body));
    };
    if (req.method === 'GET' && req.url === '/health') return reply(200, { ok: true });
    // Não logue a URL: o caminho secreto não é uma assinatura do provedor.
    const suffix = req.url?.startsWith('/webhooks/wafly/')
      ? req.url.slice('/webhooks/wafly/'.length) : '';
    if (req.method !== 'POST' || !sameSecret(suffix, secret)) return reply(404, { error: 'not_found' });
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
      return reply(415, { error: 'json_required' });
    }
    try {
      let size = 0; const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 65536) { reply(413, { error: 'body_too_large' }); req.resume(); return; }
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { return reply(400, { error: 'invalid_json' }); }
      const event = normalizeReceived(body, instance);
      if (!event) return reply(200, { accepted: false, ignored: true });
      // Persistência confirmada antes do ACK. Não executa IA nem responde ao WhatsApp.
      const inserted = await record(event);
      return reply(200, { accepted: true, duplicate: !inserted });
    } catch { return reply(503, { error: 'storage_unavailable' }); }
  });
}

async function main() {
  const command = process.argv[2];
  if (command === 'send') {
    if (process.argv[3] !== '--confirm') throw new Error('Use send --confirm para um envio real');
    const config = configFromEnv();
    const message = process.argv[4] || 'Teste próprio da integração Wafly REST. Responda para validar o recebimento.';
    console.log(JSON.stringify(await sendTestText(config, config.testPhone, message)));
  } else if (command === 'receive') {
    const instance = required(process.env, 'WAFLY_INSTANCE');
    const secret = required(process.env, 'WEBHOOK_SECRET');
    const record = await createInbox(resolve('data/inbox.ndjson'));
    const server = createReceiver({ instance, secret, record });
    const port = Number(process.env.PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Porta inválida');
    server.listen(port, '127.0.0.1', () => console.log(`Receiver local na porta ${port}; sem resposta automática`));
  } else throw new Error('Escolha receive ou send --confirm');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
