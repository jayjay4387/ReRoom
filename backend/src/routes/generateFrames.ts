import { Request, Response } from 'express';
import { chaosPrompt, finalDesignPrompt, QuestionnaireAnswers } from '../prompts';

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
    const [chaosFrameCandidates, finalFrameCandidates] = await Promise.all([
      generateCandidates(imageBase64, chaosPrompt(answers), 4),
      generateCandidates(imageBase64, finalDesignPrompt(answers), 4),
    ]);

    res.json({ chaosFrameCandidates, finalFrameCandidates, description: '' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generate-frames] 500', message);
    res.status(500).json({ error: message });
  }
}
