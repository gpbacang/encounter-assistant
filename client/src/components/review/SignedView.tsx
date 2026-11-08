import { useState } from 'react';
import { Icon } from '../Icon';

interface Props {
  title: string;
  signedAt: string;
  noteText: string;
  fileName: string;
  missingCount: number;
  onNewEncounter: () => void;
}

/** After signing: get the note out (export to the record system is mocked). */
export function SignedView({ title, signedAt, noteText, fileName, missingCount, onNewEncounter }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(noteText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([noteText], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  const time = new Date(signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <main className="processing">
      <div className="processing-card signed">
        <span className="signed-badge" aria-hidden="true">
          <Icon name="check" size={28} strokeWidth={3} />
        </span>
        <h1>Note signed</h1>
        <p className="processing-lead">
          {title} · signed by E. Sandberg, CPO at {time}
          {missingCount > 0 && `, with ${missingCount} item${missingCount === 1 ? '' : 's'} missing`}.
        </p>
        <div className="signed-actions">
          <button type="button" className="btn btn-icon" onClick={copy}>
            <Icon name={copied ? 'check' : 'copy'} size={16} />
            {copied ? 'Copied' : 'Copy note'}
          </button>
          <button type="button" className="btn btn-icon" onClick={download}>
            <Icon name="download" size={16} />
            Download as text
          </button>
        </div>
        <p className="signed-hint" role="status">{copied ? 'Note copied to the clipboard.' : ''}</p>
        <button type="button" className="btn btn-primary btn-large" onClick={onNewEncounter}>Start next encounter</button>
      </div>
    </main>
  );
}
