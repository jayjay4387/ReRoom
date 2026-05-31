import { Request, Response } from 'express';
import { videoMotionPrompt } from '../prompts';

export async function submitVideo(req: Request, res: Response): Promise<void> {
  try {
    const { startFrameBase64, endFrameBase64 } = req.body as {
      startFrameBase64: string;
      endFrameBase64: string;
    };

    const apiKey = process.env.EACHLABS_API_KEY;
    const result = await fetch('https://api.eachlabs.ai/v1/flow/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey ?? '',
      },
      body: JSON.stringify({
        model: 'kling-3.0',
        duration: 7,
        multi_shot: false,
        enhance: false,
        prompt: videoMotionPrompt,
        keyframes: [
          { image: startFrameBase64 },
          { image: endFrameBase64 },
        ],
      }),
    });

    if (!result.ok) throw new Error(`eachlabs ${result.status}`);
    const { id: jobId } = await result.json() as { id: string };
    res.json({ jobId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generate-video POST]', message);
    res.status(500).json({ error: message });
  }
}

export async function pollVideo(req: Request, res: Response): Promise<void> {
  try {
    const { jobId } = req.query as { jobId: string };
    if (!jobId) { res.status(400).json({ error: 'missing jobId' }); return; }

    const apiKey = process.env.EACHLABS_API_KEY;
    const result = await fetch(`https://api.eachlabs.ai/v1/flow/${jobId}`, {
      headers: { 'X-API-Key': apiKey ?? '' },
    });
    if (!result.ok) throw new Error(`eachlabs ${result.status}`);

    const data = await result.json() as { status: string; output?: { url: string } };

    if (data.status === 'completed') {
      res.json({ status: 'complete', videoUrl: data.output?.url });
    } else if (data.status === 'failed') {
      res.json({ status: 'error' });
    } else {
      res.json({ status: 'processing' });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generate-video GET]', message);
    res.status(500).json({ error: message });
  }
}
