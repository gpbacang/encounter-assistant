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
  async transcribe({ encounterTypeId }) {
    await simulateNetwork();
    // Every encounter type falls back to the one scripted conversation.
    const transcript = mockTranscripts[encounterTypeId] ?? mockTranscripts['initial-eval'];
    return { ...transcript, encounterTypeId };
  },
};

export const mockNotes: NoteProvider = {
  name: 'mock',
  async generateNote({ encounterType, transcript }) {
    await simulateNetwork();

    const coverage = detectCoverage(encounterType, transcript.segments);
    const missingItemIds = missingRequired(encounterType, coverage).map((i) => i.id);

    let sections: ClinicalNote['sections'];
    if (encounterType.id === 'initial-eval') {
      sections = initialEvalNote;
    } else {
      // Generic fallback: one statement per covered item, quoting its evidence.
      sections = { subjective: [], objective: [], assessment: [], plan: [] };
      for (const c of coverage) {
        if (c.state !== 'covered' || !c.segmentId) continue;
        const item = encounterType.items.find((i) => i.id === c.itemId)!;
        const seg = transcript.segments.find((s) => s.id === c.segmentId)!;
        sections[item.soap].push({
          id: `${item.id}-stmt`,
          itemId: item.id,
          text: `${item.label}: ${seg.text}`,
          sourceSegmentIds: [seg.id],
        });
      }
    }

    return {
      encounterTypeId: encounterType.id,
      generatedAt: new Date().toISOString(),
      sections,
      missingItemIds,
    };
  },
};

export { simulateNetwork };
