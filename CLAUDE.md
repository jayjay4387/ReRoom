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
description of the committed code.** Large parts of it are unimplemented. `README.md` and the PRD in
`documents/` describe intended scope. When the spec and the code disagree, **the code is the truth.**
Known divergences (likely real bugs / unfinished work — confirm before relying on either side):

1. **Architecture.** The spec describes Expo API Routes (`/app/api/*+api.ts`). The real backend is a
   separate **Express** server in `backend/`. The cloud layer (MongoDB Atlas + **Cloudinary**, not
   GCS) now exists **server-side**: `backend/src/routes/saveRedesign.ts` + `gallery.ts`,
   `backend/src/lib/cloudinary.ts` + `lib/mongo.ts`, plus a frontend `frontend/lib/identity.ts`
   (anonymous device-ID `ownerId`). What's **not** wired yet: the frontend doesn't call any of it —
   `app/(tabs)/gallery.tsx` is a "coming soon" stub, nothing calls `POST /api/save-redesign`, and
   `RoomContext` doesn't hold an `ownerId`.

2. **Gemini model.** Code (`backend/src/routes/generateFrames.ts`) calls `gemini-2.0-flash-exp`.
   The spec/README say `gemini-3.1-flash-image-preview`. They don't match.

3. **Video keyframes.** Both `backend/src/routes/generateVideo.ts` and
   `frontend/app/generating.tsx` send **all 3 frames** (`frame1/frame2/frame3`) to eachlabs. The
   spec insists Kling 3.0 accepts only **2 ordered keyframes** (real photo + final redesign) and that
   the chaos frame must NOT be sent. If the spec is correct, the current 3-keyframe payload is a bug.

4. **Frontend → backend wiring.** The frontend `fetch`es **relative** URLs (`/api/generate-frames`,
   `/api/generate-video`). Those resolve against the Expo dev server, not the Express backend on
   `:3000`, so on a real device these calls reach nothing. There is no base URL/proxy config. This is
   the single biggest blocker to running the app end-to-end.

5. **Frontend scaffolding is missing.** Only source files are committed under `frontend/`
   (`app/`, `components/`, `context/`, `constants/`). There is **no `package.json`, `app.json`,
   `tsconfig.json`, `tailwind.config.js`, `babel.config.js`, `metro.config.js`, or `global.css`.**
   `npx expo start` will not work until these are created.

6. **Env path.** `backend/src/index.ts` loads `dotenv.config({ path: '../../.env' })`, which resolves
   to the *parent of the repo root*, but the README places `.env` at the repo root. Verify this path
   before assuming env vars load.

## Architecture (as actually built)

Flow across the app: `index` → `scan` (capture/pick photo) → `style` (pick one of
minimal/cozy/modern/maximalist) → `generating` (calls the two backend endpoints, polls) → `result`
(storyboard + looping video + share).

- **`frontend/context/RoomContext.tsx`** holds *all* ephemeral session state (photo, style, the two
  generated frames as base64, video URL, description) via a single React Context. No Redux/Zustand.
  State is in-memory only — nothing persists across app restarts.
- **`frontend/app/generating.tsx`** is the orchestrator: POST `/api/generate-frames`, then POST
  `/api/generate-video` to get a `jobId`, then poll GET `/api/generate-video?jobId=…` every 3s with a
  120s timeout. It drives the 4-step `ProgressSteps` indicator and shows frame thumbnails as they arrive.
- **Backend endpoints** (`backend/src/index.ts` wires three handlers):
  - `POST /api/generate-frames` → calls Gemini twice in parallel, generating **4 candidates per frame**
    (chaos + final) and selecting the best. Note: `selectBest` currently just returns
    `candidates[0]` — the "selection" is a placeholder.
  - `POST /api/generate-video` (`submitVideo`) → submits keyframes + motion prompt to
    `eachlabs.ai` (`kling-3.0`, 7s), returns `{ jobId }`.
  - `GET /api/generate-video?jobId=…` (`pollVideo`) → maps eachlabs status to
    `{ status: 'processing' | 'complete' | 'error', videoUrl? }`.
- Images move around as **raw base64 strings** end-to-end (Gemini `inline_data` → JSON response →
  context → `data:image/jpeg;base64,…` URIs in `<Image>`). The request body limit is 20mb for this
  reason.

## Conventions

- TypeScript strict, no `any`. Functional components only.
- React Native primitives only: `<View>`/`<Text>`/`<Pressable>` (never `<div>`/`<p>`/`<button>`),
  all text wrapped in `<Text>`.
- Styling via NativeWind `className="…"` Tailwind classes, not `StyleSheet`.
- All third-party API calls (Gemini, eachlabs) live **server-side in `backend/`**; never call them
  from components, and never put API keys in client code.
- Every async path needs explicit loading/error/success states.

## Secrets

Required env vars live in `.env` (gitignored): `GEMINI_API_KEY`, `EACHLABS_API_KEY`,
`CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` (used by `generate-frames`
and `save-redesign`), and `MONGODB_URI` (used by `save-redesign` + `gallery`; optional `MONGODB_DB`
defaults to `reroom`).

**Never read `.env`** — do not Read, `cat`, or otherwise print its contents. API keys must never
appear in conversation context.
