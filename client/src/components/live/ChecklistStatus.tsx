import { Paper, VisuallyHidden } from '@mantine/core';
import type { RequiredItem } from '@encounter/shared';
import { formatClock } from '../../hooks/useSimulatedRecording';
import { Icon } from '../Icon';

interface Props {
  open: RequiredItem[];
  covered: { item: RequiredItem; at: number }[];
  suggestedId?: string;
}

/** The right column: what's left, then what's done. Read-only by design. */
export function ChecklistStatus({ open, covered, suggestedId }: Props) {
  return (
    <Paper component="section" className="status-panel" aria-label="Checklist" tabIndex={0}>
      <h2 className="status-heading">Still to cover</h2>
      {open.length === 0 ? (
        <p className="status-empty">Nothing left.</p>
      ) : (
        <ul className="status-open">
          {open.map((item) => (
            <li
              key={item.id}
              className={[
                item.id === suggestedId && 'is-next',
                item.payerCritical && 'is-payer',
                item.priority === 'recommended' && 'is-optional',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="status-ring" aria-hidden="true" />
              <span>
                {item.label}
                {item.priority === 'recommended' && <span className="status-note"> · optional</span>}
                {item.payerCritical && <VisuallyHidden> (payer-critical)</VisuallyHidden>}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="status-heading">Covered</h2>
      {covered.length === 0 ? (
        <p className="status-empty">Items tick off here as they come up.</p>
      ) : (
        <ul className="status-done">
          {covered.map(({ item, at }) => (
            <li key={item.id}>
              <Icon name="check" size={16} strokeWidth={3} />
              <span>{item.label}</span>
              <span className="status-time">{formatClock(at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Paper>
  );
}
