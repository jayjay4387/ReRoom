import { Request, Response } from 'express';
import { getDb, Redesign } from '../lib/mongo';

// Gallery feed, newest first. Omit `owner` for the public community feed; pass it
// to get just that device's redesigns ("My Rooms").
export async function getGallery(req: Request, res: Response): Promise<void> {
  try {
    const owner = typeof req.query.owner === 'string' ? req.query.owner : undefined;
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    const filter = owner ? { ownerId: owner } : {};

    const db = await getDb();
    const redesigns = await db
      .collection<Redesign>('redesigns')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    res.json({ redesigns });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[gallery] 500', message);
    res.status(500).json({ error: message });
  }
}
