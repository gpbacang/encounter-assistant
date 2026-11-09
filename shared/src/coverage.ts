import type { EncounterType, ItemCoverage, RequiredItem, TranscriptSegment } from './types';

/** Anything with a checklist: an encounter type, or a visit's customized checklist. */
type WithItems = Pick<EncounterType, 'items'>;

/**
 * Mock coverage detector: an item counts as covered once any of its keywords
 * appears in the transcript (whole-word, case-insensitive).
 *
 * This is deliberately simple. In production this would be a classifier or
 * LLM call over a rolling window of the transcript, but keeping it
 * deterministic makes the demo predictable and lets the frontend and backend
 * share one definition of "covered".
 */
function keywordPatterns(item: RequiredItem): RegExp[] {
  return item.keywords.map((kw) => {
    const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\W)${escaped}(\\W|$)`);
  });
}

export function detectCoverage(
  encounterType: WithItems,
  segments: TranscriptSegment[],
): ItemCoverage[] {
  const texts = segments.map((s) => s.text.toLowerCase());
  return encounterType.items.map((item) => {
    const patterns = keywordPatterns(item);
    const index = texts.findIndex((text) => patterns.some((re) => re.test(text)));
    const hit = index === -1 ? undefined : segments[index];
    return hit
      ? { itemId: item.id, state: 'covered', segmentId: hit.id }
      : { itemId: item.id, state: 'missing' };
  });
}

/**
 * The one item to suggest next: the first uncovered required item in
 * checklist order (templates run Subjective → Objective → Assessment → Plan,
 * which follows a visit), then optional ones. Undefined when all are covered.
 */
export function nextSuggestion(encounterType: WithItems, coverage: ItemCoverage[]): RequiredItem | undefined {
  const covered = new Set(coverage.filter((c) => c.state === 'covered').map((c) => c.itemId));
  const open = encounterType.items.filter((i) => !covered.has(i.id));
  return open.find((i) => i.priority === 'required') ?? open[0];
}

/** Required items not yet covered, payer-critical first. */
export function missingRequired(
  encounterType: WithItems,
  coverage: ItemCoverage[],
): RequiredItem[] {
  const covered = new Set(coverage.filter((c) => c.state === 'covered').map((c) => c.itemId));
  return encounterType.items
    .filter((i) => i.priority === 'required' && !covered.has(i.id))
    .sort((a, b) => Number(b.payerCritical) - Number(a.payerCritical));
}
