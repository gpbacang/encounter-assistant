import { Navigate, useNavigate } from 'react-router-dom';
import { getEncounterType } from '@encounter/shared';
import { useSession } from '../session';

/** Placeholder until the review step builds the SOAP review screen. */
export function ReviewPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const type = session.encounterTypeId ? getEncounterType(session.encounterTypeId) : undefined;
  if (!session.patient || !type) return <Navigate to="/" replace />;

  return (
    <main className="placeholder">
      <p className="eyebrow">Review note</p>
      <h1>{session.patient.name} · {type.name}</h1>
      <p className="muted">The SOAP review screen comes after the live screen and backend.</p>
      <div className="placeholder-actions">
        <button type="button" className="btn" onClick={() => navigate('/')}>New encounter</button>
      </div>
    </main>
  );
}
