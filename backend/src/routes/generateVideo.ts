import { Request, Response } from 'express';
import { videoMotionPrompt } from '../prompts';

const EACHLABS_ENDPOINT = 'https://api.eachlabs.ai/v1/prediction/';

async function submitJob(startUrl: string, endUrl: string): Promise<string> {
  const res = await fetch(EACHLABS_ENDPOINT, {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.EACHLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'kling-3.0',
      parameters: {
        prompt: videoMotionPrompt,
        duration: 7,
        mode: 'RESOLUTION_1080',
        motion_has_audio: false,
        enhance: false,
        guidances: {
          start_frame: [{ image: { url: startUrl, type: 'first_frame' } }],
          end_frame:   [{ image: { url: endUrl,   type: 'end_frame'   } }],
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Kling submit failed: ${res.status}`);
  const data = await res.json() as { id: string };
  if (!data.id) throw new Error('Kling: no prediction id returned');
  return data.id;
}

async function pollJob(predictionId: string, attempts = 0): Promise<string> {
  if (attempts > 40) throw new Error('Kling timed out after 120 seconds');
  const res = await fetch(`${EACHLABS_ENDPOINT}${predictionId}`, {
    headers: { 'X-API-Key': process.env.EACHLABS_API_KEY! },
  });
  if (!res.ok) throw new Error(`Kling poll failed: ${res.status}`);
  const data = await res.json() as { status: string; output?: string; error?: string };
  if (data.status === 'succeeded') {
    if (!data.output) throw new Error('Kling succeeded but returned no output URL');
    return data.output;
  }
  if (data.status === 'failed') throw new Error(`Kling generation failed: ${data.error ?? 'unknown'}`);
  await new Promise((r) => setTimeout(r, 3000));
  return pollJob(predictionId, attempts + 1);
}

export async function generateVideo(req: Request, res: Response): Promise<void> {
  const { startFrameUrl, endFrameUrl } = req.body as {
    startFrameUrl?: string;
    endFrameUrl?: string;
  };

  if (!startFrameUrl || !endFrameUrl) {
    res.status(400).json({ error: 'Missing required fields: startFrameUrl, endFrameUrl' });
    return;
  }

  try {
    const predictionId = await submitJob(startFrameUrl, endFrameUrl);
    const videoUrl = await pollJob(predictionId);
    res.json({ videoUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generate-video]', message);
    res.status(500).json({ error: message });
  }
}
