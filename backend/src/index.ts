import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateFrames } from './routes/generateFrames.js';
import { generateVideo } from './routes/generateVideo.js';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.post('/api/generate-frames', generateFrames);
app.post('/api/generate-video', generateVideo);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`ReRoom backend running on :${PORT}`));
