import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { finalDesignPrompt, QuestionnaireAnswers } from '../prompts';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(base64: string): Promise<string> {
  const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64}`, {
    folder: 'reroom/frames',
  });
  return result.secure_url;
}

async function generateCandidates(imageBase64: string, prompt: string, count: number): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json() as { candidates?: { content?: { parts?: { inlineData?: { data: string } }[] } }[] };
    const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (part?.inlineData?.data) results.push(part.inlineData.data);
  }
  return results;
}

export async function generateFrames(req: Request, res: Response): Promise<void> {
  const { imageBase64, answers } = req.body as { imageBase64?: string; answers?: QuestionnaireAnswers };

  if (!imageBase64 || !answers) {
    res.status(400).json({ error: 'Missing required fields: imageBase64, answers' });
    return;
  }

  try {
    // One Gemini call: the redesigned-room still shown next to the video. The video itself
    // animates the original photo, so we no longer generate chaos frames or best-of-4 candidates.
    console.log('[generate-frames] start — generating redesign with Gemini...');
    const redesignBase64s = await generateCandidates(imageBase64, finalDesignPrompt(answers), 1);
    const redesignBase64 = redesignBase64s[0];
    if (!redesignBase64) throw new Error('Gemini returned no image');

    console.log('[generate-frames] Gemini done — uploading original + redesign to Cloudinary...');
    const [originalUrl, redesignUrl] = await Promise.all([
      uploadToCloudinary(imageBase64),    // the real photo — animated by the video + saved
      uploadToCloudinary(redesignBase64), // the redesigned-room still shown on the result screen
    ]);

    console.log('[generate-frames] done -> originalUrl + redesignUrl');
    res.json({ originalUrl, redesignUrl, description: '' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generate-frames] 500', message);
    res.status(500).json({ error: message });
  }
}
