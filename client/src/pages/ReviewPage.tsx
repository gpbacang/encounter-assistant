import { useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { getEncounterType, type ClinicalNote, type NoteStatement, type RequiredItem, type SoapSection } from '@encounter/shared';
import { Icon } from '../components/Icon';
import { ApproveDialog } from '../components/review/ApproveDialog';
import { GapCard } from '../components/review/GapCard';
import { ProcessingView } from '../components/review/ProcessingView';
import { SignedView } from '../components/review/SignedView';
import { StatementRow } from '../components/review/StatementRow';
import { TranscriptPanel } from '../components/review/TranscriptPanel';
import { useNotePipeline } from '../hooks/useNotePipeline';
import { noteToText, SOAP_SECTIONS } from '../noteText';
import { scrollWithin } from '../scrollWithin';
import { useSession } from '../session';
import './review.css';

function toast(message: string) {
  notifications.show({ message, color: 'navy' });
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m} min ${s} s` : `${s} s`;
}

/**
 * Steps 3–5 of the flow: process the recording, review the note, sign it.
 * Review is about verifying, not rewriting: every statement links to its
 * evidence, and gaps sit where they belong in the note.
 */
export function ReviewPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { session, update, reset } = useSession();
  const type = session.encounterTypeId ? getEncounterType(session.encounterTypeId) : undefined;

  const pipeline = useNotePipeline({
    encounterTypeId: session.encounterTypeId ?? '',
    checklist: session.checklist ?? [],
    durationSec: session.liveTranscript?.durationSec ?? 0,
    transcript: session.transcript,
    note: session.note,
    onTranscript: (transcript) => update({ transcript }),
    onNote: (note) => update({ note }),
  });

  const [selectedId, setSelectedId] = useState<string>();
  const [approveOpen, setApproveOpen] = useState(false);
  // Statements with an edit open; signing would silently drop their drafts.
  const [editingIds, setEditingIds] = useState<ReadonlySet<string>>(new Set());
  const gapRefs = useRef(new Map<string, HTMLDivElement>());
  const noteRef = useRef<HTMLElement>(null);

  const note = session.note;
  const checklist = session.checklist ?? [];
  const missing = useMemo(
    () => (note ? checklist.filter((i) => note.missingItemIds.includes(i.id)) : []),
    [note, checklist],
  );
  const segmentStart = useMemo(
    () => new Map((session.transcript?.segments ?? []).map((s) => [s.id, s.start])),
    [session.transcript],
  );

  function newEncounter() {
    reset();
    navigate(`/${search}`);
  }

  if (!session.patient || !type || !session.checklist || !session.liveTranscript) return <Navigate to={`/${search}`} replace />;
  if (pipeline.stage !== 'done' || !note || !session.transcript) {
    return <ProcessingView state={pipeline} onRetry={pipeline.retry} onNewEncounter={newEncounter} />;
  }

  const title = `${session.patient.name} · ${type.name}`;
  const allStatements = Object.values(note.sections).flat();
  const selected = allStatements.find((s) => s.id === selectedId);

  if (session.signedAt) {
    const date = new Date(session.signedAt);
    const text = noteToText(note, [
      `${type.name} — ${session.patient.name}, ${session.patient.age}`,
      `Signed by E. Sandberg, CPO, ${date.toLocaleString()}`,
    ]);
    return (
      <SignedView
        title={title}
        signedAt={session.signedAt}
        noteText={text}
        fileName={`${session.patient.name.replace(/\s+/g, '-').toLowerCase()}-${type.id}.txt`}
        missingCount={missing.length}
        onNewEncounter={newEncounter}
      />
    );
  }

  function setNote(next: ClinicalNote) {
    update({ note: next });
  }

  function mapSection(section: SoapSection, fn: (list: NoteStatement[]) => NoteStatement[]) {
    setNote({ ...note!, sections: { ...note!.sections, [section]: fn(note!.sections[section]) } });
  }

  function saveStatement(section: SoapSection, id: string, text: string) {
    mapSection(section, (list) =>
      list.map((s) => (s.id === id && s.text !== text ? { ...s, text, edited: s.origin !== 'clinician' } : s)),
    );
  }

  function setEditing(id: string, editing: boolean) {
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (editing) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function removeStatement(section: SoapSection, stmt: NoteStatement) {
    setEditing(stmt.id, false);
    const sections = { ...note!.sections, [section]: note!.sections[section].filter((s) => s.id !== stmt.id) };
    // If that was the only statement for a required item, the item is missing again.
    const item = checklist.find((i) => i.id === stmt.itemId);
    const stillCovered = Object.values(sections).flat().some((s) => s.itemId === stmt.itemId);
    const missingItemIds =
      item && item.priority === 'required' && !stillCovered && !note!.missingItemIds.includes(item.id)
        ? [...note!.missingItemIds, item.id]
        : note!.missingItemIds;
    setNote({ ...note!, sections, missingItemIds });
    setSelectedId(undefined);
    toast('Statement removed');
  }

  function fillGap(item: RequiredItem, text: string) {
    const stmt: NoteStatement = {
      id: `clinician-${item.id}`,
      text,
      sourceSegmentIds: [],
      itemId: item.id,
      origin: 'clinician',
    };
    setNote({
      ...note!,
      sections: { ...note!.sections, [item.soap]: [...note!.sections[item.soap], stmt] },
      missingItemIds: note!.missingItemIds.filter((id) => id !== item.id),
    });
    setSelectedId(stmt.id);
    toast(`Added “${item.label}”`);
  }

  function goToGap(item: RequiredItem | undefined) {
    const el = item && gapRefs.current.get(item.id);
    if (!el) return;
    scrollWithin(noteRef.current, el);
    el.focus({ preventScroll: true });
  }

  function handleApprove() {
    const [openEdit] = editingIds;
    if (openEdit) {
      toast('Save or cancel your edit before signing.');
      const el = document.getElementById(`edit-${openEdit}`);
      scrollWithin(noteRef.current, el);
      el?.focus({ preventScroll: true });
      return;
    }
    if (missing.length) setApproveOpen(true);
    else sign();
  }

  function sign() {
    setApproveOpen(false);
    // Earlier confirmations would otherwise cover the signed screen.
    notifications.clean();
    update({ signedAt: new Date().toISOString() });
  }

  const payerMissing = missing.filter((i) => i.payerCritical).length;

  return (
    <div className="review">
      <header className="review-bar">
        <div>
          <Title order={1} fz={26}>Review note</Title>
          <Text c="dimmed" fz="sm">{title} · recorded {formatDuration(session.transcript.durationSec)}</Text>
        </div>
        <div className="review-bar-actions">
          <Button variant="default" size="lg" onClick={() => toast('Draft saved')}>Save draft</Button>
          <Button size="lg" onClick={handleApprove}>
            Approve and sign
          </Button>
        </div>
      </header>

      <main className="review-body">
        {missing.length > 0 ? (
          <div className="review-banner is-warning">
            <Icon name="alert" size={22} />
            <p>
              <b>{missing.length} required item{missing.length === 1 ? '' : 's'} missing</b>
              {/* Name them when there are a few; past that the gap cards do the listing. */}
              {missing.length <= 3 ? `: ${missing.map((i) => i.label).join(', ')}.` : '. Each one is marked in the note below.'}
              {payerMissing > 0 &&
                (payerMissing === missing.length
                  ? ` Payers commonly deny claims without ${missing.length === 1 ? 'it' : 'these'}.`
                  : ` ${payerMissing} of them ${payerMissing === 1 ? 'is' : 'are'} commonly required by payers.`)}
            </p>
            <Button variant="subtle" color="amber.8" onClick={() => goToGap(missing[0])}>
              Go to {missing.length === 1 ? 'item' : 'first item'}
            </Button>
          </div>
        ) : (
          <div className="review-banner is-ok">
            <Icon name="check" size={22} strokeWidth={2.5} />
            <p><b>Everything on the checklist is documented.</b> Check the statements, then sign.</p>
          </div>
        )}

        <div className="review-grid">
          <article className="note" aria-label="Clinical note" ref={noteRef}>
            {SOAP_SECTIONS.map(({ key, label }) => {
              const statements = note.sections[key];
              const gaps = missing.filter((i) => i.soap === key);
              return (
                <section key={key} className="note-section" aria-labelledby={`h-${key}`}>
                  <h2 id={`h-${key}`}>{label}</h2>
                  {statements.length === 0 && gaps.length === 0 && <p className="note-empty">Nothing documented.</p>}
                  {statements.length > 0 && (
                    <ul className="stmt-list">
                      {statements.map((s) => (
                        <StatementRow
                          key={s.id}
                          statement={s}
                          evidenceAt={segmentStart.get(s.sourceSegmentIds[0])}
                          selected={s.id === selectedId}
                          onSelect={() => setSelectedId(s.id === selectedId ? undefined : s.id)}
                          onSave={(text) => saveStatement(key, s.id, text)}
                          onRemove={() => removeStatement(key, s)}
                          onEditingChange={(editing) => setEditing(s.id, editing)}
                        />
                      ))}
                    </ul>
                  )}
                  {gaps.map((item) => (
                    <GapCard
                      key={item.id}
                      item={item}
                      ref={(el) => {
                        if (el) gapRefs.current.set(item.id, el);
                        else gapRefs.current.delete(item.id);
                      }}
                      onAdd={(text) => fillGap(item, text)}
                    />
                  ))}
                </section>
              );
            })}
          </article>

          <TranscriptPanel
            transcript={session.transcript}
            highlightedIds={selected?.sourceSegmentIds ?? []}
            flags={session.flags ?? []}
            selectedWithoutSource={!!selected && selected.sourceSegmentIds.length === 0}
          />
        </div>
      </main>

      <ApproveDialog
        open={approveOpen}
        missing={missing}
        onGoToItem={() => {
          setApproveOpen(false);
          requestAnimationFrame(() => goToGap(missing[0]));
        }}
        onApprove={sign}
        onClose={() => setApproveOpen(false)}
      />
    </div>
  );
}
