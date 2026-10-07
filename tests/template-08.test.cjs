const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const templatePath = path.join(
  __dirname,
  '..',
  'examples',
  'templates',
  '08-qualify-whatsapp-leads-and-hand-off.json',
);
const workflow = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
const byName = new Map(workflow.nodes.map((node) => [node.name, node]));
const templateIndexPath = path.join(__dirname, '..', 'examples', 'templates', 'README.md');

function node(name) {
  const value = byName.get(name);
  assert.ok(value, `missing node: ${name}`);
  return value;
}

function runQualificationParser(output, salesPhone = '55 (11) 99999-9999') {
  const code = node('Validar qualificação').parameters.jsCode;
  const execute = new Function('$input', '$', code);
  const payloadByNode = {
    'Webhook Wafly': {
      body: {
        phone: '55 (11) 98888-8888',
        senderName: 'Lead teste',
        text: { message: 'Preciso de três números neste mês.' },
      },
    },
    'Configuração': { salesPhone },
  };

  return execute(
    { first: () => ({ json: { output } }) },
    (name) => ({ first: () => ({ json: payloadByNode[name] }) }),
  )[0].json;
}

test('template 08 has an importable workflow graph with resolvable references', () => {
  assert.match(workflow.name, /Qualificar leads do WhatsApp/);
  assert.equal(workflow.settings.executionOrder, 'v1');
  assert.equal(workflow.meta.templateCredsSetupCompleted, false);

  const names = workflow.nodes.map((item) => item.name);
  const ids = workflow.nodes.map((item) => item.id);
  assert.equal(new Set(names).size, names.length, 'node names must be unique');
  assert.equal(new Set(ids).size, ids.length, 'node ids must be unique');

  for (const [source, outputs] of Object.entries(workflow.connections)) {
    assert.ok(byName.has(source), `connection source does not exist: ${source}`);
    for (const channels of Object.values(outputs)) {
      for (const channel of channels) {
        for (const edge of channel) {
          assert.ok(byName.has(edge.node), `connection target does not exist: ${edge.node}`);
        }
      }
    }
  }

  const serialized = JSON.stringify(workflow);
  for (const match of serialized.matchAll(/\$\('([^']+)'\)/g)) {
    assert.ok(byName.has(match[1]), `expression references an unknown node: ${match[1]}`);
  }
});

test('template 08 contains a complete PT-BR setup and a reproducible webhook test', () => {
  const description = node('Descrição do template').parameters.content;
  const setup = node('Instalação e teste').parameters.content;

  assert.match(description, /n8n-nodes-wafly` 1\.5\.5/);
  assert.match(description, /3 dias, sem cartão/);
  assert.match(setup, /Settings > Community Nodes/);
  assert.match(setup, /Production URL/);
  assert.match(setup, /Listen for test event/);
  assert.match(setup, /ReceivedCallback/);
  assert.match(setup, /Eventos de grupo, mensagens próprias e payloads sem telefone ou texto/);

  const filters = node('Mensagem válida?').parameters.conditions.conditions;
  assert.ok(filters.some((condition) => condition.id === 'c-phone'));

  const config = node('Configuração');
  const salesPhone = config.parameters.assignments.assignments.find(
    (assignment) => assignment.name === 'salesPhone',
  );
  assert.equal(salesPhone.value, 'SEU_NUMERO_COM_DDI');

  assert.ok(node('Modelo OpenAI').credentials.openAiApi);
  assert.ok(node('Responder lead').credentials.waflyApi);
  assert.ok(node('Avisar equipe comercial').credentials.waflyApi);
});

test('template 08 carries a stable template id and fully attributed CTAs', () => {
  const description = node('Descrição do template').parameters.content;
  const urls = [...description.matchAll(/https:\/\/wafly\.com\.br\/signup\?[^)\s]+/g)].map(
    (match) => new URL(match[0]),
  );

  assert.equal(urls.length, 2);
  for (const url of urls) {
    assert.equal(url.searchParams.get('utm_source'), 'n8n');
    assert.equal(url.searchParams.get('utm_medium'), 'workflow_template');
    assert.equal(url.searchParams.get('utm_campaign'), 'qualificacao_leads_whatsapp');
    assert.equal(url.searchParams.get('template_id'), 'n8n-08-qualificar-leads');
    assert.ok(url.searchParams.get('utm_content'));
  }

  assert.match(
    node('Validar qualificação').parameters.jsCode,
    /templateId: 'n8n-08-qualificar-leads'/,
  );

  const templateIndex = fs.readFileSync(templateIndexPath, 'utf8');
  assert.match(templateIndex, /08-qualify-whatsapp-leads-and-hand-off\.json/);
  assert.match(templateIndex, /template_id=n8n-08-qualificar-leads/);
  for (const match of templateIndex.matchAll(/\]\(([^)]+\.json)\)/g)) {
    assert.ok(
      fs.existsSync(path.join(path.dirname(templateIndexPath), match[1])),
      `template index points to a missing file: ${match[1]}`,
    );
  }
});

test('hot-lead handoff reads the qualification result instead of the send response', () => {
  const responderConnections = workflow.connections['Responder lead'].main[0];
  assert.deepEqual(responderConnections.map((edge) => edge.node), ['Lead quente?']);

  const hotCondition = node('Lead quente?').parameters.conditions.conditions[0];
  assert.equal(hotCondition.rightValue, 'quente');
  assert.equal(
    hotCondition.leftValue,
    "={{ $('Validar qualificação').first().json.temperatura }}",
  );

  assert.equal(workflow.connections['Lead quente?'].main[0][0].node, 'Avisar equipe comercial');
  assert.equal(workflow.connections['Lead quente?'].main[1][0].node, 'Sem handoff');
  assert.match(node('Avisar equipe comercial').parameters.message, /Lead quente no WhatsApp/);
});

test('model output is bounded and invalid output falls back without paging sales', () => {
  const code = node('Validar qualificação').parameters.jsCode;
  assert.match(code, /temperatura: 'morno'/);
  assert.match(code, /\['quente', 'morno', 'frio'\]/);
  assert.match(code, /\.slice\(0, 240\)/);
  assert.match(code, /\.slice\(0, 500\)/);
  assert.match(code, /Configure salesPhone/);

  const hot = runQualificationParser(JSON.stringify({
    intencao: 'Comprar três números',
    orcamento_mencionado: true,
    prazo_mencionado: true,
    temperatura: 'QUENTE',
    resposta: 'Perfeito. Uma pessoa da equipe continuará o atendimento em breve.',
  }));
  assert.equal(hot.temperatura, 'quente');
  assert.equal(hot.salesPhone, '5511999999999');
  assert.equal(hot.leadPhone, '5511988888888');
  assert.equal(hot.parsedOk, true);

  const fallback = runQualificationParser('resposta sem JSON');
  assert.equal(fallback.temperatura, 'morno');
  assert.equal(fallback.intencao, 'nao_classificada');
  assert.equal(fallback.parsedOk, false);

  assert.throws(
    () => runQualificationParser('{"temperatura":"quente"}', 'SEU_NUMERO_COM_DDI'),
    /Configure salesPhone/,
  );
});
