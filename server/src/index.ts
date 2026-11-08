import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { encounterTypes, getEncounterType } from '@encounter/shared';
import { mockNotes, mockTranscription, simulateNetwork } from './providers/mock';
import { realNotes, realTranscription } from './providers/real';
import { ProviderError } from './providers/types';
import { parseGenerateNote } from './validate';

const useReal = process.env.PROVIDER === 'real';
const transcription = useReal ? realTranscription : mockTranscription;
const notes = useReal ? realNotes : mockNotes;

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// One line per request, so the demo terminal shows the backend at work.
app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - started} ms)`));
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, transcription: transcription.name, notes: notes.name });
});

app.get('/api/encounter-types', (_req, res) => {
  res.json(encounterTypes);
});

/**
 * POST /api/transcribe
 * multipart/form-data: encounterTypeId, durationSec (optional), audio (optional file)
 * Add ?fail=1 to force an error when demoing retry states.
 */
app.post('/api/transcribe', upload.single('audio'), async (req, res, next) => {
  try {
    const encounterTypeId = String(req.body.encounterTypeId ?? '');
    if (!getEncounterType(encounterTypeId)) {
      return res.status(400).json({ error: `Unknown encounter type "${encounterTypeId}".`, retryable: false });
    }
    const rawDuration = req.body.durationSec;
    const durationSec = rawDuration === undefined || rawDuration === '' ? undefined : Number(rawDuration);
    if (durationSec !== undefined && (!Number.isFinite(durationSec) || durationSec < 0)) {
      return res.status(400).json({ error: 'durationSec must be a positive number.', retryable: false });
    }
    if (req.query.fail) await simulateNetwork(true);

    const transcript = await transcription.transcribe({
      encounterTypeId,
      durationSec,
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
 * JSON: GenerateNoteRequest { encounterTypeId, checklist, transcript }
 * Returns a ClinicalNote: SOAP sections whose statements cite transcript
 * segments, plus the required checklist items that were never covered.
 */
app.post('/api/generate-note', async (req, res, next) => {
  try {
    const parsed = parseGenerateNote(req.body);
    if (typeof parsed === 'string') return res.status(400).json({ error: parsed, retryable: false });
    if (!getEncounterType(parsed.encounterTypeId)) {
      return res.status(400).json({ error: `Unknown encounter type "${parsed.encounterTypeId}".`, retryable: false });
    }
    if (req.query.fail) await simulateNetwork(true);

    res.json(await notes.generateNote(parsed));
  } catch (err) {
    next(err);
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ProviderError) {
    return res.status(503).json({ error: err.message, retryable: err.retryable });
  }
  if (typeof err === 'object' && err && 'type' in err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON.', retryable: false });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.', retryable: true });
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`API on http://localhost:${port} (providers: ${transcription.name}/${notes.name})`);
});
