// Execute com Node.js 18+: node testar-kit-20261022.mjs
// Mesma pasta: normalizador-20261022.mjs e amostras-20261022.json.
// Somente fixtures locais; não há envio, rede ou armazenamento de eventos.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeInbound } from './normalizador-20261022.mjs';

const fixtures = JSON.parse(await readFile(new URL('./amostras-20261022.json', import.meta.url), 'utf8'));
assert.equal(fixtures.synthetic, true);
let checks = 0;
const check = (value, expected) => { assert.deepEqual(value, expected); checks++; };
for (const sample of fixtures.cases) {
  const original = JSON.stringify(sample.payload);
  const result = normalizeInbound(sample.provider, sample.payload, sample);
  check(result.accepted, sample.expectedAccepted);
  if (sample.expectedReason) check(result.reason, sample.expectedReason);
  check(JSON.stringify(sample.payload), original);
  if (result.accepted) {
    check(result.event.instance, sample.expectedInstance);
    check(result.event.is_group, false);
    check(result.event.from_me, false);
    check(result.event.dedupe_key, JSON.stringify([sample.provider, sample.expectedInstance, result.event.message_id]));
  } else check(Object.hasOwn(result, 'event'), false);
}

const received = fixtures.cases.find(sample => sample.provider === 'wafly' && sample.expectedAccepted);
const clone = () => structuredClone(received.payload);
const normalize = payload => normalizeInbound('wafly', payload, received);
for (const payload of [null, [], {}, 'texto', 42]) check(normalize(payload).accepted, false);
for (const flag of ['fromMe', 'isGroup', 'isNewsletter', 'broadcast', 'isStatusReply', 'isEdit', 'waitingMessage']) {
  const payload = clone(); payload[flag] = 'false';
  check(normalize(payload).accepted, false);
}
for (const phone of ['+5511000000000', '5511000000000@lid', '5511000000000-group', '', 5511000000000]) {
  const payload = clone(); payload.phone = phone;
  check(normalize(payload).accepted, false);
}
for (const text of ['', '   ', 'a'.repeat(10001), null]) {
  const payload = clone(); payload.text.message = text;
  check(normalize(payload).accepted, false);
}
for (const messageId of ['', 'a'.repeat(201), '\nid', 123]) {
  const payload = clone(); payload.messageId = messageId;
  check(normalize(payload).accepted, false);
}
check(normalizeInbound('desconhecido', clone(), received).accepted, false);
check(normalizeInbound('wafly', clone()).reason, 'configure_instancia');
check(normalizeInbound('wafly', clone(), { expectedInstance: 'SUA_INSTANCIA' }).reason, 'configure_instancia');
const result = normalize(clone());
check(normalize(clone()).event.dedupe_key, result.event.dedupe_key);
check(normalizeInbound('zapi', clone(), received).event.dedupe_key === result.event.dedupe_key, false);
const different = clone(); different.messageId += '-2';
check(normalize(different).event.dedupe_key === result.event.dedupe_key, false);
console.log(JSON.stringify({ kit: fixtures.version, syntheticCases: fixtures.cases.length, checks, result: 'ok', networkCalls: 0 }));
