#!/usr/bin/env node
// Explicit maintenance command; never invoked by build or publish.
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const url = process.env.WAFLY_OPENAPI_URL || 'https://wafly.com.br/openapi.json';
const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error(`OpenAPI fetch failed: HTTP ${response.status}`);
const text = await response.text();
const spec = JSON.parse(text);
if (!spec.openapi?.startsWith('3.') || !spec.paths || Object.keys(spec.paths).length < 90) {
  throw new Error('Refusing to replace the snapshot with an invalid or incomplete API schema.');
}
writeFileSync(new URL('../schema/openapi.json', import.meta.url), text);
writeFileSync(new URL('../schema/source.json', import.meta.url), JSON.stringify({
  url, retrievedAt: new Date().toISOString(), sha256: createHash('sha256').update(text).digest('hex'),
}, null, 2) + '\n');
console.log('Snapshot refreshed. Review the diff, then run gen:ops and test before committing.');
