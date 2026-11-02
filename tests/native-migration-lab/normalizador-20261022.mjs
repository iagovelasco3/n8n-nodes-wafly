// Wafly Migration Kit v1 — 2026-10-22. Texto recebido individual, sem rede.
// provider e expectedInstance devem vir de configuração confiável no servidor.
// Não autentica webhook, não envia mensagens e não mantém deduplicação persistente.
export function normalizeInbound(provider, payload, { expectedInstance } = {}) {
  const reject = reason => ({ accepted: false, reason });
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const identifier = value => typeof value === 'string' && value.length > 0
    && value.length <= 200 && value === value.trim() && !/[\u0000-\u001f]/.test(value);
  if (!['evolution2', 'zapi', 'wafly'].includes(provider)) return reject('provider_nao_suportado');
  if (!identifier(expectedInstance) || /^(SUA_|SEU_)/.test(expectedInstance)) return reject('configure_instancia');
  if (!record(payload)) return reject('payload_invalido');

  let instance, messageId, phone, text;
  if (provider === 'evolution2') {
    if (!['messages.upsert', 'MESSAGES_UPSERT'].includes(payload.event)) return reject('evento_fora_do_escopo');
    instance = payload.instance;
    if (instance !== expectedInstance) return reject('instancia_divergente');
    const data = payload.data;
    if (!record(data) || !record(data.key)) return reject('payload_invalido');
    if (data.key.fromMe !== false) return reject('mensagem_propria_ou_direcao_incerta');
    // LID, grupos, canais e status não são convertidos em telefones por heurística.
    if (typeof data.key.remoteJid !== 'string'
      || !/^\d{10,15}@s\.whatsapp\.net$/.test(data.key.remoteJid)) return reject('destino_fora_do_escopo');
    if (data.key.participant) return reject('destino_fora_do_escopo');
    if (!record(data.message)) return reject('conteudo_fora_do_escopo');
    const keys = Object.keys(data.message).filter(key => key !== 'messageContextInfo');
    if (keys.length !== 1) return reject('conteudo_fora_do_escopo');
    if (keys[0] === 'conversation') text = data.message.conversation;
    else if (keys[0] === 'extendedTextMessage' && record(data.message.extendedTextMessage)) {
      text = data.message.extendedTextMessage.text;
    } else return reject('conteudo_fora_do_escopo');
    messageId = data.key.id;
    phone = data.key.remoteJid.slice(0, -'@s.whatsapp.net'.length);
  } else {
    if (payload.type !== 'ReceivedCallback') return reject('evento_fora_do_escopo');
    instance = payload.instanceId;
    if (instance !== expectedInstance) return reject('instancia_divergente');
    if (payload.fromMe !== false) return reject('mensagem_propria_ou_direcao_incerta');
    if (payload.isGroup !== false || ['isNewsletter', 'broadcast', 'isStatusReply'].some(
      flag => payload[flag] != null && payload[flag] !== false)
      || payload.participantPhone) return reject('destino_fora_do_escopo');
    if (['isEdit', 'waitingMessage'].some(flag => payload[flag] != null && payload[flag] !== false)) {
      return reject('conteudo_fora_do_escopo');
    }
    const unsupported = ['image', 'audio', 'video', 'document', 'sticker', 'contact', 'location',
      'reaction', 'notification', 'buttonsResponseMessage', 'listResponseMessage', 'pollVote',
      'hydratedTemplate', 'buttonsMessage', 'carouselMessage', 'statusImage'];
    if (unsupported.some(key => payload[key] != null) || !record(payload.text)) return reject('conteudo_fora_do_escopo');
    messageId = payload.messageId;
    phone = payload.phone;
    text = payload.text.message;
  }
  if (!identifier(messageId)) return reject('id_invalido');
  if (typeof phone !== 'string' || !/^\d{10,15}$/.test(phone)) return reject('telefone_invalido');
  if (typeof text !== 'string' || !text.trim() || text.length > 10000) return reject('texto_invalido');
  return {
    accepted: true,
    reason: 'texto_individual',
    event: {
      provider, instance, message_id: messageId, phone, text, type: 'text',
      is_group: false, from_me: false,
      // Persista esta chave com unicidade atômica antes de executar efeitos externos.
      dedupe_key: JSON.stringify([provider, instance, messageId]),
    },
  };
}
