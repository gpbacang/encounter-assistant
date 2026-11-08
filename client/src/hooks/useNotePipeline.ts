import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClinicalNote, RequiredItem, Transcript } from '@encounter/shared';
import { ApiError, generateNote, transcribe } from '../api';

export type PipelineStage = 'transcribing' | 'drafting' | 'done' | 'error';

export interface PipelineState {
  stage: PipelineStage;
  /** Which step failed, so a retry resumes there instead of starting over. */
  failedAt?: 'transcribing' | 'drafting';
  error?: string;
  retryable?: boolean;
}

interface Input {
  encounterTypeId: string;
  checklist: RequiredItem[];
  durationSec: number;
  /** Already produced earlier (e.g. coming back to the page): skip those steps. */
  transcript?: Transcript;
  note?: ClinicalNote;
  onTranscript: (t: Transcript) => void;
  onNote: (n: ClinicalNote) => void;
}

/**
 * After the visit: send the recording for transcription, then draft the
 * note from that transcript. The live transcript was a streaming draft;
 * the final transcription of the whole recording is what the note uses.
 */
export function useNotePipeline(input: Input) {
  const [state, setState] = useState<PipelineState>({ stage: input.note ? 'done' : 'transcribing' });
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(input);
  latest.current = input;

  useEffect(() => {
    const { encounterTypeId, checklist, durationSec, note, onTranscript, onNote } = latest.current;
    if (note || !encounterTypeId || checklist.length === 0) return;
    const controller = new AbortController();
    const { signal } = controller;
    let transcript = latest.current.transcript;

    (async () => {
      let step: 'transcribing' | 'drafting' = 'transcribing';
      try {
        if (!transcript) {
          setState({ stage: 'transcribing' });
          transcript = await transcribe({ encounterTypeId, durationSec }, signal);
          onTranscript(transcript);
        }
        step = 'drafting';
        setState({ stage: 'drafting' });
        const result = await generateNote({ encounterTypeId, checklist, transcript }, signal);
        onNote(result);
        setState({ stage: 'done' });
      } catch (err) {
        if (signal.aborted) return;
        const apiErr = err instanceof ApiError ? err : new ApiError('Something went wrong.', true);
        setState({ stage: 'error', failedAt: step, error: apiErr.message, retryable: apiErr.retryable });
      }
    })();

    // Aborts the in-flight request on unmount (and on React's dev double-run).
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { ...state, retry };
}
