import { useEffect, useRef } from 'react';
import type { RequiredItem } from '@encounter/shared';

interface Props {
  open: boolean;
  missing: RequiredItem[];
  optionalLeft: RequiredItem[];
  onKeepRecording: () => void;
  onEndAnyway: () => void;
}

/**
 * The only interruption in the live flow, shown when the clinician ends the
 * visit with required items uncovered. Never blocks: "End anyway" is always
 * there, and gaps can still be filled during review.
 *
 * Uses the native <dialog> for focus trapping and Escape (= keep recording).
 */
export function WrapUpDialog({ open, missing, optionalLeft, onKeepRecording, onEndAnyway }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const count = missing.length;
  return (
    <dialog
      ref={ref}
      className="wrapup"
      aria-labelledby="wrapup-title"
      onCancel={(e) => {
        e.preventDefault();
        onKeepRecording();
      }}
    >
      <h2 id="wrapup-title">Before you wrap up</h2>
      <p className="wrapup-lead">
        {count} required item{count === 1 ? ' hasn’t' : 's haven’t'} come up yet. Recording is paused.
      </p>

      <ul className="wrapup-list">
        {missing.map((item) => (
          <li key={item.id} className={item.payerCritical ? 'is-payer' : undefined}>
            <div className="wrapup-item-head">
              <span className="wrapup-item-label">{item.label}</span>
              {item.payerCritical && <span className="tag tag-payer">Payer</span>}
              {item.addedByClinician && <span className="tag tag-added">Added by you</span>}
            </div>
            {item.prompt !== item.label && <p className="wrapup-item-prompt">{item.prompt}</p>}
            {item.payerCritical && <p className="wrapup-item-why">{item.why}</p>}
          </li>
        ))}
      </ul>

      {optionalLeft.length > 0 && (
        <p className="wrapup-optional">
          Also open: {optionalLeft.map((i) => i.label).join(', ')} · optional
        </p>
      )}

      <div className="wrapup-actions">
        <button type="button" className="btn btn-primary btn-large" onClick={onKeepRecording} autoFocus>
          Keep recording
        </button>
        <button type="button" className="btn btn-large" onClick={onEndAnyway}>End anyway</button>
      </div>
      <p className="wrapup-foot">You can still add missing items when you review the note.</p>
    </dialog>
  );
}
