import { Request, Response } from 'express';
import { uploadVideoFromUrl } from '../lib/cloudinary';
import { getDb, Redesign } from '../lib/mongo';

// Persists a completed redesign so it shows up in the gallery (community feed + the
// owner's "My Rooms"). The original/chaos/final frames are already Cloudinary URLs from
// /api/generate-frames, so here we only re-host the temporary Higgsfield video (so it
// doesn't expire) and write the Mongo doc.
export async function saveRedesign(req: Request, res: Response): Promise<void> {
  const { ownerId, style, description, originalUrl, chaosUrl, finalUrl, videoUrl } = req.body as {
    ownerId?: string;
    style?: string;
    description?: string;
    originalUrl?: string;
    chaosUrl?: string;
    finalUrl?: string;
    videoUrl?: string;
  };

  if (!ownerId || !originalUrl || !finalUrl || !videoUrl) {
    res.status(400).json({
      error: 'Missing required fields: ownerId, originalUrl, finalUrl, videoUrl',
    });
    return;
  }

  try {
    console.log('[save-redesign] re-hosting video to Cloudinary...');
    const persistedVideoUrl = await uploadVideoFromUrl(videoUrl);

    const doc: Redesign = {
      ownerId,
      style: style ?? '',
      description: description ?? '',
      frameUrls: [originalUrl, chaosUrl ?? '', finalUrl],
      videoUrl: persistedVideoUrl,
      createdAt: new Date().toISOString(),
    };

    console.log('[save-redesign] inserting Mongo doc...');
    const db = await getDb();
    const { insertedId } = await db.collection<Redesign>('redesigns').insertOne(doc);

    console.log(`[save-redesign] saved _id=${insertedId}`);
    res.json({ ...doc, _id: insertedId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[save-redesign] 500', message);
    res.status(500).json({ error: message });
  }
}
