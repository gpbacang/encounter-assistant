import type { Transcript } from './types';

/**
 * Scripted conversation for the demo. The live screen streams these segments
 * on a timer; the mock backend returns them from /transcribe.
 *
 * It intentionally never covers "Recommended device and why" (payer-critical)
 * or "Strength, balance and range of motion", so the wrap-up nudge and the
 * review screen's missing-information state both have something to show.
 */
export const initialEvalTranscript: Transcript = {
  encounterTypeId: 'initial-eval',
  durationSec: 258,
  segments: [
    { id: 'seg-01', speaker: 'clinician', start: 0, end: 4, text: 'Good morning, Maria. What brings you in today?' },
    { id: 'seg-02', speaker: 'patient', start: 5, end: 16, text: "My surgeon referred me. I had my left leg amputated below the knee in March, and I'm ready to start walking again." },
    { id: 'seg-03', speaker: 'clinician', start: 17, end: 20, text: 'What led to the amputation?' },
    { id: 'seg-04', speaker: 'patient', start: 21, end: 30, text: "An infection that wouldn't heal. I've had type 2 diabetes for about fifteen years." },
    { id: 'seg-05', speaker: 'clinician', start: 31, end: 35, text: 'How are you getting around at the moment?' },
    { id: 'seg-06', speaker: 'patient', start: 36, end: 45, text: 'Mostly a wheelchair at home. I can use a walker to get to the bathroom.' },
    { id: 'seg-07', speaker: 'clinician', start: 46, end: 52, text: 'And once you have the leg, what would you like to be able to do?' },
    { id: 'seg-08', speaker: 'patient', start: 53, end: 66, text: "I want to get back to my job at the library, and walk my granddaughter to school. It's about three blocks." },
    { id: 'seg-09', speaker: 'clinician', start: 80, end: 94, text: "Let's take a look at the residual limb. The incision has healed well, no open areas. The skin is a little dry." },
    { id: 'seg-10', speaker: 'patient', start: 95, end: 99, text: "It's tender right at the end sometimes." },
    { id: 'seg-11', speaker: 'clinician', start: 100, end: 118, text: "Noted, mild tenderness distally. I'll measure now. Length from the knee joint line is fourteen centimeters." },
    { id: 'seg-12', speaker: 'clinician', start: 130, end: 140, text: 'Circumference at mid-limb is thirty-one centimeters, distal is twenty-eight.' },
    { id: 'seg-13', speaker: 'patient', start: 141, end: 143, text: 'Is that normal?' },
    { id: 'seg-14', speaker: 'clinician', start: 144, end: 158, text: "Yes, that's a good shape for a first leg. It's still settling, so it may change over the next few months." },
    { id: 'seg-15', speaker: 'clinician', start: 200, end: 222, text: "Given your goals and how you're doing with the walker, I'd put you at K-level 2, a limited community ambulator." },
    { id: 'seg-16', speaker: 'patient', start: 223, end: 226, text: 'What does that mean for me?' },
    { id: 'seg-17', speaker: 'clinician', start: 227, end: 250, text: 'It means you should be able to manage curbs and short distances outside. We will start with a test fitting in about two weeks.' },
    { id: 'seg-18', speaker: 'patient', start: 251, end: 254, text: 'Okay, that sounds good.' },
  ],
};

export const mockTranscripts: Record<string, Transcript> = {
  'initial-eval': initialEvalTranscript,
};
