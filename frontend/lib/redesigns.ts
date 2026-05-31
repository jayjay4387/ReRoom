import { apiUrl } from './api';
import { getOwnerId } from './identity';

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
