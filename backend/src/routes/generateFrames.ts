import { Request, Response } from 'express';

type Style = 'minimal' | 'cozy' | 'modern' | 'maximalist';

const CHAOS_PROMPT =
  'Generate an image of this exact room mid-transformation. Furniture is floating in mid-air, objects are displaced and hovering, everything is in dramatic cinematic disarray as if a wind is sweeping through. Keep the same room dimensions and walls. Clean neutral background, nothing touching the edges. 16:9 ratio, high detail, 2K resolution.';

const finalPrompt = (style: Style) =>
  `Generate an image of this exact room fully redesigned in ${style} style. Clean, intentional, beautifully decorated. Keep the same room dimensions, walls, windows, and doors. Clean neutral background, nothing touching the edges. 16:9 ratio, high detail, 2K resolution.`;

async function generateCandidates(imageBase64: string, prompt: string, count: number): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
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
    if (!res.ok) throw new Error(`Gemini error ${res.status}`);
    const data = await res.json() as { candidates?: { content?: { parts?: { inlineData?: { data: string } }[] } }[] };
    const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (part?.inlineData?.data) results.push(part.inlineData.data);
  }
  return results;
}

function selectBest(candidates: string[]): string {
  if (!candidates.length) throw new Error('No candidates generated');
  return candidates[0];
}

export async function generateFrames(req: Request, res: Response): Promise<void> {
  try {
    const { imageBase64, style } = req.body as { imageBase64: string; style: Style };

    const [chaosCandiates, finalCandidates] = await Promise.all([
      generateCandidates(imageBase64, CHAOS_PROMPT, 4),
      generateCandidates(imageBase64, finalPrompt(style), 4),
    ]);

    res.json({
      chaosFrame: selectBest(chaosCandiates),
      finalFrame: selectBest(finalCandidates),
      description: `Your room has been reimagined in ${style} style — clean, curated, and cinematic.`,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generate-frames]', message);
    res.status(500).json({ error: message });
  }
}
