# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**ReRoom** — a 24-hour hackathon MVP. A mobile app: photograph a room, pick a style, get a
cinematic AI-generated transformation video. Prioritize working code over perfection; avoid
premature abstraction.

Monorepo with two independently-installed packages:
- `frontend/` — Expo (React Native) app, Expo Router, NativeWind v4 (Tailwind classes via `className`).
- `backend/` — standalone Express + TypeScript API server (port 3000).

## Commands

Backend (`cd backend` first):
- `npm install` — install deps
- `npm run dev` — run with hot reload (`ts-node-dev`)
- `npm run build` — compile TS to `dist/`
- `npm start` — run compiled `dist/index.js`

Frontend: `npm install` then `npx expo start` — **but see the caveat below; the frontend is not
currently runnable as committed.**

There is **no test suite and no linter** configured in either package. Don't claim tests pass.

## ⚠️ Docs vs. reality — read before trusting any spec

`workflows/CLAUDE.md` is an **aspirational design spec written after a "tech-stack audit," not a
description of the committed code.** Parts of it remain aspirational (notably the Expo `/app/api/`
routing — the real backend is Express). `README.md` and the PRD in `documents/` describe intended
scope. When the spec and the code disagree, **the code is the truth.** Known divergences (confirm
before relying on either side):

1. **Routing mechanism.** The spec describes Expo API Routes (`/app/api/*+api.ts`); the real backend
   is a separate **Express** server in `backend/` (Gemini, Higgsfield, Cloudinary, MongoDB). This is the
   main remaining spec-vs-code gap — the cloud layer and frontend wiring below are now built.

2. **Cloud layer + gallery — built.** MongoDB Atlas + **Cloudinary** (not GCS). Server:
   `backend/src/routes/saveRedesign.ts` + `gallery.ts`, `backend/src/lib/cloudinary.ts` + `lib/mongo.ts`.
   Frontend: `lib/api.ts` (base URL), `lib/identity.ts` (anonymous device `ownerId`), `lib/redesigns.ts`
   (`saveRedesign` + `fetchGallery`). `generating.tsx` runs generate-frames → generate-video →
   save-redesign (non-blocking); `app/(tabs)/gallery.tsx` is a real Community / My Rooms feed.

3. **Gemini model — matches.** `generateFrames.ts` uses `gemini-3.1-flash-image-preview`. **But**
   `backend/src/prompts.ts` `chaosPrompt()` is an empty stub and `finalDesignPrompt()` is a static
   string that ignores `answers` — so the questionnaire doesn't yet shape output, and `description`
   comes back empty.

4. **Video — single image (Kling 3.0).** `generateVideo.ts` takes `{ imageUrl }` (the original room
   photo) and calls Higgsfield **Kling 3.0 Pro**; the prompt drives a cluttered→organized transformation.
   It is NOT a start/end interpolation — the Gemini redesign is storyboard-only, not the video's end frame.

5. **Frontend wiring — resolved.** Full Expo scaffolding is committed; the app uses the `(tabs)` layout
   with a floating dock. `lib/api.ts` resolves an absolute backend URL (`EXPO_PUBLIC_API_URL` → Expo
   packager LAN host on `:3000` → localhost), so real-device calls reach Express, not the dev server.

6. **Env path.** `backend/src/index.ts` loads `dotenv.config({ path: '../../.env' })`, which resolves
   to the *parent of the repo root*, but the README places `.env` at the repo root. Verify this path
   before assuming env vars load.

## Architecture (as actually built)

Flow across the app: `index` → `scan` (capture/pick photo) → `style` (pick one of
minimal/cozy/modern/maximalist) → `generating` (calls the backend, polls, saves) → `result`
(storyboard + looping video + share). A `(tabs)` layout (Home · Gallery) wraps the flow.

- **`frontend/context/RoomContext.tsx`** holds *all* ephemeral session state (photo, style, the
  generated frame **URLs**, `originalUrl`, video URL, description) via a single React Context. No
  Redux/Zustand. State is in-memory only — nothing persists across app restarts.
- **`frontend/app/generating.tsx`** is the orchestrator: POST `/api/generate-frames`, then POST
  `/api/generate-video` to get a `jobId`, then poll GET `/api/generate-video?jobId=…` every 3s with a
  120s timeout; on completion it fires `POST /api/save-redesign` (non-blocking) and navigates to
  `/result`. All calls go through `apiUrl()` (`lib/api.ts`).
- **Backend endpoints** (`backend/src/index.ts` wires four handlers):
  - `POST /api/generate-frames` → Gemini ×4 per frame (chaos + final), uploads candidates **and the
    original photo** to Cloudinary, returns `{ originalUrl, chaosFrameCandidates[], finalFrameCandidates[],
    description }`. No server-side best-of-4 — the client takes `[0]`.
  - `POST /api/generate-video` (`generateVideo`) → calls **Higgsfield Kling 3.0 Pro** REST
    (`platform.higgsfield.ai/kling-video/v3.0/pro/image-to-video`, auth `Key ID:SECRET`) with the
    **original room photo** as `image_url` + a transformation prompt + `duration: 7`. **Blocks**:
    submits, polls the returned `status_url` until `completed`, returns `{ videoUrl }` (from `video.url`).
  - `POST /api/save-redesign` → re-hosts the Higgsfield video to Cloudinary, inserts the Mongo
    `redesigns` doc (tagged with `ownerId`); frames are already Cloudinary URLs.
  - `GET /api/gallery?owner=&limit=` → redesigns newest-first; `owner` → My Rooms, omit → community feed.
- **The original photo travels as base64** (device → `generate-frames`, 20mb body limit); everything
  downstream (frames, video) moves as **Cloudinary URLs**.

## Conventions

- TypeScript strict, no `any`. Functional components only.
- React Native primitives only: `<View>`/`<Text>`/`<Pressable>` (never `<div>`/`<p>`/`<button>`),
  all text wrapped in `<Text>`.
- Styling via NativeWind `className="…"` Tailwind classes, not `StyleSheet`.
- All third-party API calls (Gemini, Higgsfield, Cloudinary, MongoDB) live **server-side in `backend/`**;
  never call them from components, and never put API keys in client code.
- Every async path needs explicit loading/error/success states.

## Secrets

Required env vars live in `.env` (gitignored): `GEMINI_API_KEY`, `HF_CREDENTIALS`
(`KEY_ID:KEY_SECRET` for Higgsfield, used by `generate-video`),
`CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` (used by `generate-frames`
and `save-redesign`), and `MONGODB_URI` (used by `save-redesign` + `gallery`; optional `MONGODB_DB`
defaults to `reroom`).

**Never read `.env`** — do not Read, `cat`, or otherwise print its contents. API keys must never
appear in conversation context.
