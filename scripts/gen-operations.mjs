#!/usr/bin/env node
// Gera as operações do node a partir do schema central de endpoints do frontend
// (src/data/endpoints-schema.ts), que já é a fonte de verdade de /documentation,
// /api-docs, openapi.json, llms.txt e da collection do Postman.
//
// POR QUE GERAR EM VEZ DE ESCREVER À MÃO: quando medimos, o node cobria 40 de
// 100 endpoints. Escrever os 60 restantes à mão resolveria hoje e recriaria a
// dívida na próxima vez que a API crescesse — foi exatamente assim que a
// diferença apareceu. Gerando, endpoint novo no schema vira operação no node
// rodando um comando.
//
// As operações escritas à mão continuam existindo e têm PRECEDÊNCIA: elas têm
// UX melhor (campos com validação, unidades convertidas). O gerador só preenche
// o que falta.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = process.env.WAFLY_SCHEMA_PATH
  ? resolve(process.env.WAFLY_SCHEMA_PATH)
  : resolve(__dirname, '../../frontend/src/data/endpoints-schema.ts');
const OUT_PATH = resolve(__dirname, '../nodes/Wafly/GeneratedOperations.ts');
const NODE_PATH = resolve(__dirname, '../nodes/Wafly/Wafly.node.ts');

if (!existsSync(SCHEMA_PATH)) {
  // NÃO é erro: o schema vive no repositório do frontend, que não existe no
  // runner de CI nem na máquina de quem só clonou este pacote. O resultado da
  // geração (GeneratedOperations.ts) é COMMITADO justamente por isso, então o
  // build segue normalmente com o que já está versionado.
  //
  // Falhar aqui quebrou o publish da v1.5.0: o prebuild abortou no CI porque
  // procurou ../frontend, que não existe lá.
  console.warn(`ℹ️  schema não encontrado em ${SCHEMA_PATH} — usando o GeneratedOperations.ts versionado.`);
  console.warn('   Para regenerar, rode com o repo do frontend ao lado ou defina WAFLY_SCHEMA_PATH.');
  process.exit(0);
}

const schema = readFileSync(SCHEMA_PATH, 'utf8');
const nodeSrc = readFileSync(NODE_PATH, 'utf8');

// --- parse do schema ---------------------------------------------------------
// Regex em vez de AST de propósito: o arquivo é gerado/editado por humanos num
// formato estável e previsível, e adicionar um parser de TS aqui traria uma
// dependência pesada para ganhar pouco. Se o formato mudar, o gerador falha
// alto (contagem zero) em vez de emitir lixo silenciosamente.

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
  // requestBody: nomes dos campos, para gerar entradas no node
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

// --- o que o node já cobre ---------------------------------------------------
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

// --- seleção -----------------------------------------------------------------
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


// --- rótulos em inglês -------------------------------------------------------
// O schema vive no repositório do frontend e serve a documentação brasileira,
// então os `summary` são em português. A UI do n8n é em inglês — é a convenção
// do ecossistema e é o idioma das operações escritas à mão neste node. Sem esta
// tradução o node ficava metade em cada idioma, que foi como ele nasceu.
//
// A tradução mora AQUI, e não no schema, de propósito: rótulo de node é assunto
// do node. Poluir o schema com um campo só para isto acoplaria a documentação
// pública a um consumidor específico.
//
// Nome sem entrada aqui é reportado no fim da execução, para nunca passar
// português em silêncio.
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
  // "(GET)" e "(POST)" descreviam o metodo HTTP em vez da diferenca real: um le
  // o telefone da query string, o outro do corpo. O rotulo agora diz isso.
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
    if (implementedPaths.has(normalize(rel))) continue; // já feito à mão: não duplicar

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

// --- emissão -----------------------------------------------------------------
const resourceList = [...resources.values()];

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
    (o) => `      { name: ${jsStr(o.display)}, value: ${jsStr(o.name)}, action: ${jsStr(o.display)} },`
  )
  .join('\n')}
    ],
    default: ${jsStr(res.ops[0].name)},
  },`);

  // Um campo por parâmetro de caminho, só nas operações que o usam.
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

  // Corpo em JSON. Um formulário campo a campo para 60 endpoints geraria uma UI
  // impossível de manter; o JSON mantém a operação utilizável e o exemplo dos
  // campos esperados vai na descrição.
  const withBody = res.ops.filter((o) => o.method !== 'GET' && o.method !== 'DELETE');
  if (withBody.length) {
    props.push(`  {
    displayName: 'Body (JSON)',
    name: 'gp_body',
    type: 'json',
    default: '{}',
    displayOptions: { show: { resource: [${jsStr(res.value)}], operation: [${withBody.map((o) => jsStr(o.name)).join(', ')}] } },
    description: 'Request body. Fields expected per operation: ${withBody
      .filter((o) => o.bodyFields.length)
      .map((o) => `${o.name} → ${o.bodyFields.map((f) => f.name + (f.required ? '*' : '')).join(', ')}`)
      .join(' | ')
      .replace(/'/g, '')}',
  },`);
  }

  for (const o of res.ops) {
    opDefs.push(
      `  ${jsStr(res.value + ':' + o.name)}: { method: ${jsStr(o.method)}, path: ${jsStr(o.path)}, pathParams: [${o.pathParams.map(jsStr).join(', ')}], hasBody: ${o.method !== 'GET' && o.method !== 'DELETE'}, isPartner: ${o.isPartner} },`
    );
  }
}

function humanize(s) {
  return s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
}

const out = `// ⚠️ ARQUIVO GERADO — não edite à mão.
// Gerado por scripts/gen-operations.mjs a partir do schema central de endpoints
// (frontend/src/data/endpoints-schema.ts), a mesma fonte de /documentation,
// /api-docs, openapi.json, llms.txt e do Postman.
//
// Regenerar:  npm run gen:ops
//
// As operações escritas à mão no Wafly.node.ts têm PRECEDÊNCIA e não aparecem
// aqui: elas têm UX melhor (campos validados, unidades convertidas). Este
// arquivo cobre o resto da API para que nenhum endpoint fique inacessível pelo
// node.
//
// Endpoints cobertos aqui: ${generatedCount}

import type { INodeProperties } from 'n8n-workflow';

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

export const GENERATED_RESOURCES: Array<{ name: string; value: string }> = [
${resourceList.map((r) => `  { name: ${jsStr(r.label)}, value: ${jsStr(r.value)} },`).join('\n')}
];

export const generatedProperties: INodeProperties[] = [
${props.join('\n')}
];
`;

writeFileSync(OUT_PATH, out);
console.log(`✅ ${generatedCount} operações geradas em ${resourceList.length} resources`);
for (const r of resourceList) console.log(`   ${r.label}: ${r.ops.length}`);
console.log(`   → ${OUT_PATH}`);

if (missingLabels.size) {
  console.warn(`\n⚠️  ${missingLabels.size} rótulo(s) sem tradução em EN_LABEL — ficaram em português na UI do node:`);
  for (const l of missingLabels) console.warn(`   · ${l}`);
  console.warn('   Adicione em EN_LABEL no topo deste script.');
}
