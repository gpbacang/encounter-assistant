import { Navigate, useNavigate } from 'react-router-dom';
import { getEncounterType, type SoapSection } from '@encounter/shared';
import { ProcessingView } from '../components/review/ProcessingView';
import { useNotePipeline } from '../hooks/useNotePipeline';
import { useSession } from '../session';
import './review.css';

const SECTIONS: { key: SoapSection; label: string }[] = [
  { key: 'subjective', label: 'Subjective' },
  { key: 'objective', label: 'Objective' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'plan', label: 'Plan' },
];

/**
 * Step 3–4 of the flow: process the recording, then review the note.
 * The review itself is a plain preview for now; the next step builds
 * evidence links and filling gaps.
 */
export function ReviewPage() {
  const navigate = useNavigate();
  const { session, update } = useSession();
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

  if (!session.patient || !type || !session.checklist || !session.liveTranscript) return <Navigate to="/" replace />;
  if (pipeline.stage !== 'done' || !session.note) return <ProcessingView state={pipeline} onRetry={pipeline.retry} />;

  const note = session.note;
  const missing = session.checklist.filter((i) => note.missingItemIds.includes(i.id));

  return (
    <main className="review-preview">
      <header className="review-preview-head">
        <div>
          <p className="eyebrow">Review note</p>
          <h1>{session.patient.name} · {type.name}</h1>
        </div>
        <button type="button" className="btn" onClick={() => navigate('/')}>New encounter</button>
      </header>

      {missing.length > 0 && (
        <p className="review-preview-missing">
          <b>{missing.length} required item{missing.length === 1 ? '' : 's'} missing:</b>{' '}
          {missing.map((i) => i.label).join(', ')}
        </p>
      )}

      {SECTIONS.map(({ key, label }) => (
        <section key={key} className="review-preview-section">
          <h2>{label}</h2>
          {note.sections[key].length === 0 ? (
            <p className="muted">Nothing captured.</p>
          ) : (
            <ul>
              {note.sections[key].map((s) => (
                <li key={s.id}>{s.text}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <p className="muted">Evidence links and filling gaps come in the review step.</p>
    </main>
  );
}
