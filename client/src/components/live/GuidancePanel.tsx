import { Badge, Paper } from '@mantine/core';
import type { RequiredItem } from '@encounter/shared';
import { formatClock } from '../../hooks/useSimulatedRecording';
import { Icon } from '../Icon';

/**
 * The left column: one big suggestion, readable from across the room,
 * plus progress and a confirmation when something is captured.
 */
export function NextUpCard({ item }: { item?: RequiredItem }) {
  if (!item) {
    return (
      <Paper component="section" className="next-up next-up-done" aria-live="polite">
        <span className="next-up-eyebrow">All covered</span>
        <p className="next-up-title">Everything on the checklist is captured</p>
        <p className="next-up-prompt">End the visit whenever you’re ready.</p>
      </Paper>
    );
  }
  return (
    <Paper component="section" className="next-up" aria-live="polite" aria-labelledby="next-up-title">
      <div className="next-up-meta">
        <span className="next-up-eyebrow">Suggested next</span>
        {item.payerCritical && <Badge color="amber" leftSection={<Icon name="lock" size={11} strokeWidth={2.5} />}>Payer</Badge>}
        {item.priority === 'recommended' && <Badge color="gray">Optional</Badge>}
        {item.addedByClinician && <Badge color="everi">Added by you</Badge>}
      </div>
      <p id="next-up-title" className="next-up-title">{item.label}</p>
      {item.prompt !== item.label && <p className="next-up-prompt">{item.prompt}</p>}
      <p className="next-up-why">{item.why}</p>
    </Paper>
  );
}

export function ProgressCard({ covered, total, payerLeft }: { covered: number; total: number; payerLeft: number }) {
  const left = total - covered;
  const detail =
    left === 0
      ? 'All required items covered'
      : payerLeft === left
        ? `${left} left, ${left === 1 ? 'payer-critical' : `all payer-critical`}`
        : `${left} left${payerLeft ? `, ${payerLeft} payer-critical` : ''}`;
  return (
    <Paper component="section" className="progress-card" aria-label="Progress">
      <div className="progress-head">
        <span className="progress-count">{covered} of {total} required covered</span>
        <span className="progress-detail">{detail}</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Required items covered"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={covered}
        aria-valuetext={`${covered} of ${total} required items covered`}
        style={{ gridTemplateColumns: `repeat(${Math.max(total, 1)}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < covered ? 'is-filled' : undefined} />
        ))}
      </div>
    </Paper>
  );
}

/** Confirms the latest capture, so the clinician can trust the list without reading it. */
export function JustCaptured({ item, at }: { item: RequiredItem; at: number }) {
  return (
    <div className="just-captured" key={item.id}>
      <Icon name="check" size={22} strokeWidth={2.5} />
      <span><b>Just captured:</b> {item.label}</span>
      <span className="just-captured-time">at {formatClock(at)}</span>
    </div>
  );
}
