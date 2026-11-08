import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { encounterTypes, getEncounterType, type Transcript } from '@encounter/shared';
import { mockNotes, mockTranscription, simulateNetwork } from './providers/mock';
import { realNotes, realTranscription } from './providers/real';
import { ProviderError } from './providers/types';

const useReal = process.env.PROVIDER === 'real';
const transcription = useReal ? realTranscription : mockTranscription;
const notes = useReal ? realNotes : mockNotes;

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, transcription: transcription.name, notes: notes.name });
});

app.get('/api/encounter-types', (_req, res) => {
  res.json(encounterTypes);
});

/**
 * POST /api/transcribe
 * multipart/form-data: audio (file, optional for mock), encounterTypeId
 * Add ?fail=1 to force an error when demoing retry states.
 */
app.post('/api/transcribe', upload.single('audio'), async (req, res, next) => {
  try {
    const encounterTypeId = String(req.body.encounterTypeId ?? '');
    if (!getEncounterType(encounterTypeId)) {
      return res.status(400).json({ error: `Unknown encounter type "${encounterTypeId}".` });
    }
    if (req.query.fail) await simulateNetwork(true);

    const transcript = await transcription.transcribe({
      encounterTypeId,
      audio: req.file?.buffer,
      mimeType: req.file?.mimetype,
    });
    res.json(transcript);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/generate-note
 * JSON: { encounterTypeId, transcript }
 * Returns a ClinicalNote with SOAP sections and missing required items.
 */
app.post('/api/generate-note', async (req, res, next) => {
  try {
    const { encounterTypeId, transcript } = req.body as { encounterTypeId?: string; transcript?: Transcript };
    const encounterType = encounterTypeId ? getEncounterType(encounterTypeId) : undefined;
    if (!encounterType) {
      return res.status(400).json({ error: `Unknown encounter type "${encounterTypeId}".` });
    }
    if (!transcript || !Array.isArray(transcript.segments)) {
      return res.status(400).json({ error: 'A transcript with segments is required.' });
    }
    if (req.query.fail) await simulateNetwork(true);

    const note = await notes.generateNote({ encounterType, transcript });
    res.json(note);
  } catch (err) {
    next(err);
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ProviderError) {
    return res.status(503).json({ error: err.message, retryable: err.retryable });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.', retryable: true });
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`API on http://localhost:${port} (providers: ${transcription.name}/${notes.name})`);
});
