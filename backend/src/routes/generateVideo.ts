import { Request, Response } from 'express';
import { videoMotionPrompt } from '../prompts';

const HF_ENDPOINT = 'https://platform.higgsfield.ai/kling-video/v3.0/pro/image-to-video';

function authHeader(): string {
  const cred = process.env.HF_CREDENTIALS;
  if (!cred) throw new Error('HF_CREDENTIALS not set (expected "KEY_ID:KEY_SECRET")');
  return `Key ${cred}`;
}

type SubmitResponse = { status: string; request_id: string; status_url: string };
type StatusResponse = { status: string; error?: string; video?: { url: string } };

// POST /api/generate-video — submit to Higgsfield, return jobId immediately
export async function submitVideo(req: Request, res: Response): Promise<void> {
  const { imageUrl } = req.body as { imageUrl?: string };
  if (!imageUrl) {
    res.status(400).json({ error: 'Missing required field: imageUrl' });
    return;
  }
  try {
    const auth = authHeader();
    console.log('[generate-video] submitting to Higgsfield...');
    const submitRes = await fetch(HF_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, prompt: videoMotionPrompt, duration: 5 }),
    });
    if (!submitRes.ok) {
      const body = await submitRes.text().catch(() => '');
      throw new Error(`Kling submit failed: ${submitRes.status} ${body}`);
    }
    const submitData = (await submitRes.json()) as SubmitResponse;
    const { status_url } = submitData;
    if (!status_url) throw new Error(`higgsfield: no status_url — got: ${JSON.stringify(submitData)}`);
    console.log('[generate-video] submitted, jobId:', status_url);
    res.json({ jobId: status_url });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generate-video] submit error:', message);
    res.status(500).json({ error: message });
  }
}

// GET /api/generate-video?jobId=... — poll status once, return { status, videoUrl? }
export async function pollVideo(req: Request, res: Response): Promise<void> {
  const { jobId } = req.query as { jobId?: string };
  if (!jobId) {
    res.status(400).json({ error: 'Missing query param: jobId' });
    return;
  }
  try {
    const auth = authHeader();
    const stRes = await fetch(jobId, { headers: { Authorization: auth, Accept: 'application/json' } });
    if (!stRes.ok) {
      res.status(502).json({ error: `status check failed: ${stRes.status}` });
      return;
    }
    const data = (await stRes.json()) as StatusResponse;
    console.log('[generate-video] poll:', data.status);
    if (data.status === 'completed') {
      const videoUrl = data.video?.url;
      if (!videoUrl) { res.status(502).json({ error: 'completed but no video.url' }); return; }
      res.json({ status: 'completed', videoUrl });
    } else if (data.status === 'failed') {
      res.status(500).json({ status: 'failed', error: data.error ?? 'unknown' });
    } else {
      res.json({ status: 'pending' });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generate-video] poll error:', message);
    res.status(500).json({ error: message });
  }
}
