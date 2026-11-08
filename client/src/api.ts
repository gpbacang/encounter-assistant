import type { ClinicalNote, Transcript } from '@encounter/shared';

export class ApiError extends Error {
  retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError('Can’t reach the server. Check your connection and try again.', true);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error ?? `Request failed (${res.status}).`, body.retryable ?? true);
  }
  return body as T;
}

/** Add `?fail=1` in the page URL to make API calls fail, for demoing error states. */
const failParam = () => (new URLSearchParams(location.search).has('fail') ? '?fail=1' : '');

export function transcribe(encounterTypeId: string, audio?: Blob): Promise<Transcript> {
  const form = new FormData();
  form.append('encounterTypeId', encounterTypeId);
  if (audio) form.append('audio', audio, 'encounter.webm');
  return request(`/api/transcribe${failParam()}`, { method: 'POST', body: form });
}

export function generateNote(encounterTypeId: string, transcript: Transcript): Promise<ClinicalNote> {
  return request(`/api/generate-note${failParam()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ encounterTypeId, transcript }),
  });
}
