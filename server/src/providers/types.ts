import type { ClinicalNote, EncounterType, Transcript } from '@encounter/shared';

export interface TranscribeInput {
  encounterTypeId: string;
  audio?: Buffer;
  mimeType?: string;
}

export interface GenerateNoteInput {
  encounterType: EncounterType;
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
