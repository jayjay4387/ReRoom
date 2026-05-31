import dotenv from 'dotenv';

// Loaded FIRST (before any other import in index.ts) so that modules which read
// process.env at import time — e.g. cloudinary.config() in the route/lib files —
// see the values. Path is relative to cwd (backend/ when running `npm run dev`),
// so ../.env points at the repo root.
dotenv.config({ path: '../.env' });
