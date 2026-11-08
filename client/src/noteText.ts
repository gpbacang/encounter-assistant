import type { ClinicalNote, SoapSection } from '@encounter/shared';

export const SOAP_SECTIONS: { key: SoapSection; label: string }[] = [
  { key: 'subjective', label: 'Subjective' },
  { key: 'objective', label: 'Objective' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'plan', label: 'Plan' },
];

/** Plain-text version of the note, for copying into another system or downloading. */
export function noteToText(note: ClinicalNote, header: string[]): string {
  const lines = [...header, ''];
  for (const { key, label } of SOAP_SECTIONS) {
    lines.push(label.toUpperCase());
    const statements = note.sections[key];
    if (statements.length === 0) lines.push('- None documented.');
    for (const s of statements) lines.push(`- ${s.text}`);
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}
