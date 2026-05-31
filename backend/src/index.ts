import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateFrames } from './routes/generateFrames';
import { submitVideo, pollVideo } from './routes/generateVideo';
import { saveRedesign } from './routes/saveRedesign';
import { getGallery } from './routes/gallery';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.post('/api/generate-frames', generateFrames);
app.post('/api/generate-video', submitVideo);
app.get('/api/generate-video', pollVideo);
app.post('/api/save-redesign', saveRedesign);
app.get('/api/gallery', getGallery);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`\nReRoom backend running on :${PORT}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('POSTMAN TEST — POST /api/generate-frames');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`URL:     POST http://localhost:${PORT}/api/generate-frames`);
  console.log('Headers: Content-Type: application/json');
  console.log('Body (raw JSON):');
  console.log(JSON.stringify({
    imageBase64: '<base64 string of your room photo>',
    answers: {
      vibe: 'minimal',
      usage: 'living room',
      color: 'neutral',
      material: 'wood',
      transformationLevel: 'full',
    },
  }, null, 2));
  console.log('\nExpected response:');
  console.log(JSON.stringify({
    chaosFrameCandidates: ['https://res.cloudinary.com/...', '...', '...', '...'],
    finalFrameCandidates: ['https://res.cloudinary.com/...', '...', '...', '...'],
    description: '',
  }, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
