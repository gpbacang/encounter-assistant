import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Checkbox,
  Container,
  Group,
  Paper,
  Radio,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { buildChecklist, createCustomItem, encounterTypes, type RequiredItem } from '@encounter/shared';
import { ChecklistEditor } from '../components/ChecklistEditor';
import { Icon } from '../components/Icon';
import { mockPatients, useSession } from '../session';
import './setup.css';

/**
 * Step 1 of the flow: who the patient is and what kind of visit this is.
 * The encounter type decides the checklist shown during the visit.
 */
export function SetupPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { start } = useSession();
  const [patientId, setPatientId] = useState(mockPatients[0].id);
  const [typeId, setTypeId] = useState(encounterTypes[0].id);
  const [consented, setConsented] = useState(false);
  // Per-visit changes to the checklist. Hidden ids only match optional items,
  // and added items stay when switching encounter type (they're about the patient).
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(new Set());
  const [customItems, setCustomItems] = useState<RequiredItem[]>([]);
  const nextCustomId = useRef(1);

  const type = encounterTypes.find((t) => t.id === typeId)!;
  const checklist = buildChecklist(type, hiddenIds, customItems);
  const requiredCount = checklist.filter((i) => i.priority === 'required').length;
  const payerCount = checklist.filter((i) => i.payerCritical).length;

  function setHidden(id: string, hide: boolean) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (hide) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleStart() {
    start({ patient: mockPatients.find((p) => p.id === patientId)!, encounterTypeId: typeId, checklist });
    // Keep demo options like ?speed= and ?fail= across screens.
    navigate(`/live${search}`);
  }

  return (
    <Container component="main" size={1180} px={{ base: 'md', sm: 40 }} py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            <Text className="eyebrow">New encounter</Text>
            <Title order={1} fz={32}>Set up the visit</Title>
          </Stack>
          <Group gap="sm">
            <Avatar color="everi" radius="xl" aria-hidden="true">ES</Avatar>
            <Text c="dimmed" fz="sm">E. Sandberg, CPO</Text>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={32}>
          <Stack gap="xl">
            <Radio.Group
              value={patientId}
              onChange={setPatientId}
              label="Patient"
              labelProps={{ fz: 'lg', fw: 600, mb: 'sm' }}
            >
              <Stack gap="sm">
                {mockPatients.map((p) => (
                  <Radio.Card key={p.id} value={p.id} p="md" className="choice-card">
                    <Group wrap="nowrap" align="flex-start" gap="md">
                      <Radio.Indicator mt={2} />
                      <div>
                        <Text fw={600}>{p.name} · {p.age}</Text>
                        <Text fz="sm" c="dimmed">{p.detail}</Text>
                      </div>
                    </Group>
                  </Radio.Card>
                ))}
              </Stack>
            </Radio.Group>

            <Radio.Group
              value={typeId}
              onChange={setTypeId}
              label="Encounter type"
              labelProps={{ fz: 'lg', fw: 600, mb: 'sm' }}
            >
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                {encounterTypes.map((t) => (
                  <Radio.Card key={t.id} value={t.id} p="md" className="choice-card type-card">
                    <Stack gap={6} h="100%">
                      <Group wrap="nowrap" gap="xs" align="flex-start">
                        <Radio.Indicator size="sm" mt={3} />
                        <Text fw={600} lh={1.3}>{t.name}</Text>
                      </Group>
                      <Text fz="sm" c="dimmed" lh={1.4}>{t.summary}</Text>
                      <Text fz="sm" c="dimmed" mt="auto">~{t.typicalMinutes} min</Text>
                    </Stack>
                  </Radio.Card>
                ))}
              </SimpleGrid>
            </Radio.Group>
          </Stack>

          <Paper p={{ base: 'lg', sm: 'xl' }} component="section" aria-labelledby="capture-heading">
            <Stack gap="md">
              <div>
                <Title order={2} id="capture-heading" fz="lg">What we’ll help you capture</Title>
                <Text fz="sm" c="dimmed" mt={4}>
                  {requiredCount} required items; the {payerCount} checked by payers are locked. Everything ticks
                  off on its own as the conversation covers it.
                </Text>
              </div>

              <ChecklistEditor
                templateItems={type.items}
                hiddenIds={hiddenIds}
                customItems={customItems}
                onHide={(item) => setHidden(item.id, true)}
                onRestore={(item) => setHidden(item.id, false)}
                onAdd={(label) => setCustomItems((prev) => [...prev, createCustomItem(label, `custom-${nextCustomId.current++}`)])}
                onRemove={(item) => setCustomItems((prev) => prev.filter((i) => i.id !== item.id))}
              />

              <Stack gap="md" mt="xs">
                <Checkbox
                  id="consent"
                  size="md"
                  checked={consented}
                  onChange={(e) => setConsented(e.currentTarget.checked)}
                  label="Patient has agreed to the visit being recorded"
                />
                <Button
                  size="lg"
                  fullWidth
                  disabled={!consented}
                  onClick={handleStart}
                  leftSection={<Icon name="mic" size={20} />}
                >
                  Start recording
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
