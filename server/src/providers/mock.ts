import {
  detectCoverage,
  missingRequired,
  mockTranscripts,
  type ClinicalNote,
  type NoteStatement,
  type SoapSection,
} from '@encounter/shared';
import { ProviderError, type NoteProvider, type TranscriptionProvider } from './types';

const latencyMs = Number(process.env.MOCK_LATENCY_MS ?? 1200);
const failureRate = Number(process.env.MOCK_FAILURE_RATE ?? 0);

async function simulateNetwork(forceFail = false) {
  await new Promise((r) => setTimeout(r, latencyMs * (0.75 + Math.random() * 0.5)));
  if (forceFail || Math.random() < failureRate) {
    throw new ProviderError('The service timed out. Your recording is saved; try again.');
  }
}

/**
 * Hand-written "AI output" for the scripted initial evaluation, so the review
 * screen shows clinical phrasing rather than echoed transcript lines.
 * Keyed by item id; each statement cites the segments it came from.
 */
const initialEvalNote: Record<SoapSection, NoteStatement[]> = {
  subjective: [
    { id: 's1', itemId: 'chief-complaint', text: 'Referred by surgeon for initial prosthetic evaluation; patient motivated to resume walking.', sourceSegmentIds: ['seg-02'] },
    { id: 's2', itemId: 'amputation-history', text: 'Left transtibial amputation in March secondary to non-healing infection.', sourceSegmentIds: ['seg-02', 'seg-04'] },
    { id: 's3', itemId: 'comorbidities', text: 'Type 2 diabetes mellitus, approximately 15 years.', sourceSegmentIds: ['seg-04'] },
    { id: 's4', itemId: 'current-mobility', text: 'Currently uses a wheelchair at home; ambulates short distances with a walker for toileting.', sourceSegmentIds: ['seg-06'] },
    { id: 's5', itemId: 'goals', text: 'Goals: return to work at the library and walk granddaughter three blocks to school.', sourceSegmentIds: ['seg-08'] },
  ],
  objective: [
    { id: 'o1', itemId: 'limb-exam', text: 'Residual limb: incision well healed, no open areas, mild skin dryness. Mild distal tenderness reported.', sourceSegmentIds: ['seg-09', 'seg-10', 'seg-11'] },
    { id: 'o2', itemId: 'measurements', text: 'Length from knee joint line 14 cm. Circumference 31 cm mid-limb, 28 cm distal.', sourceSegmentIds: ['seg-11', 'seg-12'] },
  ],
  assessment: [
    { id: 'a1', itemId: 'k-level', text: 'Functional level K2 (limited community ambulator), based on current walker use and stated goals.', sourceSegmentIds: ['seg-15'] },
    { id: 'a2', text: 'Residual limb shape appropriate for first prosthesis; volume expected to change over coming months.', sourceSegmentIds: ['seg-14'] },
  ],
  plan: [
    { id: 'p1', text: 'Test socket fitting in approximately two weeks.', sourceSegmentIds: ['seg-17'] },
  ],
};

export const mockTranscription: TranscriptionProvider = {
  name: 'mock',
  async transcribe({ encounterTypeId, durationSec }) {
    await simulateNetwork();
    // Every encounter type falls back to the one scripted conversation,
    // trimmed to what was actually recorded if the visit ended early.
    const script = mockTranscripts[encounterTypeId] ?? mockTranscripts['initial-eval'];
    const segments = durationSec === undefined ? script.segments : script.segments.filter((s) => s.end <= durationSec);
    return { encounterTypeId, durationSec: durationSec ?? script.durationSec, segments };
  },
};

export const mockNotes: NoteProvider = {
  name: 'mock',
  async generateNote({ encounterTypeId, checklist, transcript }) {
    await simulateNetwork();

    const list = { items: checklist };
    const coverage = detectCoverage(list, transcript.segments);
    const coveredIds = new Set(coverage.filter((c) => c.state === 'covered').map((c) => c.itemId));
    const heard = new Set(transcript.segments.map((s) => s.id));
    const sections: ClinicalNote['sections'] = { subjective: [], objective: [], assessment: [], plan: [] };

    // Canned clinical phrasing where we have it, kept only when its item is
    // still on the checklist and covered, and its evidence was recorded.
    const canned = encounterTypeId === 'initial-eval' ? initialEvalNote : undefined;
    const cannedItemIds = new Set<string>();
    if (canned) {
      for (const section of Object.keys(canned) as SoapSection[]) {
        for (const stmt of canned[section]) {
          if (!stmt.sourceSegmentIds.every((id) => heard.has(id))) continue;
          if (stmt.itemId && !coveredIds.has(stmt.itemId)) continue;
          sections[section].push(stmt);
          if (stmt.itemId) cannedItemIds.add(stmt.itemId);
        }
      }
    }

    // Everything else that was covered (other encounter types, items the
    // clinician added): one statement quoting its evidence.
    for (const c of coverage) {
      if (c.state !== 'covered' || !c.segmentId || cannedItemIds.has(c.itemId)) continue;
      const item = checklist.find((i) => i.id === c.itemId)!;
      const seg = transcript.segments.find((s) => s.id === c.segmentId)!;
      sections[item.soap].push({
        id: `${item.id}-stmt`,
        itemId: item.id,
        text: `${item.label}: ${seg.text}`,
        sourceSegmentIds: [seg.id],
      });
    }

    return {
      encounterTypeId,
      generatedAt: new Date().toISOString(),
      sections,
      missingItemIds: missingRequired(list, coverage).map((i) => i.id),
    };
  },
};

export { simulateNetwork };
