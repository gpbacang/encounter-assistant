/** Which section of a SOAP note an item ends up in. */
export type SoapSection = 'subjective' | 'objective' | 'assessment' | 'plan';

/**
 * required    – the note is incomplete without it; surfaced in the wrap-up nudge.
 * recommended – good clinical practice; shown, but never blocks.
 */
export type ItemPriority = 'required' | 'recommended';

export interface RequiredItem {
  id: string;
  /** Short, glanceable label (fits on one line at large type). */
  label: string;
  /** A question the clinician can ask, phrased naturally. */
  prompt: string;
  /** One line on why it matters. Shown on demand, not during the meeting. */
  why: string;
  priority: ItemPriority;
  /** Payers commonly deny or delay claims when this is missing. */
  payerCritical: boolean;
  soap: SoapSection;
  /**
   * Phrases that indicate the item was covered in the transcript.
   * Used by the mock detector; a real system would use the LLM for this.
   */
  keywords: string[];
}

export interface EncounterType {
  id: string;
  name: string;
  /** One-line description shown on the setup screen. */
  summary: string;
  typicalMinutes: number;
  items: RequiredItem[];
}

export type Speaker = 'clinician' | 'patient';

export interface TranscriptSegment {
  id: string;
  speaker: Speaker;
  /** Seconds from the start of the recording. */
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  encounterTypeId: string;
  durationSec: number;
  segments: TranscriptSegment[];
}

/** One statement in the generated note, linked back to its evidence. */
export interface NoteStatement {
  id: string;
  text: string;
  /** Transcript segments that support this statement. */
  sourceSegmentIds: string[];
  /** The checklist item this statement satisfies, if any. */
  itemId?: string;
}

export interface ClinicalNote {
  encounterTypeId: string;
  generatedAt: string;
  sections: Record<SoapSection, NoteStatement[]>;
  /** Required items the transcript never covered. */
  missingItemIds: string[];
}

export type CoverageState = 'covered' | 'missing';

export interface ItemCoverage {
  itemId: string;
  state: CoverageState;
  /** Segment that first covered the item. */
  segmentId?: string;
}
