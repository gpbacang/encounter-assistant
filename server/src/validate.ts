import { MAX_CHECKLIST_ITEMS, type GenerateNoteRequest, type RequiredItem, type SoapSection, type Transcript } from '@encounter/shared';

/**
 * Hand-rolled request validation. Small enough not to need a schema
 * library, strict enough that a malformed body gets a clear 400 instead of
 * a crash inside a provider.
 */

const SOAP: SoapSection[] = ['subjective', 'objective', 'assessment', 'plan'];
const MAX_SEGMENTS = 2000;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isStr = (v: unknown, max = 500): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;

function checkItem(v: unknown, i: number): string | null {
  if (!isObj(v)) return `checklist[${i}] must be an object.`;
  if (!isStr(v.id, 100) || !isStr(v.label, 200)) return `checklist[${i}] needs an id and a label.`;
  if (v.priority !== 'required' && v.priority !== 'recommended') return `checklist[${i}].priority is invalid.`;
  if (!SOAP.includes(v.soap as SoapSection)) return `checklist[${i}].soap is invalid.`;
  if (!Array.isArray(v.keywords) || !v.keywords.every((k) => isStr(k, 100))) return `checklist[${i}].keywords must be strings.`;
  return null;
}

function checkTranscript(v: unknown): string | null {
  if (!isObj(v) || !Array.isArray(v.segments)) return 'A transcript with segments is required.';
  if (v.segments.length > MAX_SEGMENTS) return 'The transcript is too long.';
  for (const [i, s] of v.segments.entries()) {
    if (!isObj(s) || !isStr(s.id, 100) || typeof s.text !== 'string') return `transcript.segments[${i}] is invalid.`;
    if (s.speaker !== 'clinician' && s.speaker !== 'patient') return `transcript.segments[${i}].speaker is invalid.`;
    if (typeof s.start !== 'number' || typeof s.end !== 'number') return `transcript.segments[${i}] needs start and end times.`;
  }
  return null;
}

/** Returns the parsed request, or an error message for a 400. */
export function parseGenerateNote(body: unknown): GenerateNoteRequest | string {
  if (!isObj(body)) return 'Expected a JSON body.';
  if (!isStr(body.encounterTypeId, 100)) return 'encounterTypeId is required.';
  if (!Array.isArray(body.checklist) || body.checklist.length === 0) return 'checklist must be a non-empty array.';
  if (body.checklist.length > MAX_CHECKLIST_ITEMS) return `checklist can have at most ${MAX_CHECKLIST_ITEMS} items.`;
  for (const [i, item] of body.checklist.entries()) {
    const err = checkItem(item, i);
    if (err) return err;
  }
  const tErr = checkTranscript(body.transcript);
  if (tErr) return tErr;
  return {
    encounterTypeId: body.encounterTypeId,
    checklist: body.checklist as RequiredItem[],
    transcript: body.transcript as Transcript,
  };
}
