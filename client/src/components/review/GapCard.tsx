import { forwardRef, useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Textarea } from '@mantine/core';
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
 *
 * Deliberately no "not applicable" button: a one-click way out of required
 * items would become the default under time pressure, and payers still expect
 * the documentation. If an item truly doesn't apply, the clinician can type
 * why in their own words, or sign with the gap visible.
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
        <Badge color="amber">{item.payerCritical ? 'Payer · missing' : 'Missing'}</Badge>
      </div>
      {item.prompt !== item.label && <p className="gap-prompt">{item.prompt}</p>}

      {mode === 'idle' && (
        <Group gap="xs" mt="sm">
          <Button color="navy" leftSection={<Icon name="mic" size={16} />} onClick={() => setMode('listening')}>
            Dictate
          </Button>
          <Button variant="default" onClick={() => setMode('writing')}>Type it</Button>
        </Group>
      )}

      {mode === 'listening' && (
        <div className="gap-listening" role="status">
          <span className="gap-wave" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => <span key={i} />)}
          </span>
          Listening…
          <Button variant="subtle" size="compact-md" onClick={reset}>Cancel</Button>
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
          <Textarea
            id={`${titleId}-text`}
            ref={textareaRef}
            aria-label={item.label}
            autosize
            minRows={3}
            value={draft}
            description={hint || undefined}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Escape' && reset()}
          />
          <Group gap="xs">
            <Button type="submit" disabled={!draft.trim()}>Add to note</Button>
            <Button variant="default" onClick={reset}>Cancel</Button>
          </Group>
        </form>
      )}
    </div>
  );
});
