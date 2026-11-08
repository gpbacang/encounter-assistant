import { Badge, Button, Group, Text } from '@mantine/core';
import type { RequiredItem } from '@encounter/shared';
import { DecisionModal } from '../DecisionModal';
import { Icon } from '../Icon';

interface Props {
  open: boolean;
  missing: RequiredItem[];
  onGoToItem: () => void;
  onApprove: () => void;
  onClose: () => void;
}

/** Confirms signing a note that still has gaps. The clinician decides; we only make the risk visible. */
export function ApproveDialog({ open, missing, onGoToItem, onApprove, onClose }: Props) {
  const payer = missing.filter((i) => i.payerCritical);
  return (
    <DecisionModal opened={open} onClose={onClose} size={560} title={`Sign with ${missing.length} item${missing.length === 1 ? '' : 's'} missing?`}>
      <Text className="wrapup-lead">
        {payer.length > 0
          ? 'Payers commonly delay or deny claims when these are missing.'
          : 'These were on the checklist for this visit.'}
      </Text>
      <ul className="approve-list">
        {missing.map((i) => (
          <li key={i.id}>
            {i.label}
            {i.payerCritical && (
              <Badge color="amber" leftSection={<Icon name="lock" size={11} strokeWidth={2.5} />}>Payer</Badge>
            )}
          </li>
        ))}
      </ul>
      <Group grow gap="sm" mt="xl">
        <Button size="lg" onClick={onGoToItem} data-autofocus>
          Go to {missing.length === 1 ? 'item' : 'first item'}
        </Button>
        <Button size="lg" variant="default" onClick={onApprove}>Sign anyway</Button>
      </Group>
    </DecisionModal>
  );
}
