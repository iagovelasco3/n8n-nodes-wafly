const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const { readFileSync, writeFileSync, mkdtempSync, mkdirSync, copyFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { resolve, join } = require('node:path');
const { createHash } = require('node:crypto');
const root = resolve(__dirname, '..');

test('generation is reproducible from the committed snapshot and leaves files unchanged', () => {
  const paths = ['nodes/Wafly/Wafly.node.ts', 'nodes/Wafly/GeneratedOperations.ts'];
  const before = paths.map(p => readFileSync(join(root, p), 'utf8'));
  const result = spawnSync(process.execPath, ['scripts/gen-operations.mjs', '--check'], { cwd: root, encoding: 'utf8', env: { ...process.env, WAFLY_SCHEMA_PATH: join(root, 'schema/openapi.json') } });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(paths.map(p => readFileSync(join(root, p), 'utf8')), before);
  const meta = require('../schema/source.json');
  assert.equal(createHash('sha256').update(readFileSync(join(root, 'schema/openapi.json'))).digest('hex'), meta.sha256);
});

test('unmapped schema sections and missing translations fail without partial output', () => {
  const directory = mkdtempSync(join(tmpdir(), 'wafly-generation-'));
  try {
    mkdirSync(join(directory, 'scripts'));
    mkdirSync(join(directory, 'nodes/Wafly'), { recursive: true });
    for (const file of ['scripts/gen-operations.mjs', 'nodes/Wafly/Wafly.node.ts', 'nodes/Wafly/GeneratedOperations.ts']) copyFileSync(join(root, file), join(directory, file));
    const outputs = ['nodes/Wafly/Wafly.node.ts', 'nodes/Wafly/GeneratedOperations.ts'];
    const before = outputs.map(p => readFileSync(join(directory, p), 'utf8'));
    for (const unknownSection of [true, false]) {
      const spec = JSON.parse(readFileSync(join(root, 'schema/openapi.json')));
      spec.paths['/api-bridge-whats/new-unmapped-operation'] = { get: { operationId: 'new-unmapped-operation', summary: 'Missing translation', tags: [unknownSection ? 'Unmapped section' : 'Instância'] } };
      writeFileSync(join(directory, 'schema.json'), JSON.stringify(spec));
      const result = spawnSync(process.execPath, ['scripts/gen-operations.mjs'], { cwd: directory, encoding: 'utf8', env: { ...process.env, WAFLY_SCHEMA_PATH: join(directory, 'schema.json') } });
      assert.notEqual(result.status, 0);
      assert.deepEqual(outputs.map(p => readFileSync(join(directory, p), 'utf8')), before);
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
