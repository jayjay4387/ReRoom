import { Request, Response } from 'express';
import { HiggsfieldClient, InputImage, inputMotion } from '@higgsfield/client';
import { videoMotionPrompt } from '../prompts';

// HF_CREDENTIALS is "KEY_ID:KEY_SECRET" (from cloud.higgsfield.ai). The v1 client
// wants them split into apiKey + apiSecret.
let client: HiggsfieldClient | null = null;
function getClient(): HiggsfieldClient {
  if (client) return client;
  const [apiKey, apiSecret] = (process.env.HF_CREDENTIALS ?? '').split(':');
  if (!apiKey || !apiSecret) {
    throw new Error('HF_CREDENTIALS not set (expected "KEY_ID:KEY_SECRET")');
  }
  // Video generation is slow — give the SDK's internal polling room.
  client = new HiggsfieldClient({ apiKey, apiSecret, pollInterval: 3000, maxPollTime: 180_000 });
  return client;
}

// The start→end transition is driven by a Higgsfield motion preset flagged
// start_end_frame. Look it up once and cache the id.
let startEndMotionId: string | null = null;
async function getStartEndMotionId(c: HiggsfieldClient): Promise<string> {
  if (startEndMotionId) return startEndMotionId;
  const motions = await c.getMotions();
  const motion = motions.find((m) => m.start_end_frame) ?? motions[0];
  if (!motion) throw new Error('No Higgsfield motions available');
  startEndMotionId = motion.id;
  return motion.id;
}

// Generates the transition video on Higgsfield (DoP image2video) from the start frame
// (original room) to the end frame (final redesign) via a start/end-frame motion preset.
// Blocks until the video is ready (the SDK polls internally), then returns its URL.
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
    const c = getClient();
    const motionId = await getStartEndMotionId(c);

    const jobSet = await c.generate(
      '/v1/image2video/dop',
      {
        model: 'dop-turbo',
        prompt: videoMotionPrompt,
        input_images: [InputImage.fromUrl(startFrameUrl), InputImage.fromUrl(endFrameUrl)],
        motions: [inputMotion(motionId, 1.0)],
      },
      { withPolling: true }
    );

    if (!jobSet.isCompleted) {
      throw new Error(`video job not completed (status: ${jobSet.jobs[0]?.status ?? 'unknown'})`);
    }
    const videoUrl = jobSet.jobs[0]?.results?.raw.url;
    if (!videoUrl) throw new Error('completed job returned no video URL');

    res.json({ videoUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generate-video]', message);
    res.status(500).json({ error: message });
  }
}
