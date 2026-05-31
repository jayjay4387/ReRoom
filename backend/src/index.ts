import './env';
import express from 'express';
import cors from 'cors';
import { generateFrames } from './routes/generateFrames';
import { generateVideo } from './routes/generateVideo';
import { saveRedesign } from './routes/saveRedesign';
import { getGallery } from './routes/gallery';

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.post('/api/generate-frames', generateFrames);
app.post('/api/generate-video', generateVideo);
app.post('/api/save-redesign', saveRedesign);
app.get('/api/gallery', getGallery);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`ReRoom backend running on :${PORT}`));
