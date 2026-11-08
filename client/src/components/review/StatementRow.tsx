import { useEffect, useRef, useState } from 'react';
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
        <label className="sr-only" htmlFor={`edit-${statement.id}`}>Edit statement</label>
        <textarea
          id={`edit-${statement.id}`}
          ref={textareaRef}
          value={draft}
          rows={3}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraft(statement.text);
              stopEditing();
            }
          }}
        />
        <div className="stmt-edit-actions">
          <button
            type="button"
            className="btn btn-primary btn-compact"
            disabled={!draft.trim()}
            onClick={() => {
              onSave(draft.trim());
              stopEditing();
            }}
          >
            Save
          </button>
          <button
            type="button"
            className="btn btn-compact"
            onClick={() => {
              setDraft(statement.text);
              stopEditing();
            }}
          >
            Cancel
          </button>
          <button type="button" className="btn-link btn-danger-link" onClick={onRemove}>Remove statement</button>
        </div>
      </li>
    );
  }

  return (
    <li className={`stmt ${selected ? 'is-selected' : ''}`}>
      <button type="button" className="stmt-main" aria-pressed={selected} onClick={onSelect}>
        <span className="stmt-text">{statement.text}</span>
        <span className="stmt-meta">
          {statement.origin === 'clinician' && <span className="tag tag-added">Added by you</span>}
          {statement.edited && <span className="tag">Edited</span>}
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
        <button
          ref={editButtonRef}
          type="button"
          className="btn-link stmt-edit"
          onClick={() => {
            setDraft(statement.text);
            setEditing(true);
          }}
        >
          Edit
        </button>
      )}
    </li>
  );
}
