import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Textarea } from '@mantine/core';
import type { NoteStatement } from '@encounter/shared';
import { formatClock } from '../../hooks/useSimulatedRecording';

interface Props {
  statement: NoteStatement;
  /** Start time of the first segment it cites, if any. */
  evidenceAt?: number;
  selected: boolean;
  onSelect: () => void;
  onSave: (text: string) => void;
  onRemove: () => void;
}

/**
 * One sentence of the note. Selecting it shows its evidence in the
 * transcript; editing happens in place so the clinician never loses context.
 */
export function StatementRow({ statement, evidenceAt, selected, onSelect, onSave, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(statement.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editing) {
      const el = textareaRef.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  function stopEditing() {
    setEditing(false);
    requestAnimationFrame(() => editButtonRef.current?.focus());
  }

  if (editing) {
    return (
      <li className="stmt is-editing">
        <Textarea
          aria-label="Edit statement"
          autosize
          minRows={2}
          id={`edit-${statement.id}`}
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraft(statement.text);
              stopEditing();
            }
          }}
        />
        <Group gap="xs" className="stmt-edit-actions">
          <Button
            disabled={!draft.trim()}
            onClick={() => {
              onSave(draft.trim());
              stopEditing();
            }}
          >
            Save
          </Button>
          <Button
            variant="default"
            onClick={() => {
              setDraft(statement.text);
              stopEditing();
            }}
          >
            Cancel
          </Button>
          <Button variant="subtle" color="red" ml="auto" onClick={onRemove}>Remove statement</Button>
        </Group>
      </li>
    );
  }

  return (
    <li className={`stmt ${selected ? 'is-selected' : ''}`}>
      <button type="button" className="stmt-main" aria-pressed={selected} onClick={onSelect}>
        <span className="stmt-text">{statement.text}</span>
        <span className="stmt-meta">
          {statement.origin === 'clinician' && <Badge color="everi">Added by you</Badge>}
          {statement.edited && <Badge color="gray">Edited</Badge>}
          {evidenceAt !== undefined ? (
            <span className="stmt-time" aria-label={`From the recording at ${formatClock(evidenceAt)}`}>
              {formatClock(evidenceAt)}
            </span>
          ) : statement.origin !== 'clinician' ? (
            <span className="stmt-time is-none">No source</span>
          ) : null}
        </span>
      </button>
      {selected && (
        <Button
          ref={editButtonRef}
          variant="subtle"
          size="compact-md"
          className="stmt-edit"
          onClick={() => {
            setDraft(statement.text);
            setEditing(true);
          }}
        >
          Edit
        </Button>
      )}
    </li>
  );
}
