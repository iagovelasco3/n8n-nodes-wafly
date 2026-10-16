#!/usr/bin/env node
// Generate from a reviewed, committed OpenAPI snapshot. Builds never fetch the
// network or depend on a neighboring frontend checkout. Refresh with sync:api.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = process.env.WAFLY_SCHEMA_PATH
  ? resolve(process.env.WAFLY_SCHEMA_PATH)
  : resolve(__dirname, '../schema/openapi.json');
const OUT_PATH = resolve(__dirname, '../nodes/Wafly/GeneratedOperations.ts');
const NODE_PATH = resolve(__dirname, '../nodes/Wafly/Wafly.node.ts');
const RESOURCE_OPTIONS_START = '// GENERATED_RESOURCE_OPTIONS:START';
const RESOURCE_OPTIONS_END = '// GENERATED_RESOURCE_OPTIONS:END';
const NODE_PROPERTIES_START = '// GENERATED_NODE_PROPERTIES:START';
const NODE_PROPERTIES_END = '// GENERATED_NODE_PROPERTIES:END';
const spec = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
const nodeSrc = readFileSync(NODE_PATH, 'utf8');
const legacyKeys = new Set([...readFileSync(OUT_PATH, 'utf8').matchAll(/^  '([^']+)':/gm)].map(m => m[1]));
const SECTION_BY_TAG = {
  'Instância': 'instancia', 'Mensagens': 'mensagens', 'Grupos': 'grupos',
  'Newsletter / Canais': 'newsletter', 'Chats': 'chats', 'Comunidades': 'comunidades',
  'Chamadas (beta)': 'chamadas', 'Webhooks': 'webhook',
  'Gerenciamento pela API': 'parceiros', 'Status do WhatsApp': 'status-publication',
};
const sections = [];
const seenIds = new Set();
for (const [path, methods] of Object.entries(spec.paths || {})) {
  for (const [verb, operation] of Object.entries(methods)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(verb)) continue;
    const id = SECTION_BY_TAG[operation.tags?.[0]];
    if (!id || !operation.operationId || !operation.summary || seenIds.has(operation.operationId)) {
      throw new Error(`Unmapped or invalid API operation: ${verb} ${path}`);
    }
    seenIds.add(operation.operationId);
    let section = sections.find(s => s.id === id);
    if (!section) { section = { id, endpoints: [] }; sections.push(section); }
    const content = operation.requestBody?.content?.['application/json'];
    const bodySchema = content?.schema || {};
    const fields = Object.entries(bodySchema.properties || {}).map(([name, field]) => ({
      name, type: field.type, required: (bodySchema.required || []).includes(name),
    }));
    section.endpoints.push({
      id: operation.operationId, method: verb.toUpperCase(),
      path: path.replace(/^\/api-(?:bridge-whats|managment)/, ''),
      summary: operation.summary, bodyFields: fields,
      queryParams: (operation.parameters || []).filter(p => p.in === 'query').map(p => ({
        name: p.name, required: path.endsWith('/pairing-code') ? verb === 'get' : !!p.required,
      })),
      headerParams: (operation.parameters || []).filter(p => p.in === 'header').map(p => ({
        name: p.name, required: !!p.required,
        field: 'gh_' + p.name.replace(/-([a-z])/gi, (_, c) => c.toUpperCase()).replace(/^./, c => c.toLowerCase()),
      })),
      hasBody: !!content,
      responseType: operation.operationId === 'call-recording' ? 'binary' : 'json',
    });
  }
}
if (!sections.length) throw new Error('The OpenAPI snapshot has no operations.');

// Compare methods as well as paths. Preserve already published generated IDs,
// including aliases with an equivalent hand-written operation.
const implementedPaths = new Set();
for (const m of nodeSrc.matchAll(/endpoint = `([^`]*)`;\s*method = '(GET|POST|PUT|PATCH|DELETE)'/g)) {
  implementedPaths.add(m[2] + ' ' + normalize(m[1].replace('${basePath}', '')));
}
function normalize(p) {
  return p.replace(/\$\{[^}]+\}/g, '*').replace(/\{[^}]+\}/g, '*').split('?')[0].replace(/\/+$/, '');
}
function relPath(p) {
  return p.replace('/instances/{instance}/token/{token}', '') || '/';
}

// --- selection ---------------------------------------------------------------
const RESOURCE_BY_SECTION = {
  instancia: { value: 'instanceExtra', label: 'Instance (More)' },
  mensagens: { value: 'messageExtra', label: 'Message (More)' },
  grupos: { value: 'groupExtra', label: 'Group (More)' },
  newsletter: { value: 'newsletter', label: 'Newsletter / Channel' },
  chats: { value: 'chat', label: 'Chat' },
  comunidades: { value: 'community', label: 'Community' },
  chamadas: { value: 'call', label: 'Call (Beta)' },
  webhook: { value: 'webhookExtra', label: 'Webhook (More)' },
  'status-publication': { value: 'statusPublication', label: 'WhatsApp Status' },
  parceiros: { value: 'partner', label: 'Partner' },
};

// Keep defaults from saved v1 workflows even when new options sort first.
const DEFAULT_OPERATION_BY_RESOURCE = {
  instanceExtra: 'pairingCode', messageExtra: 'pinMessage', groupExtra: 'groupInviteLink',
  newsletter: 'newsletterAcceptAdminInvite', chat: 'chatMetadata', community: 'createCommunity',
  partner: 'partnerCreateInstance', call: 'callAccept',
  statusPublication: 'statusPublicationCapabilities',
};

const BASE_RESOURCES = [
  { value: 'instance', label: 'Instance' },
  { value: 'message', label: 'Message' },
  { value: 'group', label: 'Group' },
  { value: 'webhook', label: 'Webhook' },
];


// --- English labels ----------------------------------------------------------
// The schema lives in the frontend repository and serves the Brazilian
// documentation, so its `summary` fields are in Portuguese. The n8n UI is in
// English — that is the ecosystem convention and the language of the
// hand-written operations in this node. Without this translation the node would
// end up half in each language, which is how it started out.
//
// The translation lives HERE rather than in the schema on purpose: node labels
// are the node's business. Polluting the schema with a field just for this
// would couple the public documentation to one specific consumer.
//
// Any name without an entry here is reported at the end of the run, so
// Portuguese never slips through silently.
const EN_LABEL = {
  'Limpar fila de mensagens': 'Clear Message Queue',
  'Criar instância ou obter exemplo': 'Create Instance or Preview',
  'Listar minhas instâncias': 'List My Instances',
  'Consultar regra da extra Pix': 'Get Extra Pix Trial Policy',
  'Consultar instância': 'Get Instance',
  'Consultar credenciais': 'Get Instance Credentials',
  'Renomear instância': 'Rename Instance',
  'Reiniciar instância': 'Restart Instance',
  'Consultar consequências do cancelamento': 'Get Cancellation Preview',
  'Cancelar instância': 'Cancel Instance',
  'Verificar publicação de status': 'Get Status Publication Capabilities',
  'Publicar imagem ou vídeo no Status': 'Publish Image or Video Status',
  'Consultar uma tentativa de publicação': 'Get Status Publication Receipt',
  'Webhook — mensagem recebida': 'Set Received Message Webhook',
  'Webhook — confirmação de entrega': 'Set Delivery Webhook',
  'Webhook — instância conectada': 'Set Connected Webhook',
  'Webhook — instância desconectada': 'Set Disconnected Webhook',
  'Aceitar convite de admin': 'Accept Admin Invite',
  'Alterar descrição da newsletter': 'Update Newsletter Description',
  'Alterar nome da newsletter': 'Update Newsletter Name',
  'Anexar transcrição': 'Attach Call Transcript',
  'Atender chamada': 'Accept Call',
  'Atualizar foto do grupo (por URL)': 'Update Group Photo From URL',
  'Atualizar imagem da newsletter': 'Update Newsletter Picture',
  'Baixar gravação': 'Download Call Recording',
  'Buscar newsletters': 'Search Newsletters',
  'Configurar chamadas recebidas': 'Set Incoming Call Handling',
  'Configurações da comunidade': 'Update Community Settings',
  'Configurações da newsletter': 'Update Newsletter Settings',
  'Criar comunidade': 'Create Community',
  'Criar instância (parceiro)': 'Create Instance (Partner)',
  'Criar newsletter': 'Create Newsletter',
  // The public bridge reads phone from the query string for both methods.
  'Código de emparelhamento (GET)': 'Get Pairing Code (GET)',
  'Código de emparelhamento (POST)': 'Get Pairing Code (POST)',
  'Deixar de seguir newsletter': 'Unfollow Newsletter',
  'Deletar newsletter': 'Delete Newsletter',
  'Desafio de passkey (WebAuthn)': 'Get Passkey Challenge (WebAuthn)',
  'Desativar comunidade': 'Deactivate Community',
  'Desvincular grupos da comunidade': 'Unlink Groups From Community',
  'Encerrar chamada': 'Terminate Call',
  'Enviar GIF': 'Send GIF',
  'Enviar assinatura de passkey': 'Send Passkey Assertion',
  'Enviar contato': 'Send Contacts',
  'Enviar documento': 'Send Document',
  'Enviar evento': 'Send Event',
  'Enviar lista de opções': 'Send Option List',
  'Enviar vídeo redondo (PTV)': 'Send Round Video (PTV)',
  'Falar texto na chamada (TTS)': 'Speak Text on Call (TTS)',
  'Fixar mensagem': 'Pin Message',
  'Iniciar chamada': 'Start Call',
  'Iniciar gravação': 'Start Call Recording',
  'Listar comunidades': 'List Communities',
  'Listar conversas': 'List Chats',
  'Listar newsletters': 'List Newsletters',
  'Marcar chat como lido/não lido': 'Mark Chat Read or Unread',
  'Metadados da comunidade': 'Get Community Metadata',
  'Metadados da newsletter': 'Get Newsletter Metadata',
  'Metadados de um chat': 'Get Chat Metadata',
  'Obter link de convite': 'Get Group Invite Link',
  'Parar gravação': 'Stop Call Recording',
  'Ponte WebRTC': 'WebRTC Bridge',
  'QR Code para conexão': 'Get QR Code Image',
  'Reativar som da newsletter': 'Unmute Newsletter',
  'Recusar chamada': 'Reject Call',
  'Reiniciar com desconexão': 'Restart With Disconnect',
  'Remover administrador da newsletter': 'Remove Newsletter Admin',
  'Revogar convite de admin': 'Revoke Admin Invite',
  'Seguir newsletter': 'Follow Newsletter',
  'Silenciar newsletter': 'Mute Newsletter',
  'Tocar áudio na chamada': 'Play Audio on Call',
  'Transferir propriedade da newsletter': 'Transfer Newsletter Ownership',
  'Ver configuração de chamadas': 'Get Call Handling Config',
  'Ver transcrição': 'Get Call Transcript',
  'Vincular grupos à comunidade': 'Link Groups To Community',
};

const missingLabels = new Set();
function enLabel(ptSummary) {
  const en = EN_LABEL[ptSummary];
  if (en) return en;
  missingLabels.add(ptSummary);
  return ptSummary;
}

const resources = new Map();
let generatedCount = 0;

for (const section of sections) {
  const res = RESOURCE_BY_SECTION[section.id];
  if (!res) continue;

  for (const ep of section.endpoints) {
    const rel = relPath(ep.path);
    const key = res.value + ':' + toOperationName(ep.id);
    if (!legacyKeys.has(key) && implementedPaths.has(ep.method + ' ' + normalize(rel))) continue;

    const pathParams = [...rel.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
    const opName = toOperationName(ep.id);

    if (!resources.has(res.value)) resources.set(res.value, { ...res, ops: [] });
    resources.get(res.value).ops.push({
      name: opName,
      display: enLabel(ep.summary),
      method: ep.method,
      path: rel,
      pathParams,
      queryParams: ep.queryParams,
      headerParams: ep.headerParams,
      responseType: ep.responseType,
      bodyFields: ep.bodyFields,
      // Preserve the generic JSON input on existing write operations, including
      // endpoints whose schema has not detailed the body yet. Query-only pairing
      // is the exception: its phone must not be sent as a JSON body.
      hasBody: rel !== '/pairing-code' && ep.method !== 'GET' && (ep.hasBody || (ep.method !== 'DELETE' && !ep.queryParams.length)),
      isPartner: section.id === 'parceiros',
    });
    generatedCount++;
  }
}

function toOperationName(id) {
  return id.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
}

function jsStr(s) {
  return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

const generatedKeys = new Set([...resources.values()].flatMap(resource => resource.ops.map(operation => resource.value + ':' + operation.name)));
for (const key of legacyKeys) {
  if (!generatedKeys.has(key)) throw new Error(`Refusing to remove an existing generated operation: ${key}`);
}
if (missingLabels.size) throw new Error('Missing English labels: ' + [...missingLabels].join(', '));

// --- emission ----------------------------------------------------------------
const resourceList = [...resources.values()];

for (const resource of resourceList) {
  resource.ops.sort((a, b) => a.display.localeCompare(b.display, 'en'));
}

const opDefs = [];
const props = [];

for (const res of resourceList) {
  props.push(`  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: [${jsStr(res.value)}] } },
    options: [
${res.ops
  .map(
    (o) => `      { name: ${jsStr(o.display)}, value: ${jsStr(o.name)}, action: ${jsStr(sentenceCase(o.display))} },`
  )
  .join('\n')}
    ],
    default: ${jsStr(DEFAULT_OPERATION_BY_RESOURCE[res.value] || res.ops[0].name)},
  },`);

  // One field per path parameter, shown only on the operations that use it.
  const byParam = new Map();
  for (const o of res.ops) {
    for (const p of o.pathParams) {
      if (!byParam.has(p)) byParam.set(p, []);
      byParam.get(p).push(o.name);
    }
  }
  for (const [param, ops] of byParam) {
    props.push(`  {
    displayName: '${humanize(param)}',
    name: ${jsStr('gp_' + param)},
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: [${jsStr(res.value)}], operation: [${ops.map(jsStr).join(', ')}] } },
    description: 'Value for {${param}} in the request path',
  },`);
  }

  const queryFields = new Map();
  for (const o of res.ops) {
    for (const param of o.queryParams) {
      const key = `${param.name}:${param.required}`;
      if (!queryFields.has(key)) queryFields.set(key, { ...param, operations: [] });
      queryFields.get(key).operations.push(o.name);
    }
  }
  for (const param of queryFields.values()) {
    props.push(`  {
    displayName: ${jsStr(humanize(param.name))},
    name: ${jsStr('gq_' + param.name)},
    type: 'string',
    default: '',
    required: ${param.required},
    displayOptions: { show: { resource: [${jsStr(res.value)}], operation: [${param.operations.map(jsStr).join(', ')}] } },
    description: ${jsStr(param.name === 'phone' ? 'WhatsApp phone number in international format, including country code (e.g. 5511999999999)' : `Value for ${param.name} in the request query`)},
  },`);
  }

  const headerFields = new Map();
  for (const o of res.ops) {
    for (const param of o.headerParams) {
      if (!headerFields.has(param.name)) headerFields.set(param.name, { ...param, operations: [] });
      headerFields.get(param.name).operations.push(o.name);
    }
  }
  for (const param of headerFields.values()) {
    props.push(`  {
    displayName: ${jsStr(humanize(param.name.replace(/-/g, ' ')))},
    name: ${jsStr(param.field)},
    type: 'string',
    default: '',
    required: ${param.required},
    displayOptions: { show: { resource: [${jsStr(res.value)}], operation: [${param.operations.map(jsStr).join(', ')}] } },
    description: 'Required for extra_instance_72h_v1. Keep the same key and body for the same logical creation; do not change the key after an uncertain result.',
  },`);
  }

  // JSON body. A field-by-field form for 60 endpoints would produce a UI that is
  // impossible to maintain; JSON keeps the operation usable and the example of
  // the expected fields goes into the description.
  const withBody = res.ops.filter((o) => o.hasBody);
  if (withBody.length) {
    props.push(`  {
    displayName: 'Body (JSON)',
    name: 'gp_body',
    type: 'json',
    default: '{}',
    displayOptions: { show: { resource: [${jsStr(res.value)}], operation: [${withBody.map((o) => jsStr(o.name)).join(', ')}] } },
    description: '${bodyDescription(withBody)}',
  },`);
  }

  if (res.value === 'instanceExtra') {
    // n8n ignores parameters whose display conditions do not match. Keep this
    // legacy parameter registered for POST pairing so saved JSON expressions
    // can still be resolved by getNodeParameter before moving phone to query.
    props.push(`  {
    displayName: 'Legacy Phone Body',
    name: 'gp_body',
    type: 'hidden',
    default: '{}',
    displayOptions: { show: { resource: ['instanceExtra'], operation: ['pairingCodePost'] } },
  },`);
  }

  for (const o of res.ops) {
    opDefs.push(
      `  ${jsStr(res.value + ':' + o.name)}: { method: ${jsStr(o.method)}, path: ${jsStr(o.path)}, pathParams: [${o.pathParams.map(jsStr).join(', ')}], queryParams: [${o.queryParams.map((param) => `{ name: ${jsStr(param.name)}, required: ${param.required} }`).join(', ')}], headerParams: ${JSON.stringify(o.headerParams)}, hasBody: ${o.hasBody}, isPartner: ${o.isPartner}, responseType: ${jsStr(o.responseType)} },`
    );
  }
}

function humanize(s) {
  return s
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bId\b/g, 'ID')
    .replace(/\bUrl\b/g, 'URL')
    .trim();
}

function sentenceCase(value) {
  const withoutDescriptiveParentheses = value.replace(/\(([^)]+)\)/g, (_, content) =>
    content === content.toUpperCase() ? `(${content})` : content,
  );
  const words = withoutDescriptiveParentheses.split(/\s+/);
  return words
    .map((word, index) => {
      if (word === word.toUpperCase()) return word;
      const normalized = word.toLowerCase();
      return index === 0 ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : normalized;
    })
    .join(' ');
}

function bodyDescription(operations) {
  const fields = operations
    .filter((operation) => operation.bodyFields.length)
    .map(
      (operation) =>
        `${operation.name} → ${operation.bodyFields
          .map((field) => field.name + (field.required ? '*' : ''))
          .join(', ')}`,
    )
    .join(' | ')
    .replace(/'/g, '');

  return fields
    ? `Request body. Fields expected per operation: ${fields}.`
    : 'Request body for this operation';
}

const out = `// ⚠️ GENERATED FILE — do not edit by hand.
// Generated by scripts/gen-operations.mjs from schema/openapi.json.
// Refresh the reviewed production snapshot explicitly with npm run sync:api.
//
// To regenerate:  npm run gen:ops
//
// The hand-written operations in Wafly.node.ts take PRECEDENCE and do not show
// up here: they have better UX (validated fields, converted units). This file
// covers the rest of the API so that no endpoint is unreachable from the node.
//
// Endpoints covered here: ${generatedCount}

export interface GeneratedOperation {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  pathParams: string[];
  queryParams: { name: string; required: boolean }[];
  headerParams: { name: string; required: boolean; field: string }[];
  responseType: 'json' | 'binary';
  hasBody: boolean;
  isPartner: boolean;
}

export const GENERATED_OPERATIONS: Record<string, GeneratedOperation> = {
${opDefs.join('\n')}
};
`;



function replaceGeneratedBlock(source, startMarker, endMarker, body) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Missing or invalid generated block: ${startMarker} ... ${endMarker}`);
  }

  const bodyStart = start + startMarker.length;
  const markerLineStart = source.lastIndexOf('\n', start) + 1;
  const markerIndent = source.slice(markerLineStart, start);
  return `${source.slice(0, bodyStart)}\n${body}\n${markerIndent}${source.slice(end)}`;
}

const resourceOptions = [
  '          // Hand-written and generated resources, kept alphabetized for n8n verification.',
  ...[...BASE_RESOURCES, ...resourceList]
    .sort((a, b) => a.label.localeCompare(b.label, 'en'))
    .map((resource) =>
      `          { name: ${jsStr(resource.label)}, value: ${jsStr(resource.value)} },`,
    ),
].join('\n');
const nodeProperties = [
  '      // Additional operations generated from the central endpoint schema.',
  props.join('\n').replace(/^  /gm, '      '),
].join('\n');

let nextNodeSrc = replaceGeneratedBlock(
  nodeSrc,
  RESOURCE_OPTIONS_START,
  RESOURCE_OPTIONS_END,
  resourceOptions,
);
nextNodeSrc = replaceGeneratedBlock(
  nextNodeSrc,
  NODE_PROPERTIES_START,
  NODE_PROPERTIES_END,
  nodeProperties,
);
if (process.argv.includes('--check')) {
  if (readFileSync(OUT_PATH, 'utf8') !== out || nodeSrc !== nextNodeSrc) {
    throw new Error('Generated operations are stale. Run npm run gen:ops and commit both generated files.');
  }
} else {
  writeFileSync(OUT_PATH, out);
  writeFileSync(NODE_PATH, nextNodeSrc);
}

console.log(`✅ ${generatedCount} operations generated across ${resourceList.length} resources`);
for (const r of resourceList) console.log(`   ${r.label}: ${r.ops.length}`);
console.log(`   → ${OUT_PATH}`);

if (missingLabels.size) {
  console.warn(`\n⚠️  ${missingLabels.size} label(s) missing from EN_LABEL — they stayed in Portuguese in the node UI:`);
  for (const l of missingLabels) console.warn(`   · ${l}`);
  console.warn('   Add them to EN_LABEL at the top of this script.');
}
