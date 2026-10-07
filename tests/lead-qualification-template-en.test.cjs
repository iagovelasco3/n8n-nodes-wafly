const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const workflow = JSON.parse(readFileSync(join(__dirname, '../examples/templates/08-qualify-whatsapp-leads-and-hand-off.en.json'), 'utf8'));
const byName = new Map(workflow.nodes.map((node) => [node.name, node]));

test('English creator export keeps the reply-to-human handoff', () => {
  const replyOutput = workflow.connections['Reply to the lead'].main[0];
  assert.ok(replyOutput.some((connection) => connection.node === 'Hot lead?'));
  assert.equal(
    byName.get('Hot lead?').parameters.conditions.conditions[0].leftValue,
    "={{ $('Parse the qualification').first().json.temperature }}",
  );

  const handoff = byName.get('Page the sales number').parameters;
  assert.match(handoff.phone, /Parse the qualification.*first\(\).*salesPhone/);
  assert.match(handoff.message, /Parse the qualification.*first\(\).*leadMessage/);
});

test('creator export explains setup and each step without covering the workflow', () => {
  const stickies = workflow.nodes.filter((node) => node.type === 'n8n-nodes-base.stickyNote');
  assert.equal(stickies.length, 5);
  assert.match(byName.get('Template description').parameters.content, /self-hosted n8n only/i);
  assert.match(byName.get('Setup').parameters.content, /Production URL/);
  assert.match(byName.get('Step 1 - receive and filter').parameters.content, /ReceivedCallback/);
  assert.match(byName.get('Step 2 - score safely').parameters.content, /malformed JSON/);
  assert.match(byName.get('Step 3 - reply and hand off').parameters.content, /parsed temperature/);

  const rectangles = stickies.map((node) => ({
    name: node.name,
    x1: node.position[0],
    y1: node.position[1],
    x2: node.position[0] + node.parameters.width,
    y2: node.position[1] + node.parameters.height,
  }));
  for (let left = 0; left < rectangles.length; left++) {
    for (let right = left + 1; right < rectangles.length; right++) {
      const a = rectangles[left];
      const b = rectangles[right];
      assert.ok(a.x2 <= b.x1 || b.x2 <= a.x1 || a.y2 <= b.y1 || b.y2 <= a.y1, `${a.name} overlaps ${b.name}`);
    }
  }

  const functionalNodes = workflow.nodes.filter((node) => node.type !== 'n8n-nodes-base.stickyNote');
  assert.ok(functionalNodes.every((node) => {
    const x = node.position[0];
    const y = node.position[1];
    return rectangles.every((rectangle) => x < rectangle.x1 || x >= rectangle.x2 || y < rectangle.y1 || y >= rectangle.y2);
  }));
});
