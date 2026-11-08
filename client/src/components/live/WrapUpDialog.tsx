import { Badge, Button, Group, Text } from '@mantine/core';
import type { RequiredItem } from '@encounter/shared';
import { DecisionModal } from '../DecisionModal';
import { Icon } from '../Icon';

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
 * Mantine's Modal traps focus and maps Escape / outside click to onClose,
 * which here means "keep recording", the safe choice.
 */
export function WrapUpDialog({ open, missing, optionalLeft, onKeepRecording, onEndAnyway }: Props) {
  const count = missing.length;
  return (
    <DecisionModal opened={open} onClose={onKeepRecording} size={640} title="Before you wrap up">
      <Text className="wrapup-lead">
        {count} required item{count === 1 ? ' hasn’t' : 's haven’t'} come up yet. Recording is paused.
      </Text>

      <ul className="wrapup-list">
        {missing.map((item) => (
          <li key={item.id} className={item.payerCritical ? 'is-payer' : undefined}>
            <div className="wrapup-item-head">
              <span className="wrapup-item-label">{item.label}</span>
              {item.payerCritical && (
                <Badge color="amber" leftSection={<Icon name="lock" size={11} strokeWidth={2.5} />}>Payer</Badge>
              )}
              {item.addedByClinician && <Badge color="everi">Added by you</Badge>}
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

      <Group grow gap="sm" mt="xl">
        <Button size="lg" onClick={onKeepRecording} data-autofocus>
          Keep recording
        </Button>
        <Button size="lg" variant="default" onClick={onEndAnyway}>End anyway</Button>
      </Group>
      <p className="wrapup-foot">You can still add missing items when you review the note.</p>
    </DecisionModal>
  );
}
