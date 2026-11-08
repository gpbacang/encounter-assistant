/**
 * What "dictation" returns for gaps the scripted visit leaves open. Dictation
 * is simulated in the prototype; items without a sample fall back to typing.
 */
export const mockDictations: Record<string, string> = {
  'medical-necessity':
    'Recommend a left transtibial prosthesis with a total surface bearing socket, pin lock suspension and an energy storing foot. A basic solid ankle foot would not let her walk three blocks to school or return to work at the library.',
  'strength-balance':
    'Hip and knee strength 4+/5 bilaterally. Stands unsupported for 30 seconds with walker nearby. No knee flexion contracture.',
  'k-level': 'Functional level K2, limited community ambulator, based on current walker use and stated goals.',
  measurements: 'Length from knee joint line 14 cm. Circumference 31 cm mid-limb, 28 cm distal.',
};
