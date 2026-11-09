import type { ApiErrorBody, ClinicalNote, GenerateNoteRequest, Transcript, TranscribeFields } from '@encounter/shared';

export class ApiError extends Error {
  retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

/**
 * Demo switch for error states, read from the page URL:
 *   ?fail=1     every API call fails
 *   ?fail=once  each endpoint fails the first time, so "Try again" recovers
 */
const failedOnce = new Set<string>();
function shouldFail(endpoint: string): boolean {
  const mode = new URLSearchParams(location.search).get('fail');
  if (mode === null) return false;
  return mode !== 'once' || !failedOnce.has(endpoint);
}

async function request<T>(endpoint: string, init: RequestInit): Promise<T> {
  const fail = shouldFail(endpoint);
  let res: Response;
  try {
    res = await fetch(`/api/${endpoint}${fail ? '?fail=1' : ''}`, init);
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError('Can’t reach the server. Check your connection and try again.', true);
  }
  // Counted only once a response arrives, so an aborted request doesn't use up ?fail=once.
  if (fail) failedOnce.add(endpoint);
  if (!res.ok) {
    const { error, retryable } = (await res.json().catch(() => ({}))) as Partial<ApiErrorBody>;
    throw new ApiError(error ?? `Request failed (${res.status}).`, retryable ?? true);
  }
  try {
    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError('The server sent an unexpected response. Try again.', true);
  }
}

export function transcribe(fields: TranscribeFields, signal?: AbortSignal): Promise<Transcript> {
  const form = new FormData();
  form.append('encounterTypeId', fields.encounterTypeId);
  if (fields.durationSec !== undefined) form.append('durationSec', String(fields.durationSec));
  if (fields.audio) form.append('audio', fields.audio, 'encounter.webm');
  return request('transcribe', { method: 'POST', body: form, signal });
}

export function generateNote(body: GenerateNoteRequest, signal?: AbortSignal): Promise<ClinicalNote> {
  return request('generate-note', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
}
