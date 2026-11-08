import type { RequiredItem, Transcript } from './types';

/**
 * Request and response shapes for the API, shared so the client and server
 * can't drift apart.
 */

/** POST /api/transcribe, sent as multipart/form-data. */
export interface TranscribeFields {
  encounterTypeId: string;
  /** Length of the recording in seconds. The mock trims its script to this. */
  durationSec?: number;
  /** The recorded audio. Optional while recording is simulated. */
  audio?: Blob;
}

/** POST /api/generate-note, sent as JSON. */
export interface GenerateNoteRequest {
  encounterTypeId: string;
  /**
   * The checklist this visit used: the template minus hidden items, plus
   * items the clinician added. The server can't derive it from the type.
   */
  checklist: RequiredItem[];
  transcript: Transcript;
}

/** Body of any non-2xx response. */
export interface ApiErrorBody {
  error: string;
  /** Whether trying again might succeed (timeouts, not bad input). */
  retryable: boolean;
}
