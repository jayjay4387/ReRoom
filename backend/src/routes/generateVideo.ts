import { Request, Response } from 'express';
import { videoMotionPrompt } from '../prompts';

// Higgsfield Kling 3.0 Pro, image-to-video. Single input image (the original room photo);
// the motion prompt drives the cluttered -> organized transformation. Async: submit returns
// a status_url to poll; the finished MP4 is at video.url on completion.
const HF_ENDPOINT = 'https://platform.higgsfield.ai/kling-video/v3.0/pro/image-to-video';

function authHeader(): string {
  const cred = process.env.HF_CREDENTIALS;
  if (!cred) throw new Error('HF_CREDENTIALS not set (expected "KEY_ID:KEY_SECRET")');
  return `Key ${cred}`;
}

type SubmitResponse = { status: string; request_id: string; status_url: string };
type StatusResponse = { status: string; error?: string; video?: { url: string } };

export async function generateVideo(req: Request, res: Response): Promise<void> {
  const { imageUrl } = req.body as { imageUrl?: string };
  if (!imageUrl) {
    res.status(400).json({ error: 'Missing required field: imageUrl' });
    return;
  }

  try {
    const auth = authHeader();
    console.log('[generate-video] submitting to Higgsfield (Kling 3.0)...');

    const submitRes = await fetch(HF_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, prompt: videoMotionPrompt, duration: 7 }),
    });
    if (!submitRes.ok) throw new Error(`higgsfield submit ${submitRes.status}`);
    const { status_url, request_id } = (await submitRes.json()) as SubmitResponse;
    if (!status_url) throw new Error('higgsfield: no status_url returned');
    console.log(`[generate-video] queued (request_id=${request_id}); polling — renders take ~1-3 min...`);

    const started = Date.now();
    const deadline = started + 300_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 5000));
      const stRes = await fetch(status_url, { headers: { Authorization: auth, Accept: 'application/json' } });
      if (!stRes.ok) {
        console.log(`[generate-video] status check HTTP ${stRes.status}, retrying...`);
        continue;
      }
      const data = (await stRes.json()) as StatusResponse;
      const elapsed = Math.round((Date.now() - started) / 1000);
      console.log(`[generate-video] ${elapsed}s — ${data.status}`);
      if (data.status === 'completed') {
        const videoUrl = data.video?.url;
        if (!videoUrl) throw new Error('higgsfield: completed but no video.url');
        console.log(`[generate-video] done in ${elapsed}s -> ${videoUrl}`);
        res.json({ videoUrl });
        return;
      }
      if (data.status === 'failed') {
        throw new Error(`higgsfield render failed: ${data.error ?? 'unknown'}`);
      }
    }
    throw new Error('higgsfield render timed out after 5 minutes');
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generate-video]', message);
    res.status(500).json({ error: message });
  }
}
