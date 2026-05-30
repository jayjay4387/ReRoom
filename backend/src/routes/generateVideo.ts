import { Request, Response } from 'express';

const MOTION_PROMPT =
  'Cinematic room transformation. Objects float and swirl through the air in slow motion, then gracefully settle into a beautiful new arrangement. Warm dramatic lighting, smooth camera drift, satisfying resolution.';

export async function submitVideo(req: Request, res: Response): Promise<void> {
  try {
    const { frame1Base64, frame2Base64, frame3Base64 } = req.body as {
      frame1Base64: string;
      frame2Base64: string;
      frame3Base64: string;
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
        prompt: MOTION_PROMPT,
        keyframes: [
          { image: frame1Base64 },
          { image: frame2Base64 },
          { image: frame3Base64 },
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
