import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Transcript, TranscriptSegment } from '@encounter/shared';

export type RecordingStatus = 'recording' | 'paused';

/**
 * Plays a scripted transcript as if it were being recorded live.
 *
 * Time runs `speed` times faster than real time so the demo takes under a
 * minute (override with ?speed=1 in the URL). A segment counts as "heard"
 * once its end time has passed; the one being spoken is exposed separately
 * with the words said so far, so the transcript appears to stream.
 */
export function useSimulatedRecording(transcript: Transcript, speed: number) {
  const [status, setStatus] = useState<RecordingStatus>('recording');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== 'recording') return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = ((now - last) / 1000) * speed;
      last = now;
      setElapsed((e) => e + delta);
    }, 200);
    return () => window.clearInterval(id);
  }, [status, speed]);

  const heard = useMemo(
    () => transcript.segments.filter((s) => s.end <= elapsed),
    [transcript, elapsed],
  );

  const speaking = useMemo((): { segment: TranscriptSegment; text: string } | undefined => {
    const seg = transcript.segments.find((s) => s.start <= elapsed && s.end > elapsed);
    if (!seg) return undefined;
    const words = seg.text.split(' ');
    const shown = Math.max(1, Math.ceil(((elapsed - seg.start) / (seg.end - seg.start)) * words.length));
    return { segment: seg, text: words.slice(0, shown).join(' ') };
  }, [transcript, elapsed]);

  const pause = useCallback(() => setStatus('paused'), []);
  const resume = useCallback(() => setStatus('recording'), []);

  return { status, elapsed, heard, speaking, pause, resume };
}

export function formatClock(seconds: number): string {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
