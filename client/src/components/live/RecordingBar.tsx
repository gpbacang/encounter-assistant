import { formatClock, type RecordingStatus } from '../../hooks/useSimulatedRecording';
import { Icon } from '../Icon';

interface Props {
  patientName: string;
  encounterName: string;
  status: RecordingStatus;
  elapsed: number;
  onFlag: () => void;
  onTogglePause: () => void;
  onEnd: () => void;
}

/** Always-visible recording state plus the three controls a clinician needs mid-visit. */
export function RecordingBar({ patientName, encounterName, status, elapsed, onFlag, onTogglePause, onEnd }: Props) {
  const recording = status === 'recording';
  return (
    <header className="rec-bar">
      <div className="rec-patient">
        <h1 className="rec-patient-name">{patientName}</h1>
        <span className="rec-patient-type">{encounterName}</span>
      </div>

      <div className={`rec-status ${recording ? 'is-recording' : 'is-paused'}`}>
        {recording ? <span className="rec-dot" aria-hidden="true" /> : <Icon name="pause" size={14} strokeWidth={3} />}
        {/* Only the state is announced; the ticking clock would be noise for screen readers. */}
        <span className="rec-label" role="status">{recording ? 'Recording' : 'Paused'}</span>
        <span className="rec-clock" aria-label={`Elapsed ${formatClock(elapsed)}`}>{formatClock(elapsed)}</span>
        <span className="rec-wave" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} style={{ animationDelay: `${(i % 4) * 120}ms` }} />
          ))}
        </span>
      </div>

      <div className="rec-actions">
        <button type="button" className="btn btn-bar" onClick={onFlag}>
          <Icon name="flag" />
          Flag moment
        </button>
        <button type="button" className="btn btn-bar" onClick={onTogglePause}>
          <Icon name={recording ? 'pause' : 'play'} />
          {recording ? 'Pause' : 'Resume'}
        </button>
        <button type="button" className="btn btn-bar btn-dark" onClick={onEnd}>End visit</button>
      </div>
    </header>
  );
}
