import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  detectCoverage,
  getEncounterType,
  initialEvalTranscript,
  missingRequired,
  mockTranscripts,
  nextSuggestion,
} from '@encounter/shared';
import { ChecklistStatus } from '../components/live/ChecklistStatus';
import { JustCaptured, NextUpCard, ProgressCard } from '../components/live/GuidancePanel';
import { RecordingBar } from '../components/live/RecordingBar';
import { TranscriptStrip } from '../components/live/TranscriptStrip';
import { WrapUpDialog } from '../components/live/WrapUpDialog';
import { formatClock, useSimulatedRecording } from '../hooks/useSimulatedRecording';
import { useSession } from '../session';
import './live.css';

/** How long (in encounter seconds) the "Just captured" confirmation stays up. */
const CAPTURED_VISIBLE_FOR = 20;

/**
 * Step 2 of the flow: the visit itself. Designed to need no input: the
 * clinician glances at it, and items tick off as the conversation covers them.
 */
export function LivePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, update } = useSession();
  const checklist = session.checklist ?? [];
  const type = session.encounterTypeId ? getEncounterType(session.encounterTypeId) : undefined;

  // The demo plays one scripted conversation; ?speed=1 plays it in real time.
  const speed = Number(new URLSearchParams(location.search).get('speed')) || 5;
  const transcript = (type && mockTranscripts[type.id]) ?? initialEvalTranscript;
  const rec = useSimulatedRecording(transcript, speed);

  const [flags, setFlags] = useState<number[]>([]);
  const [toast, setToast] = useState('');
  const [wrapUpOpen, setWrapUpOpen] = useState(false);

  const view = useMemo(() => {
    const list = { items: checklist };
    const coverage = detectCoverage(list, rec.heard);
    const heardAt = new Map(rec.heard.map((s) => [s.id, s.end]));
    const covered = coverage
      .filter((c) => c.state === 'covered' && c.segmentId)
      .map((c) => ({ item: checklist.find((i) => i.id === c.itemId)!, at: heardAt.get(c.segmentId!)! }))
      .sort((a, b) => a.at - b.at);
    const coveredIds = new Set(covered.map((c) => c.item.id));
    const open = checklist.filter((i) => !coveredIds.has(i.id));
    const required = checklist.filter((i) => i.priority === 'required');
    return {
      covered,
      open,
      suggestion: nextSuggestion(list, coverage),
      missing: missingRequired(list, coverage),
      requiredTotal: required.length,
      requiredCovered: required.filter((i) => coveredIds.has(i.id)).length,
      payerLeft: open.filter((i) => i.payerCritical && i.priority === 'required').length,
      optionalLeft: open.filter((i) => i.priority === 'recommended'),
    };
  }, [checklist, rec.heard]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!session.patient || !type || !session.checklist) return <Navigate to="/" replace />;

  const latest = view.covered[view.covered.length - 1];
  const showCaptured = latest && rec.elapsed - latest.at < CAPTURED_VISIBLE_FOR;

  function finish() {
    update({
      transcript: { encounterTypeId: type!.id, durationSec: Math.round(rec.elapsed), segments: rec.heard },
      flags,
    });
    navigate(`/review${location.search}`);
  }

  function handleEnd() {
    if (view.missing.length === 0) return finish();
    rec.pause();
    setWrapUpOpen(true);
  }

  function handleFlag() {
    setFlags((f) => [...f, rec.elapsed]);
    setToast(`Moment flagged at ${formatClock(rec.elapsed)}`);
  }

  return (
    <div className="live">
      <RecordingBar
        patientName={session.patient.name}
        encounterName={type.name}
        status={rec.status}
        elapsed={rec.elapsed}
        onFlag={handleFlag}
        onTogglePause={rec.status === 'recording' ? rec.pause : rec.resume}
        onEnd={handleEnd}
      />

      <p className={`toast ${toast ? 'is-visible' : ''}`} role="status">{toast}</p>

      <main className="live-main">
        <div className="live-guidance">
          <NextUpCard item={view.suggestion} />
          <ProgressCard covered={view.requiredCovered} total={view.requiredTotal} payerLeft={view.payerLeft} />
          <div className="captured-slot" aria-live="polite">
            {showCaptured && <JustCaptured item={latest.item} at={latest.at} />}
          </div>
        </div>
        <ChecklistStatus open={view.open} covered={view.covered} suggestedId={view.suggestion?.id} />
      </main>

      <TranscriptStrip heard={rec.heard} speaking={rec.speaking} />

      <WrapUpDialog
        open={wrapUpOpen}
        missing={view.missing}
        optionalLeft={view.optionalLeft}
        onKeepRecording={() => {
          setWrapUpOpen(false);
          rec.resume();
        }}
        onEndAnyway={finish}
      />
    </div>
  );
}
