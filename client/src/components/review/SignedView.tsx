import { Button, CopyButton, Group, Paper, Text, ThemeIcon, Title } from '@mantine/core';
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
      <Paper className="processing-card signed">
        <ThemeIcon size={56} radius="xl" color="everi" aria-hidden="true">
          <Icon name="check" size={28} strokeWidth={3} />
        </ThemeIcon>
        <Title order={1} fz={30}>Note signed</Title>
        <Text className="processing-lead">
          {title} · signed by E. Sandberg, CPO at {time}
          {missingCount > 0 && `, with ${missingCount} item${missingCount === 1 ? '' : 's'} missing`}.
        </Text>
        <CopyButton value={noteText} timeout={2500}>
          {({ copied, copy }) => (
            <>
              <Group justify="center" gap="sm">
                <Button
                  variant="default"
                  leftSection={<Icon name={copied ? 'check' : 'copy'} size={16} />}
                  onClick={copy}
                >
                  {copied ? 'Copied' : 'Copy note'}
                </Button>
                <Button variant="default" leftSection={<Icon name="download" size={16} />} onClick={download}>
                  Download as text
                </Button>
              </Group>
              <p className="signed-hint" role="status">{copied ? 'Note copied to the clipboard.' : ''}</p>
            </>
          )}
        </CopyButton>
        <Button size="lg" fullWidth onClick={onNewEncounter}>Start next encounter</Button>
      </Paper>
    </main>
  );
}
