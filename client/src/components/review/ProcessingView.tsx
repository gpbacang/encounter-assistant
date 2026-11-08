import { Button, Loader, Paper, Text, Title, VisuallyHidden } from '@mantine/core';
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
      <Paper className="processing-card" aria-busy={!failed}>
        <Title order={1} fz={30}>{failed ? 'We couldn’t finish your note' : 'Preparing your note'}</Title>
        <Text className="processing-lead">
          {failed ? 'Your recording is saved, so nothing is lost.' : 'This usually takes a few seconds.'}
        </Text>

        <ol className="processing-steps">
          {STEPS.map((step) => {
            const status = statusOf(step.key, state);
            return (
              <li key={step.key} className={`is-${status}`} aria-current={status === 'active' ? 'step' : undefined}>
                <span className="processing-icon" aria-hidden="true">
                  {status === 'done' && <Icon name="check" size={16} strokeWidth={3} />}
                  {status === 'active' && <Loader size={16} color="everi" />}
                  {status === 'failed' && <Icon name="close" size={16} strokeWidth={3} />}
                </span>
                <span>{step.label}</span>
                <VisuallyHidden>
                  {status === 'done' ? '(done)' : status === 'active' ? '(in progress)' : status === 'failed' ? '(failed)' : ''}
                </VisuallyHidden>
              </li>
            );
          })}
        </ol>

        {failed && (
          <div className="processing-error" role="alert">
            <p>{state.error}</p>
            {state.retryable ? (
              <Button onClick={onRetry}>Try again</Button>
            ) : (
              <p className="processing-hint">Trying again won’t help with this one. Check the details and start a new encounter.</p>
            )}
          </div>
        )}
      </Paper>
    </main>
  );
}
