import type { EncounterType, ItemCoverage, RequiredItem, TranscriptSegment } from './types';

/**
 * Mock coverage detector: an item counts as covered once any of its keywords
 * appears in the transcript (whole-word, case-insensitive).
 *
 * This is deliberately simple. In production this would be a classifier or
 * LLM call over a rolling window of the transcript, but keeping it
 * deterministic makes the demo predictable and lets the frontend and backend
 * share one definition of "covered".
 */
function matches(item: RequiredItem, text: string): boolean {
  const lower = text.toLowerCase();
  return item.keywords.some((kw) => {
    const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\W)${escaped}(\\W|$)`).test(lower);
  });
}

export function detectCoverage(
  encounterType: EncounterType,
  segments: TranscriptSegment[],
): ItemCoverage[] {
  return encounterType.items.map((item) => {
    const hit = segments.find((s) => matches(item, s.text));
    return hit
      ? { itemId: item.id, state: 'covered', segmentId: hit.id }
      : { itemId: item.id, state: 'missing' };
  });
}

/** Required items not yet covered, payer-critical first. */
export function missingRequired(
  encounterType: EncounterType,
  coverage: ItemCoverage[],
): RequiredItem[] {
  const covered = new Set(coverage.filter((c) => c.state === 'covered').map((c) => c.itemId));
  return encounterType.items
    .filter((i) => i.priority === 'required' && !covered.has(i.id))
    .sort((a, b) => Number(b.payerCritical) - Number(a.payerCritical));
}
