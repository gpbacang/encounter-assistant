import { useEffect, useRef, useState } from 'react';
import type { Transcript } from '@encounter/shared';
import { formatClock } from '../../hooks/useSimulatedRecording';
import { scrollWithin } from '../../scrollWithin';
import { Icon } from '../Icon';

interface Props {
  transcript: Transcript;
  /** Segments that back the selected statement. */
  highlightedIds: string[];
  /** Moments flagged during the visit, in seconds. */
  flags: number[];
  /** A statement is selected but has no recording behind it (written during review). */
  selectedWithoutSource?: boolean;
}

/**
 * The source of truth beside the note. Selecting a statement scrolls here
 * and highlights what it was drafted from, so verifying takes a glance.
 */
export function TranscriptPanel({ transcript, highlightedIds, flags, selectedWithoutSource }: Props) {
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const listRef = useRef<HTMLOListElement>(null);
  const [playingFrom, setPlayingFrom] = useState<number | null>(null);
  const first = transcript.segments.find((s) => highlightedIds.includes(s.id));

  // The segment each flag falls in (or the next one after it).
  const flagged = new Set(
    flags.map((t) => (transcript.segments.find((s) => s.end >= t) ?? transcript.segments.at(-1))?.id).filter(Boolean),
  );

  useEffect(() => {
    if (first) scrollWithin(listRef.current, itemRefs.current.get(first.id));
  }, [first?.id]);

  // Playback is simulated: show the state for the length of the passage.
  useEffect(() => {
    if (playingFrom === null) return;
    const id = window.setTimeout(() => setPlayingFrom(null), 4000);
    return () => window.clearTimeout(id);
  }, [playingFrom]);

  useEffect(() => setPlayingFrom(null), [first?.id]);

  return (
    <section className="transcript-panel" aria-labelledby="transcript-heading">
      <div className="transcript-panel-head">
        <h2 id="transcript-heading">Transcript</h2>
        <p>
          {first
            ? 'Showing the evidence for the selected statement.'
            : selectedWithoutSource
              ? 'This statement was written during review, so there’s no recording behind it.'
              : 'Select a statement to see where it came from.'}
        </p>
      </div>

      {transcript.segments.length === 0 && <p className="tp-empty">Nothing was recorded, so there’s no transcript.</p>}
      <ol className="transcript-panel-list" ref={listRef} tabIndex={0} aria-label="Transcript">
        {transcript.segments.map((s) => {
          const on = highlightedIds.includes(s.id);
          return (
            <li
              key={s.id}
              ref={(el) => {
                if (el) itemRefs.current.set(s.id, el);
                else itemRefs.current.delete(s.id);
              }}
              className={on ? 'is-evidence' : undefined}
            >
              <span className="tp-time">{formatClock(s.start)}</span>
              <span className="tp-text">
                <b>{s.speaker === 'clinician' ? 'Clinician' : 'Patient'}</b> · {s.text}
                {on && <span className="sr-only"> (evidence)</span>}
              </span>
              {flagged.has(s.id) && (
                <span className="tp-flag" title="You flagged this moment">
                  <Icon name="flag" size={14} />
                  <span className="sr-only">Flagged</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {first && (
        <button
          type="button"
          className="btn btn-compact btn-icon tp-play"
          onClick={() => setPlayingFrom(playingFrom === null ? first.start : null)}
        >
          <Icon name={playingFrom === null ? 'play' : 'pause'} size={16} />
          {playingFrom === null ? `Play from ${formatClock(first.start)}` : `Playing from ${formatClock(playingFrom)}…`}
        </button>
      )}
    </section>
  );
}
