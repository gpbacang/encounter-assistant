import { ProviderError, type NoteProvider, type TranscriptionProvider } from './types';

/**
 * Placeholders for real services. Wire these up if there's time after the
 * core flow works; until then PROVIDER=mock keeps everything running.
 *
 * Transcription: send `audio` to a speech-to-text API with speaker
 * diarization, then map its output to TranscriptSegment[].
 *
 * Note generation: prompt an LLM with the encounter type's items and the
 * transcript, ask for JSON matching ClinicalNote (each statement citing
 * segment ids), and validate the response before returning it.
 */
export const realTranscription: TranscriptionProvider = {
  name: 'real',
  async transcribe() {
    throw new ProviderError('Real transcription is not configured.', false);
  },
};

export const realNotes: NoteProvider = {
  name: 'real',
  async generateNote() {
    throw new ProviderError('Real note generation is not configured.', false);
  },
};
