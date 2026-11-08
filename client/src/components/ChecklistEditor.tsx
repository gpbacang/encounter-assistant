import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { canHide, type RequiredItem } from '@encounter/shared';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const visible = templateItems.filter((i) => !(hiddenIds.has(i.id) && canHide(i)));
  const hidden = templateItems.filter((i) => hiddenIds.has(i.id) && canHide(i));

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

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
    onAdd(label);
    setAnnouncement(`Added “${label}” for this visit.`);
    closeForm();
  }

  function onInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') closeForm();
  }

  return (
    <div className="checklist-editor">
      <ul className="capture-list">
        {visible.map((item) => (
          <li key={item.id}>
            <span>{item.label}</span>
            {item.payerCritical && (
              <span className="tag tag-payer" title="Commonly required by payers, so it can’t be removed">
                <Icon name="lock" size={11} strokeWidth={2.5} />
                Payer
              </span>
            )}
            {canHide(item) && (
              <span className="item-actions">
                <span className="tag">Optional</span>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Hide “${item.label}” for this visit`}
                  title="Hide for this visit"
                  onClick={() => {
                    onHide(item);
                    setAnnouncement(`Hidden “${item.label}” for this visit.`);
                    refocus();
                  }}
                >
                  <Icon name="close" size={14} strokeWidth={2.5} />
                </button>
              </span>
            )}
          </li>
        ))}
        {customItems.map((item) => (
          <li key={item.id}>
            <span>{item.label}</span>
            <span className="item-actions">
              <span className="tag tag-added">Added by you</span>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remove “${item.label}”`}
                title="Remove"
                onClick={() => {
                  onRemove(item);
                  setAnnouncement(`Removed “${item.label}”.`);
                  refocus();
                }}
              >
                <Icon name="close" size={14} strokeWidth={2.5} />
              </button>
            </span>
          </li>
        ))}
      </ul>

      {hidden.length > 0 && (
        <p className="hidden-note">
          <span>Hidden for this visit:</span>
          {hidden.map((item) => (
            <button
              key={item.id}
              type="button"
              className="restore-btn"
              aria-label={`Restore “${item.label}”`}
              onClick={() => {
                onRestore(item);
                setAnnouncement(`Restored “${item.label}”.`);
              }}
            >
              {item.label} · Restore
            </button>
          ))}
        </p>
      )}

      {adding ? (
        <form className="add-form" onSubmit={submit} noValidate>
          <label htmlFor="new-item" className="sr-only">New checklist item</label>
          <input
            id="new-item"
            ref={inputRef}
            value={draft}
            maxLength={MAX_LABEL}
            placeholder="e.g. Phantom pain since surgery"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'new-item-error' : undefined}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={onInputKeyDown}
          />
          <button type="submit" className="btn btn-primary btn-compact">Add</button>
          <button type="button" className="btn btn-compact" onClick={closeForm}>Cancel</button>
          {error && <p id="new-item-error" className="add-error">{error}</p>}
        </form>
      ) : (
        <button ref={addButtonRef} type="button" className="add-btn" onClick={() => setAdding(true)}>
          <Icon name="plus" size={16} strokeWidth={2.5} />
          Add item for this visit
        </button>
      )}

      <p className="sr-only" aria-live="polite">{announcement}</p>
    </div>
  );
}
