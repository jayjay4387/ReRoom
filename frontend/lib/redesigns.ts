import { apiUrl } from './api';
import { getOwnerId } from './identity';

// Shape of a persisted redesign as returned by GET /api/gallery.
export type Redesign = {
  _id: string;
  ownerId: string;
  style: string;
  description: string;
  frameUrls: [string, string, string]; // [original, chaos, final]
  videoUrl: string;
  createdAt: string;
};

// Load the gallery feed, newest first. Omit `owner` for the public community feed;
// pass an ownerId for that device's "My Rooms".
export async function fetchGallery(owner?: string): Promise<Redesign[]> {
  const url = owner ? apiUrl(`/api/gallery?owner=${encodeURIComponent(owner)}`) : apiUrl('/api/gallery');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`gallery ${res.status}`);
  const data = (await res.json()) as { redesigns?: Redesign[] };
  return data.redesigns ?? [];
}

export type SaveRedesignInput = {
  originalUrl: string;
  chaosUrl?: string;
  finalUrl: string;
  videoUrl: string;
  style?: string | null;
  description?: string;
};

// Persist a finished redesign so it shows in the gallery (community feed + this device's
// "My Rooms"). Stamps the request with the anonymous device ownerId. Intended to be called
// fire-and-forget — persistence is non-blocking for the user's result screen.
export async function saveRedesign(input: SaveRedesignInput): Promise<void> {
  const ownerId = await getOwnerId();
  const res = await fetch(apiUrl('/api/save-redesign'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerId, ...input }),
  });
  if (!res.ok) throw new Error(`save-redesign ${res.status}`);
}
