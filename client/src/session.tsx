import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ClinicalNote, RequiredItem, Transcript } from '@encounter/shared';

export interface Patient {
  id: string;
  name: string;
  age: number;
  detail: string;
}

export const mockPatients: Patient[] = [
  { id: 'p1', name: 'Maria Lindqvist', age: 67, detail: 'Referred for left transtibial prosthesis' },
  { id: 'p2', name: 'Jonas Ekström', age: 42, detail: 'Test socket fitting, right transfemoral' },
  { id: 'p3', name: 'Aisha Karimi', age: 58, detail: '12-month review, left transtibial' },
];

/**
 * One encounter, from setup through review. Kept in memory only:
 * a refresh starts over, which is fine for the prototype.
 */
interface Session {
  patient?: Patient;
  encounterTypeId?: string;
  /** This visit's checklist: the template minus hidden items, plus added ones. */
  checklist?: RequiredItem[];
  /** What the live screen heard: a streaming draft, used until the final transcript arrives. */
  liveTranscript?: Transcript;
  /** Final transcription of the whole recording, from the API. The note is built from this. */
  transcript?: Transcript;
  /** Moments the clinician flagged during the visit, in seconds from the start. */
  flags?: number[];
  note?: ClinicalNote;
  /** Set when the clinician approves and signs the note. */
  signedAt?: string;
}

interface SessionContextValue {
  session: Session;
  /** Begin a new encounter, discarding any previous one. */
  start: (init: { patient: Patient; encounterTypeId: string; checklist: RequiredItem[] }) => void;
  update: (patch: Partial<Session>) => void;
  reset: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({});
  const value: SessionContextValue = {
    session,
    start: (init) => setSession({ ...init }),
    update: (patch) => setSession((s) => ({ ...s, ...patch })),
    reset: () => setSession({}),
  };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
