import { useRef, useState, type FormEvent } from 'react';
import { ActionIcon, Badge, Button, Group, Text, TextInput, VisuallyHidden } from '@mantine/core';
import { canHide, MAX_CHECKLIST_ITEMS, type RequiredItem } from '@encounter/shared';
import { Icon } from './Icon';
import './checklist-editor.css';

interface Props {
  /** The encounter type's template items. */
  templateItems: RequiredItem[];
  hiddenIds: ReadonlySet<string>;
  customItems: RequiredItem[];
  onHide: (item: RequiredItem) => void;
  onRestore: (item: RequiredItem) => void;
  onAdd: (label: string) => void;
  onRemove: (item: RequiredItem) => void;
}

const MAX_LABEL = 80;

/**
 * The checklist preview on the Setup screen, editable for this visit only:
 * hide optional items, add your own. Required and payer items are locked.
 */
export function ChecklistEditor({ templateItems, hiddenIds, customItems, onHide, onRestore, onAdd, onRemove }: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const visible = templateItems.filter((i) => !(hiddenIds.has(i.id) && canHide(i)));
  const hidden = templateItems.filter((i) => hiddenIds.has(i.id) && canHide(i));

  // When the focused button disappears (hide/remove), keep focus in the list.
  function refocus() {
    requestAnimationFrame(() => addButtonRef.current?.focus());
  }

  function closeForm() {
    setAdding(false);
    setDraft('');
    setError('');
    refocus();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const label = draft.trim();
    if (!label) {
      setError('Type what you want to capture.');
      return;
    }
    const taken = [...templateItems, ...customItems].some((i) => i.label.toLowerCase() === label.toLowerCase());
    if (taken) {
      setError('That item is already on the checklist.');
      return;
    }
    if (templateItems.length + customItems.length >= MAX_CHECKLIST_ITEMS) {
      setError(`A checklist can have at most ${MAX_CHECKLIST_ITEMS} items.`);
      return;
    }
    onAdd(label);
    setAnnouncement(`Added “${label}” for this visit.`);
    closeForm();
  }

  return (
    <div className="checklist-editor">
      <ul className="capture-list">
        {visible.map((item) => (
          <li key={item.id}>
            <Text fz="sm">{item.label}</Text>
            {item.payerCritical && (
              <Badge
                color="amber"
                leftSection={<Icon name="lock" size={11} strokeWidth={2.5} />}
                title="Commonly required by payers, so it can’t be removed"
              >
                Payer
              </Badge>
            )}
            {canHide(item) && (
              <Group gap={4} wrap="nowrap">
                <Badge color="gray">Optional</Badge>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size={36}
                  radius="xl"
                  aria-label={`Hide “${item.label}” for this visit`}
                  title="Hide for this visit"
                  onClick={() => {
                    onHide(item);
                    setAnnouncement(`Hidden “${item.label}” for this visit.`);
                    refocus();
                  }}
                >
                  <Icon name="close" size={14} strokeWidth={2.5} />
                </ActionIcon>
              </Group>
            )}
          </li>
        ))}
        {customItems.map((item) => (
          <li key={item.id}>
            <Text fz="sm">{item.label}</Text>
            <Group gap={4} wrap="nowrap">
              <Badge color="everi">Added by you</Badge>
              <ActionIcon
                variant="subtle"
                color="gray"
                size={36}
                radius="xl"
                aria-label={`Remove “${item.label}”`}
                title="Remove"
                onClick={() => {
                  onRemove(item);
                  setAnnouncement(`Removed “${item.label}”.`);
                  refocus();
                }}
              >
                <Icon name="close" size={14} strokeWidth={2.5} />
              </ActionIcon>
            </Group>
          </li>
        ))}
      </ul>

      {hidden.length > 0 && (
        <Group gap="xs" className="hidden-note">
          <Text fz="sm" c="dimmed">Hidden for this visit:</Text>
          {hidden.map((item) => (
            <Button
              key={item.id}
              variant="default"
              size="compact-sm"
              onClick={() => {
                onRestore(item);
                setAnnouncement(`Restored “${item.label}”.`);
              }}
            >
              {item.label} · Restore
            </Button>
          ))}
        </Group>
      )}

      {adding ? (
        <form className="add-form" onSubmit={submit} noValidate>
          <TextInput
            id="new-item"
            aria-label="New checklist item"
            data-autofocus
            autoFocus
            value={draft}
            maxLength={MAX_LABEL}
            placeholder="e.g. Phantom pain since surgery"
            error={error || undefined}
            onChange={(e) => {
              setDraft(e.currentTarget.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => e.key === 'Escape' && closeForm()}
            style={{ flex: '1 1 220px' }}
          />
          <Group gap="xs" align="flex-start">
            <Button type="submit">Add</Button>
            <Button variant="default" onClick={closeForm}>Cancel</Button>
          </Group>
        </form>
      ) : (
        <Button
          ref={addButtonRef}
          variant="subtle"
          className="add-btn"
          leftSection={<Icon name="plus" size={16} strokeWidth={2.5} />}
          onClick={() => setAdding(true)}
        >
          Add item for this visit
        </Button>
      )}

      <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>
    </div>
  );
}
