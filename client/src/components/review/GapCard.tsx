import { forwardRef, useEffect, useRef, useState } from 'react';
import type { RequiredItem } from '@encounter/shared';
import { mockDictations } from '../../data/mockDictations';
import { Icon } from '../Icon';

type Mode = 'idle' | 'listening' | 'writing';

const LISTEN_MS = 2400;

interface Props {
  item: RequiredItem;
  onAdd: (text: string) => void;
}

/**
 * A required item the visit never covered, shown where it belongs in the
 * note. The clinician fills it by dictating (simulated) or typing.
 */
export const GapCard = forwardRef<HTMLDivElement, Props>(function GapCard({ item, onAdd }, ref) {
  const [mode, setMode] = useState<Mode>('idle');
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleId = `gap-${item.id}`;

  useEffect(() => {
    if (mode === 'writing') textareaRef.current?.focus();
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

  return (
    <div className={`gap ${item.payerCritical ? 'is-payer' : ''}`} ref={ref} tabIndex={-1} aria-labelledby={titleId}>
      <div className="gap-head">
        <span id={titleId} className="gap-title">{item.label}</span>
        <span className="tag tag-payer">{item.payerCritical ? 'Payer · missing' : 'Missing'}</span>
      </div>
      {item.prompt !== item.label && <p className="gap-prompt">{item.prompt}</p>}

      {mode === 'idle' && (
        <div className="gap-actions">
          <button type="button" className="btn btn-dark btn-compact btn-icon" onClick={() => setMode('listening')}>
            <Icon name="mic" size={16} />
            Dictate
          </button>
          <button type="button" className="btn btn-compact" onClick={() => setMode('writing')}>Type it</button>
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

      {mode === 'writing' && (
        <form
          className="gap-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) onAdd(draft.trim());
          }}
        >
          <label className="sr-only" htmlFor={`${titleId}-text`}>{item.label}</label>
          <textarea
            id={`${titleId}-text`}
            ref={textareaRef}
            rows={3}
            value={draft}
            aria-describedby={hint ? `${titleId}-hint` : undefined}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && reset()}
          />
          {hint && <p id={`${titleId}-hint`} className="gap-hint">{hint}</p>}
          <div className="gap-actions">
            <button type="submit" className="btn btn-primary btn-compact" disabled={!draft.trim()}>Add to note</button>
            <button type="button" className="btn btn-compact" onClick={reset}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
});
