import { useEffect, useRef } from 'react';
import type { RequiredItem } from '@encounter/shared';

interface Props {
  open: boolean;
  missing: RequiredItem[];
  onGoToItem: () => void;
  onApprove: () => void;
  onClose: () => void;
}

/** Confirms signing a note that still has gaps. The clinician decides; we only make the risk visible. */
export function ApproveDialog({ open, missing, onGoToItem, onApprove, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const payer = missing.filter((i) => i.payerCritical);
  return (
    <dialog
      ref={ref}
      className="wrapup approve"
      aria-labelledby="approve-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2 id="approve-title">Sign with {missing.length} item{missing.length === 1 ? '' : 's'} missing?</h2>
      <p className="wrapup-lead">
        {payer.length > 0
          ? 'Payers commonly delay or deny claims when these are missing.'
          : 'These were on the checklist for this visit.'}
      </p>
      <ul className="approve-list">
        {missing.map((i) => (
          <li key={i.id}>
            {i.label}
            {i.payerCritical && <span className="tag tag-payer">Payer</span>}
          </li>
        ))}
      </ul>
      <div className="wrapup-actions">
        <button type="button" className="btn btn-primary btn-large" onClick={onGoToItem} autoFocus>
          Go to {missing.length === 1 ? 'item' : 'first item'}
        </button>
        <button type="button" className="btn btn-large" onClick={onApprove}>Sign anyway</button>
      </div>
    </dialog>
  );
}
