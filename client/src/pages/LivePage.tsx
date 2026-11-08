import { Navigate, useNavigate } from 'react-router-dom';
import { getEncounterType } from '@encounter/shared';
import { useSession } from '../session';

/** Placeholder until step 4 builds the in-meeting screen. */
export function LivePage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const type = session.encounterTypeId ? getEncounterType(session.encounterTypeId) : undefined;
  if (!session.patient || !type) return <Navigate to="/" replace />;

  return (
    <main className="placeholder">
      <p className="eyebrow">Live encounter</p>
      <h1>{session.patient.name} · {type.name}</h1>
      <p className="muted">The in-meeting screen is built in step 4.</p>
      <div className="placeholder-actions">
        <button type="button" className="btn" onClick={() => navigate('/')}>Back to setup</button>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/review')}>End visit</button>
      </div>
    </main>
  );
}
