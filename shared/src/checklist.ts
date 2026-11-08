import type { EncounterType, RequiredItem } from './types';

const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'since', 'about', 'their', 'have']);

/**
 * A checklist item the clinician adds for one visit (e.g. a concern from the
 * referral). It's required, since the clinician chose to track it, but never
 * payer-critical. Keywords come from the label so the mock detector can
 * still tick it off when the conversation mentions it.
 */
export function createCustomItem(label: string, id: string): RequiredItem {
  const clean = label.trim();
  const keywords = clean
    .toLowerCase()
    .split(/[^a-z0-9åäöéü-]+/i)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  return {
    id,
    label: clean,
    prompt: clean,
    why: 'Added by you for this visit.',
    priority: 'required',
    payerCritical: false,
    soap: 'subjective',
    keywords: keywords.length ? keywords : [clean.toLowerCase()],
    addedByClinician: true,
  };
}

/** Optional items can be hidden for a visit; required and payer items cannot. */
export function canHide(item: RequiredItem): boolean {
  return item.priority === 'recommended' && !item.payerCritical;
}

/** The checklist for this visit: the template minus hidden items, plus added ones. */
export function buildChecklist(
  type: EncounterType,
  hiddenIds: ReadonlySet<string>,
  customItems: RequiredItem[],
): RequiredItem[] {
  return [...type.items.filter((i) => !(hiddenIds.has(i.id) && canHide(i))), ...customItems];
}
