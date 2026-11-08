import type { PipelineState } from '../../hooks/useNotePipeline';
import { Icon } from '../Icon';

const STEPS = [
  { key: 'transcribing', label: 'Transcribing the recording' },
  { key: 'drafting', label: 'Drafting the SOAP note' },
] as const;

type StepStatus = 'done' | 'active' | 'failed' | 'waiting';

function statusOf(step: (typeof STEPS)[number]['key'], state: PipelineState): StepStatus {
  const order = STEPS.findIndex((s) => s.key === step);
  if (state.stage === 'error') {
    const failed = STEPS.findIndex((s) => s.key === state.failedAt);
    return order < failed ? 'done' : order === failed ? 'failed' : 'waiting';
  }
  const current = STEPS.findIndex((s) => s.key === state.stage);
  return order < current ? 'done' : order === current ? 'active' : 'waiting';
}

/** The short wait between ending the visit and reviewing the note. */
export function ProcessingView({ state, onRetry }: { state: PipelineState; onRetry: () => void }) {
  const failed = state.stage === 'error';
  return (
    <main className="processing">
      <div className="processing-card" aria-busy={!failed}>
        <h1>{failed ? 'We couldn’t finish your note' : 'Preparing your note'}</h1>
        <p className="processing-lead">
          {failed ? 'Your recording is saved, so nothing is lost.' : 'This usually takes a few seconds.'}
        </p>

        <ol className="processing-steps">
          {STEPS.map((step) => {
            const status = statusOf(step.key, state);
            return (
              <li key={step.key} className={`is-${status}`} aria-current={status === 'active' ? 'step' : undefined}>
                <span className="processing-icon" aria-hidden="true">
                  {status === 'done' && <Icon name="check" size={16} strokeWidth={3} />}
                  {status === 'active' && <span className="spinner" />}
                  {status === 'failed' && <Icon name="close" size={16} strokeWidth={3} />}
                </span>
                <span>{step.label}</span>
                <span className="sr-only">
                  {status === 'done' ? '(done)' : status === 'active' ? '(in progress)' : status === 'failed' ? '(failed)' : ''}
                </span>
              </li>
            );
          })}
        </ol>

        {failed && (
          <div className="processing-error" role="alert">
            <p>{state.error}</p>
            {state.retryable ? (
              <button type="button" className="btn btn-primary" onClick={onRetry}>Try again</button>
            ) : (
              <p className="processing-hint">Trying again won’t help with this one. Check the details and start a new encounter.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
