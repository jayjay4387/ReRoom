import { Request, Response } from 'express';
import { uploadImageBase64, uploadVideoFromUrl } from '../lib/cloudinary';
import { getDb, Redesign } from '../lib/mongo';

// Persists a completed redesign so it shows up in the gallery (community feed + the
// owner's "My Rooms"). The chaos/final frames are already Cloudinary URLs from
// /api/generate-frames; here we still need to host the original photo and re-host the
// temporary eachlabs video so it doesn't expire.
export async function saveRedesign(req: Request, res: Response): Promise<void> {
  const { ownerId, style, description, originalBase64, chaosUrl, finalUrl, videoUrl } = req.body as {
    ownerId?: string;
    style?: string;
    description?: string;
    originalBase64?: string;
    chaosUrl?: string;
    finalUrl?: string;
    videoUrl?: string;
  };

  if (!ownerId || !originalBase64 || !chaosUrl || !finalUrl || !videoUrl) {
    res.status(400).json({
      error: 'Missing required fields: ownerId, originalBase64, chaosUrl, finalUrl, videoUrl',
    });
    return;
  }

  try {
    const [originalUrl, persistedVideoUrl] = await Promise.all([
      uploadImageBase64(originalBase64, 'reroom/originals'),
      uploadVideoFromUrl(videoUrl),
    ]);

    const doc: Redesign = {
      ownerId,
      style: style ?? '',
      description: description ?? '',
      frameUrls: [originalUrl, chaosUrl, finalUrl],
      videoUrl: persistedVideoUrl,
      createdAt: new Date().toISOString(),
    };

    const db = await getDb();
    const { insertedId } = await db.collection<Redesign>('redesigns').insertOne(doc);

    res.json({ ...doc, _id: insertedId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[save-redesign] 500', message);
    res.status(500).json({ error: message });
  }
}
