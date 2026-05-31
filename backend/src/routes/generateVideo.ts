import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { videoMotionPrompt } from '../prompts';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const EACHLABS_ENDPOINT = 'https://api.eachlabs.ai/v1/prediction/';

async function uploadFrame(base64: string): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64}`, {
    folder: 'reroom-frames',
  });
  return { url: result.secure_url, publicId: result.public_id };
}

async function deleteFrame(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId).catch((e) =>
    console.error('[generate-video] cloudinary cleanup failed:', e)
  );
}

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
  const { startFrameBase64, endFrameBase64 } = req.body as {
    startFrameBase64?: string;
    endFrameBase64?: string;
  };

  if (!startFrameBase64 || !endFrameBase64) {
    res.status(400).json({ error: 'Missing required fields: startFrameBase64, endFrameBase64' });
    return;
  }

  let startPublicId: string | null = null;
  let endPublicId: string | null = null;

  try {
    const [start, end] = await Promise.all([
      uploadFrame(startFrameBase64),
      uploadFrame(endFrameBase64),
    ]);
    startPublicId = start.publicId;
    endPublicId = end.publicId;

    const predictionId = await submitJob(start.url, end.url);
    const videoUrl = await pollJob(predictionId);

    res.json({ videoUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generate-video]', message);
    res.status(500).json({ error: message });
  } finally {
    if (startPublicId) await deleteFrame(startPublicId);
    if (endPublicId) await deleteFrame(endPublicId);
  }
}
