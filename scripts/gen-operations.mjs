#!/usr/bin/env node
// Generates the node operations from the frontend's central endpoint schema
// (src/data/endpoints-schema.ts), which is already the source of truth for
// /documentation, /api-docs, openapi.json, llms.txt and the Postman collection.
//
// WHY GENERATE INSTEAD OF HAND-WRITING: when we measured, the node covered 40 of
// 100 endpoints. Writing the remaining 60 by hand would solve it today and
// recreate the debt the next time the API grew — which is exactly how the gap
// appeared in the first place. By generating, a new endpoint in the schema
// becomes a node operation by running a single command.
//
// The hand-written operations still exist and take PRECEDENCE: they have better
// UX (validated fields, converted units). The generator only fills in the gaps.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = process.env.WAFLY_SCHEMA_PATH
  ? resolve(process.env.WAFLY_SCHEMA_PATH)
  : resolve(__dirname, '../../frontend/src/data/endpoints-schema.ts');
const OUT_PATH = resolve(__dirname, '../nodes/Wafly/GeneratedOperations.ts');
const NODE_PATH = resolve(__dirname, '../nodes/Wafly/Wafly.node.ts');
const RESOURCE_OPTIONS_START = '// GENERATED_RESOURCE_OPTIONS:START';
const RESOURCE_OPTIONS_END = '// GENERATED_RESOURCE_OPTIONS:END';
const NODE_PROPERTIES_START = '// GENERATED_NODE_PROPERTIES:START';
const NODE_PROPERTIES_END = '// GENERATED_NODE_PROPERTIES:END';

if (!existsSync(SCHEMA_PATH)) {
  // This is NOT an error: the schema lives in the frontend repository, which is
  // not present on the CI runner nor on the machine of anyone who only cloned
  // this package. That is precisely why the generated output
  // (GeneratedOperations.ts) is COMMITTED, so the build proceeds normally with
  // whatever is already checked in.
  //
  // Failing here broke the v1.5.0 publish: prebuild aborted on CI because it
  // looked for ../frontend, which does not exist there.
  console.warn(`ℹ️  schema not found at ${SCHEMA_PATH} — using the committed GeneratedOperations.ts.`);
  console.warn('   To regenerate, run with the frontend repo alongside or set WAFLY_SCHEMA_PATH.');
  process.exit(0);
}

const schema = readFileSync(SCHEMA_PATH, 'utf8');
const nodeSrc = readFileSync(NODE_PATH, 'utf8');

// --- schema parsing ----------------------------------------------------------
// Regex instead of an AST on purpose: the file is generated/edited by humans in
// a stable, predictable format, and pulling in a TS parser here would add a
// heavy dependency for little gain. If the format changes, the generator fails
// loudly (zero count) instead of silently emitting garbage.

const sections = [];
const sectionRe = /id:\s*'([^']+)',\s*\n\s*name:\s*'([^']+)',\s*\n\s*description:/g;
let sm;
while ((sm = sectionRe.exec(schema)) !== null) {
  sections.push({ id: sm[1], name: sm[2], index: sm.index, endpoints: [] });
}

const epRe =
  /\{\s*\n\s*id:\s*'([^']+)',\s*\n\s*method:\s*'(GET|POST|PUT|DELETE)',\s*\n\s*path:\s*'([^']+)',\s*\n\s*summary:\s*'((?:[^'\\]|\\.)*)'/g;
let em;
const allEndpoints = [];
while ((em = epRe.exec(schema)) !== null) {
  const ep = {
    id: em[1],
    method: em[2],
    path: em[3],
    summary: em[4].replace(/\\'/g, "'"),
    index: em.index,
  };
  // requestBody: field names, used to generate node inputs
  const after = schema.slice(em.index, em.index + 6000);
  const bodyBlock = after.match(/requestBody:\s*\[([\s\S]*?)\n\s{6}\]/);
  ep.bodyFields = bodyBlock
    ? [...bodyBlock[1].matchAll(/name:\s*'([^']+)',\s*\n\s*type:\s*'([^']+)',\s*\n\s*required:\s*(true|false)/g)].map(
        (b) => ({ name: b[1], type: b[2], required: b[3] === 'true' })
      )
    : [];
  allEndpoints.push(ep);
}

for (const ep of allEndpoints) {
  let owner = sections[0];
  for (const s of sections) if (s.index < ep.index) owner = s;
  owner?.endpoints.push(ep);
}

// --- what the node already covers --------------------------------------------
const implementedPaths = new Set();
for (const m of nodeSrc.matchAll(/endpoint = `\$\{basePath\}([^`]*)`/g)) {
  implementedPaths.add(normalize(m[1]));
}
for (const m of nodeSrc.matchAll(/endpoint = `([^`]*)`/g)) {
  implementedPaths.add(normalize(m[1].replace('${basePath}', '')));
}

function normalize(p) {
  return p
    .replace(/\$\{[^}]+\}/g, '*')
    .replace(/\{[^}]+\}/g, '*')
    .replace(/\/+$/, '');
}

function relPath(p) {
  const rel = p.replace('/instances/{instance}/token/{token}', '');
  return rel || '/';
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
  webhooks: { value: 'webhookExtra', label: 'Webhook (More)' },
  parceiros: { value: 'partner', label: 'Partner' },
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
  // "(GET)" and "(POST)" described the HTTP method instead of the real
  // difference: one reads the phone from the query string, the other from the
  // body. The label now says that.
  'Código de emparelhamento (GET)': 'Get Pairing Code (Phone in Query)',
  'Código de emparelhamento (POST)': 'Get Pairing Code (Phone in Body)',
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
    if (implementedPaths.has(normalize(rel))) continue; // already hand-written: do not duplicate

    const pathParams = [...rel.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
    const opName = toOperationName(ep.id);

    if (!resources.has(res.value)) resources.set(res.value, { ...res, ops: [] });
    resources.get(res.value).ops.push({
      name: opName,
      display: enLabel(ep.summary),
      method: ep.method,
      path: rel,
      pathParams,
      bodyFields: ep.bodyFields,
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
    default: ${jsStr(res.ops[0].name)},
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

  // JSON body. A field-by-field form for 60 endpoints would produce a UI that is
  // impossible to maintain; JSON keeps the operation usable and the example of
  // the expected fields goes into the description.
  const withBody = res.ops.filter((o) => o.method !== 'GET' && o.method !== 'DELETE');
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

  for (const o of res.ops) {
    opDefs.push(
      `  ${jsStr(res.value + ':' + o.name)}: { method: ${jsStr(o.method)}, path: ${jsStr(o.path)}, pathParams: [${o.pathParams.map(jsStr).join(', ')}], hasBody: ${o.method !== 'GET' && o.method !== 'DELETE'}, isPartner: ${o.isPartner} },`
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
// Generated by scripts/gen-operations.mjs from the central endpoint schema
// (frontend/src/data/endpoints-schema.ts), the same source behind
// /documentation, /api-docs, openapi.json, llms.txt and the Postman collection.
//
// To regenerate:  npm run gen:ops
//
// The hand-written operations in Wafly.node.ts take PRECEDENCE and do not show
// up here: they have better UX (validated fields, converted units). This file
// covers the rest of the API so that no endpoint is unreachable from the node.
//
// Endpoints covered here: ${generatedCount}

export interface GeneratedOperation {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  pathParams: string[];
  hasBody: boolean;
  isPartner: boolean;
}

export const GENERATED_OPERATIONS: Record<string, GeneratedOperation> = {
${opDefs.join('\n')}
};
`;

writeFileSync(OUT_PATH, out);

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
writeFileSync(NODE_PATH, nextNodeSrc);

console.log(`✅ ${generatedCount} operations generated across ${resourceList.length} resources`);
for (const r of resourceList) console.log(`   ${r.label}: ${r.ops.length}`);
console.log(`   → ${OUT_PATH}`);

if (missingLabels.size) {
  console.warn(`\n⚠️  ${missingLabels.size} label(s) missing from EN_LABEL — they stayed in Portuguese in the node UI:`);
  for (const l of missingLabels) console.warn(`   · ${l}`);
  console.warn('   Add them to EN_LABEL at the top of this script.');
}
