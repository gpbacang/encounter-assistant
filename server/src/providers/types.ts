import type { ClinicalNote, RequiredItem, Transcript } from '@encounter/shared';

export interface TranscribeInput {
  encounterTypeId: string;
  /** Recording length in seconds, when known. */
  durationSec?: number;
  audio?: Buffer;
  mimeType?: string;
}

export interface GenerateNoteInput {
  encounterTypeId: string;
  /** This visit's checklist, including items the clinician added. */
  checklist: RequiredItem[];
  transcript: Transcript;
}

/**
 * The two seams where real services plug in. Routes only talk to these
 * interfaces, so swapping mock for a real STT/LLM is one line in index.ts,
 * and the demo can fall back to mocks if a live call fails.
 */
export interface TranscriptionProvider {
  name: string;
  transcribe(input: TranscribeInput): Promise<Transcript>;
}

export interface NoteProvider {
  name: string;
  generateNote(input: GenerateNoteInput): Promise<ClinicalNote>;
}

/** Thrown for failures the client should offer to retry. */
export class ProviderError extends Error {
  constructor(message: string, public retryable = true) {
    super(message);
  }
}
