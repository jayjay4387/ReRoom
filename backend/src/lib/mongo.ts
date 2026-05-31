import { MongoClient, Db, ObjectId } from 'mongodb';

export type Redesign = {
  _id?: ObjectId;
  ownerId: string;                       // anonymous device UUID — powers "My Rooms"
  style: string;
  description: string;
  frameUrls: [string, string, string];   // [original, chaos, final] Cloudinary URLs
  videoUrl: string;                       // Cloudinary URL
  createdAt: string;                      // ISO string
};

let db: Db | null = null;

// Cached connection so ts-node-dev hot reloads don't open a new client per request.
export async function getDb(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  const client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'reroom');

  // Serves both queries: community feed (sort by createdAt) and My Rooms (filter ownerId, then sort).
  await db.collection<Redesign>('redesigns').createIndex({ ownerId: 1, createdAt: -1 });

  return db;
}
