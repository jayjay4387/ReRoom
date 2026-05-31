import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { higgsfield, config as hfConfig } from '@higgsfield/client/v2';
import { videoMotionPrompt } from '../prompts.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

hfConfig({ credentials: process.env.HF_KEY });

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

    const result = await higgsfield.subscribe('/v1/image2video/dop', {
      input: {
        model: 'dop-turbo',
        prompt: videoMotionPrompt,
        enhance_prompt: false,
        input_images: [
          { type: 'image_url', image_url: start.url },
          { type: 'image_url', image_url: end.url },
        ],
        // Extra params passed through to the API — not in TS types but accepted by the endpoint
        duration: 7,
        quality: '1080p',
        sound: false,
      } as any,
      withPolling: true,
    });

    if (!result.video?.url) {
      throw new Error(`Higgsfield completed but returned no video URL (status: ${result.status})`);
    }

    res.json({ videoUrl: result.video.url });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generate-video]', message);
    res.status(500).json({ error: message });
  } finally {
    if (startPublicId) await deleteFrame(startPublicId);
    if (endPublicId) await deleteFrame(endPublicId);
  }
}
