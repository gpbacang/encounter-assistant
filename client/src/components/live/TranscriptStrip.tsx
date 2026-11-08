import { useEffect, useRef, useState } from 'react';
import { Button } from '@mantine/core';
import type { TranscriptSegment } from '@encounter/shared';
import { formatClock } from '../../hooks/useSimulatedRecording';
import { Icon } from '../Icon';

interface Props {
  heard: TranscriptSegment[];
  speaking?: { segment: TranscriptSegment; text: string };
}

const speakerLabel = (s: TranscriptSegment['speaker']) => (s === 'clinician' ? 'Clinician' : 'Patient');

/**
 * Collapsed to one muted line by default: the clinician should be looking at
 * the patient, not reading. Expands to the full transcript on request.
 */
export function TranscriptStrip({ heard, speaking }: Props) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const latest = speaking ?? (heard.length ? { segment: heard[heard.length - 1], text: heard[heard.length - 1].text } : undefined);

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, heard.length, speaking?.text]);

  return (
    <section className={`transcript ${open ? 'is-open' : ''}`} aria-label="Live transcript">
      {open && (
        <ol id="transcript-list" ref={listRef} className="transcript-list" tabIndex={0} aria-label="Transcript so far">
          {heard.map((s) => (
            <li key={s.id}>
              <span className="transcript-time">{formatClock(s.start)}</span>
              <span><b>{speakerLabel(s.speaker)}</b> · {s.text}</span>
            </li>
          ))}
          {speaking && (
            <li className="is-speaking">
              <span className="transcript-time">{formatClock(speaking.segment.start)}</span>
              <span><b>{speakerLabel(speaking.segment.speaker)}</b> · {speaking.text}</span>
            </li>
          )}
        </ol>
      )}
      <div className="transcript-bar">
        <span className="transcript-title">Live transcript</span>
        {!open && (
          <span className="transcript-line">
            {latest ? `${speakerLabel(latest.segment.speaker)}: ${latest.text}` : 'Listening…'}
          </span>
        )}
        <Button
          variant="subtle"
          className="transcript-toggle"
          leftSection={<Icon name={open ? 'chevronDown' : 'chevronUp'} size={16} strokeWidth={2.5} />}
          aria-expanded={open}
          aria-controls="transcript-list"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Hide transcript' : 'Show transcript'}
        </Button>
      </div>
    </section>
  );
}
