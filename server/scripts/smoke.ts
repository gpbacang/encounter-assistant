/**
 * End-to-end check of the API against a running server.
 *   npm run dev -w server     (in one terminal)
 *   npm run smoke -w server   (in another)
 */
import assert from 'node:assert/strict';
import {
  buildChecklist,
  createCustomItem,
  encounterTypes,
  type ClinicalNote,
  type Transcript,
} from '@encounter/shared';

const API = process.env.API ?? 'http://localhost:8787/api';

async function transcribe(fields: Record<string, string>, query = '') {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  return fetch(`${API}/transcribe${query}`, { method: 'POST', body: form });
}

async function generate(body: unknown, query = '') {
  return fetch(`${API}/generate-note${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const checks: [string, () => Promise<void>][] = [];
const check = (name: string, fn: () => Promise<void>) => checks.push([name, fn]);

const type = encounterTypes.find((t) => t.id === 'initial-eval')!;
const checklist = buildChecklist(type, new Set(['comorbidities']), [
  createCustomItem('Phantom pain since surgery', 'custom-1'),
  createCustomItem('Walker use at home', 'custom-2'),
]);

check('transcribe returns the full script', async () => {
  const t: Transcript = await (await transcribe({ encounterTypeId: 'initial-eval' })).json();
  assert.equal(t.segments.length, 18);
});

check('transcribe trims to the recorded length', async () => {
  const t: Transcript = await (await transcribe({ encounterTypeId: 'initial-eval', durationSec: '100' })).json();
  assert.ok(t.segments.every((s) => s.end <= 100));
  assert.equal(t.segments.length, 10);
});

check('note respects the visit checklist', async () => {
  const transcript: Transcript = await (await transcribe({ encounterTypeId: 'initial-eval' })).json();
  const res = await generate({ encounterTypeId: 'initial-eval', checklist, transcript });
  assert.equal(res.status, 200);
  const note: ClinicalNote = await res.json();
  const itemIds = Object.values(note.sections).flat().map((s) => s.itemId);
  assert.ok(!itemIds.includes('comorbidities'), 'hidden item should not appear');
  assert.ok(itemIds.includes('custom-2'), 'added item that was covered should appear');
  assert.deepEqual(note.missingItemIds.sort(), ['custom-1', 'medical-necessity']);
  const segmentIds = new Set(transcript.segments.map((s) => s.id));
  for (const stmt of Object.values(note.sections).flat()) {
    assert.ok(stmt.sourceSegmentIds.every((id) => segmentIds.has(id)), `${stmt.id} cites a segment not in the transcript`);
  }
});

check('a short recording leaves later items missing', async () => {
  const transcript: Transcript = await (await transcribe({ encounterTypeId: 'initial-eval', durationSec: '100' })).json();
  const note: ClinicalNote = await (await generate({ encounterTypeId: 'initial-eval', checklist, transcript })).json();
  assert.ok(note.missingItemIds.includes('k-level'));
  assert.ok(note.missingItemIds.includes('measurements'));
});

check('bad input is a 400 that should not be retried', async () => {
  const res = await generate({ encounterTypeId: 'initial-eval', checklist: [], transcript: { segments: [] } });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).retryable, false);
  assert.equal((await transcribe({ encounterTypeId: 'nope' })).status, 400);
});

check('?fail=1 is a 503 that can be retried', async () => {
  const res = await transcribe({ encounterTypeId: 'initial-eval' }, '?fail=1');
  assert.equal(res.status, 503);
  assert.equal((await res.json()).retryable, true);
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}\n    ${(err as Error).message}`);
  }
}
console.log(failed ? `\n${failed} failed` : `\nAll ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
