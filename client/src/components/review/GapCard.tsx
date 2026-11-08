import { forwardRef, useEffect, useRef, useState } from 'react';
import type { RequiredItem } from '@encounter/shared';
import { mockDictations } from '../../data/mockDictations';
import { Icon } from '../Icon';

type Mode = 'idle' | 'listening' | 'writing' | 'not-applicable';

const LISTEN_MS = 2400;
const MIN_REASON = 3;

interface Props {
  item: RequiredItem;
  onAdd: (text: string) => void;
  /** Mark the item as not applicable for this visit, with the clinician's reason. */
  onNotApplicable: (reason: string) => void;
}

/**
 * A required item the visit never covered, shown where it belongs in the
 * note. The clinician fills it by dictating (simulated) or typing, or marks
 * it not applicable with a reason. A reason is required: the payer gets an
 * explanation in the note instead of a silent gap.
 */
export const GapCard = forwardRef<HTMLDivElement, Props>(function GapCard({ item, onAdd, onNotApplicable }, ref) {
  const [mode, setMode] = useState<Mode>('idle');
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleId = `gap-${item.id}`;

  useEffect(() => {
    if (mode === 'writing' || mode === 'not-applicable') textareaRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    if (mode !== 'listening') return;
    const id = window.setTimeout(() => {
      const dictated = mockDictations[item.id];
      setDraft(dictated ?? '');
      setHint(dictated ? 'Check the dictation, then add it.' : 'Dictation is simulated, with no sample for this item. Type it instead.');
      setMode('writing');
    }, LISTEN_MS);
    return () => window.clearTimeout(id);
  }, [mode, item.id]);

  function reset() {
    setMode('idle');
    setDraft('');
    setHint('');
  }

  const isNA = mode === 'not-applicable';
  const canSubmit = isNA ? draft.trim().length >= MIN_REASON : draft.trim().length > 0;

  return (
    <div className={`gap ${item.payerCritical ? 'is-payer' : ''}`} ref={ref} tabIndex={-1} aria-labelledby={titleId}>
      <div className="gap-head">
        <span id={titleId} className="gap-title">{item.label}</span>
        <span className="tag tag-payer">{item.payerCritical ? 'Payer · missing' : 'Missing'}</span>
      </div>
      {item.prompt !== item.label && !isNA && <p className="gap-prompt">{item.prompt}</p>}

      {mode === 'idle' && (
        <div className="gap-actions">
          <button type="button" className="btn btn-dark btn-compact btn-icon" onClick={() => setMode('listening')}>
            <Icon name="mic" size={16} />
            Dictate
          </button>
          <button type="button" className="btn btn-compact" onClick={() => setMode('writing')}>Type it</button>
          <button type="button" className="btn-link gap-na" onClick={() => setMode('not-applicable')}>
            Not applicable
          </button>
        </div>
      )}

      {mode === 'listening' && (
        <div className="gap-listening" role="status">
          <span className="gap-wave" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => <span key={i} />)}
          </span>
          Listening…
          <button type="button" className="btn-link" onClick={reset}>Cancel</button>
        </div>
      )}

      {(mode === 'writing' || isNA) && (
        <form
          className="gap-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            if (isNA) onNotApplicable(draft.trim());
            else onAdd(draft.trim());
          }}
        >
          <label className={isNA ? 'gap-label' : 'sr-only'} htmlFor={`${titleId}-text`}>
            {isNA ? 'Why doesn’t this apply to this visit?' : item.label}
          </label>
          <textarea
            id={`${titleId}-text`}
            ref={textareaRef}
            rows={isNA ? 2 : 3}
            value={draft}
            placeholder={isNA ? 'e.g. Documented at last week’s visit; no change since.' : undefined}
            aria-describedby={isNA || hint ? `${titleId}-hint` : undefined}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && reset()}
          />
          {isNA ? (
            <p id={`${titleId}-hint`} className="gap-hint">
              The reason is written into the note.
              {item.payerCritical && ' Payers may still require this item, so be specific.'}
            </p>
          ) : (
            hint && <p id={`${titleId}-hint`} className="gap-hint">{hint}</p>
          )}
          <div className="gap-actions">
            <button type="submit" className="btn btn-primary btn-compact" disabled={!canSubmit}>
              {isNA ? 'Mark not applicable' : 'Add to note'}
            </button>
            <button type="button" className="btn btn-compact" onClick={reset}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
});
