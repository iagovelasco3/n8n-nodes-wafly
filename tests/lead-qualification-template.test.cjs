const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const workflow = JSON.parse(readFileSync(join(__dirname, '../examples/templates/08-qualify-whatsapp-leads-and-hand-off.json'), 'utf8'));
const byName = new Map(workflow.nodes.map((node) => [node.name, node]));

test('lead qualification keeps its human handoff after the reply node', () => {
  const replyOutput = workflow.connections['Reply to the lead'].main[0];
  assert.ok(replyOutput.some((connection) => connection.node === 'Hot lead?'));

  const hotCondition = byName.get('Hot lead?').parameters.conditions.conditions[0].leftValue;
  assert.equal(hotCondition, "={{ $('Parse the qualification').first().json.temperature }}");

  const handoff = byName.get('Page the sales number').parameters;
  assert.match(handoff.phone, /Parse the qualification.*first\(\).*salesPhone/);
  assert.match(handoff.message, /Parse the qualification.*first\(\).*leadMessage/);
});
