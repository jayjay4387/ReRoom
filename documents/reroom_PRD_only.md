# ReRoom — Product Requirements Document

> **Revision (2026-05-30):** Updated after a tech-stack audit. Three corrections + one scope
> addition vs. the original draft. See **Key Technical Decisions** below for the *why*.
>
> **Revision (2026-05-31):** The gallery gained a per-device **"My Rooms"** history alongside the
> public community feed — keyed by an **anonymous device ID** (still no auth). Storage stays on
> **Cloudinary**. See **Key Technical Decisions** point 4.

---

## Key Technical Decisions (2026-05-30 revision)

1. **Gemini image model.** We use **Nano Banana 2 (`gemini-3.1-flash-image-preview`)** for image
   generation. **No free tier — billing required day one.** Preview model; have a paid key ready.
2. **Video pipeline is start-frame + end-frame only.** Kling 3.0 (via eachlabs.ai) caps at 2
   keyframes. **Frame 1 (real photo) = start, Frame 3 (final redesign) = end.** The motion prompt
   creates the chaotic mid-transformation between them. The chaos frame (Frame 2) is still generated
   by Gemini and shown in the storyboard strip — it is just not a video keyframe.
3. **Expo API Routes need a running server.** During the hackathon that's the dev machine running
   `npx expo start`; the phone reaches the routes over the LAN. Keep the laptop up and on the same
   network during the demo. (No standalone Expo Go build bakes in the keys.)
4. **NEW — cloud storage + gallery, Community + My Rooms (scope addition, MongoDB showcase).** The
   original draft was session-only. We now persist every redesign to the cloud: **files (3 frames +
   video) → Cloudinary, metadata + URLs → MongoDB Atlas**, surfaced in the gallery —
   a **public community feed** (`/gallery`) every device sees, plus a per-device **"My Rooms"** history
   so each user can look back at their own sets. Identity is an **anonymous device ID** (a UUID kept in
   `AsyncStorage`) — **still no auth/login**; it just tags each redesign with an `ownerId` so "My Rooms"
   can filter. Chosen to qualify for the "best use of MongoDB" prize and for a stronger live demo. Files
   never go in Mongo (no GridFS) — documents in Mongo, blobs in Cloudinary. The final video can also be saved
   to the phone's camera roll. See **Cloud Storage & Gallery** below.

Also bumped: **Expo SDK 51 → 54**; `expo-video`, `expo-image-picker`, `expo-sharing`,
NativeWind v4 are all current.

---

## Product Overview

**Name:** ReRoom
**Tagline:** *Point. Redesign. Watch it happen.*
**Core idea:** User scans their room → Gemini generates a chaos frame and a final redesign frame → the real photo and the final redesign are sent to Kling 3.0 (via eachlabs.ai) as start/end frames → cinematic 7-second transition video of the room transforming. Every redesign is saved to the cloud and shown in the gallery — a public community feed plus the user's own "My Rooms" history.

---

## Core User Flow (MVP)

1. **Scan** — User opens app, taps a button to open the native camera via `expo-image-picker`. Real viewfinder, feels like a proper camera app.
2. **Style Select** — User picks a vibe: Minimal / Cozy / Modern / Maximalist (simple 4-button selector)
3. **Frame Generation (image pipeline via Gemini)** — App sends the original photo + selected style to Gemini (`gemini-3.1-flash-image-preview`, Nano Banana 2). Gemini generates two images:
   - **Frame 2 (Chaos):** The room mid-transformation — furniture floating, objects in dramatic disarray. Shown in the storyboard strip; not a video keyframe.
   - **Frame 3 (Final Redesign):** The fully redesigned room in the selected style. Clean, intentional, complete transformation.
4. **3-frame storyboard** — App now has 3 frames:
   - Frame 1: User's real photo (current room)
   - Frame 2: AI-generated chaos/transition state (storyboard only)
   - Frame 3: AI-generated final redesign
5. **Transition video** — **Frame 1 (start) + Frame 3 (end)** + a motion prompt are sent to Kling 3.0 (via eachlabs.ai). It animates from the real room to the final redesign as a 7-second clip; the motion prompt creates the chaotic mid-transformation between the two keyframes.
6. **Result screen** — Shows the 3 frames as a storyboard strip and the full generated video below it. Save-to-camera-roll + share buttons. The redesign is automatically uploaded to Cloudinary + MongoDB (tagged with the device's `ownerId`) and posted to the gallery.
7. **Gallery** — A public community feed (from MongoDB) of everyone's redesigns, plus a **"My Rooms"** view filtered to this device's own `ownerId`; tap any one to replay its storyboard + video.

---

## Technical Stack

| Layer | Tech |
|---|---|
| Framework | Expo (React Native, **SDK 54**) |
| Routing | Expo Router (file-based, same concept as Next.js App Router) |
| Styling | NativeWind v4 — Tailwind classes compiled to React Native styles; uses the real `tailwindcss` engine via `tailwind.config.js` (vanilla Tailwind CSS is web/DOM-only and can't run in RN) |
| Camera | `expo-image-picker` for native camera viewfinder |
| Room analysis + image generation | Google Gemini **`gemini-3.1-flash-image-preview`** (Nano Banana 2 — native image output, paid/no free tier) |
| Transition video | eachlabs.ai — **Kling 3.0 model, 7 seconds, start frame + end frame** (no multi-shot, no enhance) |
| API layer | Expo API Routes to keep API keys + DB/Cloudinary creds off the client (served by the running dev server) |
| File storage | **Cloudinary** — the 3 frames + 7s video; returns CDN URLs |
| Database / gallery | **MongoDB Atlas** — one document per redesign (ownerId, style, description, Cloudinary URLs, createdAt); powers the community feed + per-device "My Rooms" |
| Identity | **Anonymous device ID** — a UUID in `AsyncStorage` (`expo-crypto`); no login, just tags redesigns so "My Rooms" can filter |
| Save / share | `expo-media-library` (save to camera roll), `expo-sharing` (share sheet) |
| Video playback | `expo-video` |
| Testing on device | Expo Go (scan QR code, instant live reload) — dev server must stay running |
| Deployment | EAS Build (Expo Application Services) |

---

## React Native Quick Reference (for web devs)

| Web | React Native |
|---|---|
| `<div>` | `<View>` |
| `<p>`, `<span>` | `<Text>` |
| `<img>` | `<Image>` |
| `<button>` | `<TouchableOpacity>` or `<Pressable>` |
| CSS files | StyleSheet or NativeWind classes |
| `onClick` | `onPress` |

---

## API Integrations

### 1. Gemini — Frame 2 (Chaos State)
- Model: **`gemini-3.1-flash-image-preview`** (Nano Banana 2)
- Input: base64 original room photo + selected style
- **Output resolution: 2K minimum, 16:9 ratio, neutral background — nothing touching the edges**
- Generate 4 candidate images, select the best one before proceeding — frame quality directly determines video quality
- Prompt: *"Generate an image of this exact room mid-transformation. Furniture is floating in mid-air, objects are displaced and hovering, everything is in dramatic cinematic disarray as if a wind is sweeping through. Keep the same room dimensions and walls. Clean neutral background, nothing touching the edges of the frame. 16:9 ratio, high detail, 2K resolution."*
- Output: Best of 4 generated images of the room in chaos (Frame 2) — used in the storyboard strip (not as a video keyframe)

### 2. Gemini — Frame 3 (Final Redesign)
- Model: **`gemini-3.1-flash-image-preview`** (Nano Banana 2)
- Input: base64 original room photo + selected style
- **Output resolution: 2K minimum, 16:9 ratio, neutral background — nothing touching the edges**
- Generate 4 candidate images, select the best one before proceeding — this is the most important frame, it's what the user sees last
- Prompt: *"Generate an image of this exact room fully redesigned in [STYLE] style. Clean, intentional, beautifully decorated. Keep the same room dimensions, walls, windows, and doors. Clean neutral background, nothing touching the edges. 16:9 ratio, high detail, 2K resolution."*
- Output: Best of 4 generated images of the fully redesigned room (Frame 3)

### Frame Quality Note
The video is only as good as the start and end frames. Invest generation time here — do not skip the 4-iteration selection step. A weak Frame 3 means a weak video regardless of how good the video model (Kling 3.0) is.

### 3. Video API — Kling 3.0 (via eachlabs.ai)
- Model: **Kling 3.0**
- Video length: **7 seconds**
- No multi-shot, no enhance — keep it clean
- **Mode: image-to-video with start + end frame (2 keyframes max).**
- Input: **Frame 1 (real photo) as the start frame, Frame 3 (final redesign) as the end frame.** The chaos frame (Frame 2) is **not** sent — it cannot be a middle keyframe. Verified: Kling 3.0 (and Higgsfield, and Luma) all cap at 2 ordered keyframes; none accept a 3-keyframe sequence.
- Motion prompt: *"Cinematic room transformation. The space dissolves and rebuilds itself — furniture morphs, materials shift, colors bleed into new ones — in a slow, dramatic sweep. Warm golden lighting pulses through the room as it transforms. Smooth camera drift, dust particles floating in the light, satisfying reveal at the end."* — this prompt is what produces the chaotic mid-transition between the two keyframes; tune it aggressively if the output looks too static.
- Output: 7-second MP4 transition video (real room → chaotic motion → final redesign)
- Note: Generation is async — poll for completion every 3 seconds, show a loading state

---

## Cloud Storage & Gallery

No accounts/auth, but redesigns are **persisted to the cloud** (not session-only) so the gallery has
both a shared community feed and a per-device "My Rooms" history. This is also the project's MongoDB showcase.

- **Identity → anonymous device ID.** No login. On first launch the app generates a UUID
  (`expo-crypto`), stores it in `AsyncStorage`, and reuses it as `ownerId` on every save. This is what
  lets a user look back at *their own* redesigns. It is per-device — reinstalling the app resets it.
- **Files → Cloudinary.** The 3 frame images + the 7s video are uploaded to Cloudinary (from a
  server-side API route), which returns CDN URLs that stream straight into `expo-video` / `<Image>`.
  Files are **not** stored in MongoDB.
- **Metadata → MongoDB Atlas.** One document per redesign in a `redesigns` collection:
  `{ _id, ownerId, style, description, frameUrls[3], videoUrl, createdAt }`. Mongo stores *where* the
  files are (Cloudinary URLs), *whose* they are (`ownerId`), and the queryable metadata — the correct split
  (documents in Mongo, blobs in object storage; no GridFS). Index `{ ownerId: 1, createdAt: -1 }`.
- **Community feed.** `GET /api/gallery` shows **everyone's** redesigns, newest first
  (`find().sort({ createdAt: -1 })`). The feed fills up live as people use the app — a strong demo
  and a genuine use of MongoDB. No auth; all redesigns are public.
- **My Rooms.** `GET /api/gallery?owner=<ownerId>` returns just this device's redesigns
  (`find({ ownerId }).sort({ createdAt: -1 })`) — the personal "look back" history.
- **Persistence flow.** On generation-complete the client calls `POST /api/save-redesign` with its
  `ownerId` (frames are already on Cloudinary from generate-frames, so it just re-hosts the video and
  inserts the Mongo document). Non-blocking: if it fails, the user
  still sees their result.
- **Camera roll.** On the result screen the user can also **save the video to the phone's camera
  roll** via `expo-media-library` (asks permission once).
- **On-device cache (optional).** `AsyncStorage` may also cache the current session's result for
  instant replay; it is not the source of truth — the gallery always reads from MongoDB.

---

## Screens

### `/` — Home
- App name + tagline
- Primary CTA button: "Scan Your Room"
- Secondary entry: **"View past rooms"** → `/gallery` (opens the "My Rooms" view; meaningful once this device has at least one redesign)

### `/scan` — Camera
- Tap button triggers `expo-image-picker` with `mediaTypes: Images`, `cameraType: back`
- Gallery upload fallback option
- Preview of captured photo
- "Looks good" confirm button

### `/style` — Style Picker
- 4 style cards: Minimal / Cozy / Modern / Maximalist
- Each has a small icon and one-line description
- Tap to select, then "Redesign" button

### `/generating` — Loading Screen
- 4 step progress indicator:
  - Step 1: "Analyzing your room..." (Gemini reads the photo)
  - Step 2: "Creating the chaos..." (Gemini generates 4x Frame 2 candidates, picks best)
  - Step 3: "Designing your new space..." (Gemini generates 4x Frame 3 candidates, picks best)
  - Step 4: "Rendering your transformation..." (Kling 3.0 animates start → end frame, 7s)
- Estimated wait: ~60-90 seconds total
- Show storyboard frames progressively as each one completes — don't wait for everything

### `/result` — Result Screen
- 3-frame storyboard strip at top: Frame 1 (current) → Frame 2 (chaos) → Frame 3 (redesigned)
- Full 7-second transition video below, autoplaying and looped via `expo-video`
- Short description of the redesign style
- **"Save to Photos"** button via `expo-media-library`
- **"Share"** button via `expo-sharing`
- "Try another room" button → back to `/scan` (the redesign is already saved to the community gallery)

### `/gallery` — Gallery (Community + My Rooms)
- A toggle switches two views from MongoDB, newest first:
  - **Community** (`GET /api/gallery`) — **everyone's** redesigns
  - **My Rooms** (`GET /api/gallery?owner=<ownerId>`) — just this device's own redesigns
- Grid of cards (Cloudinary thumbnail + style + date)
- Tap a redesign → replay its full storyboard strip + video from Cloudinary URLs
- Pull-to-refresh; empty state before any redesigns exist (My Rooms is empty until this device saves one)
- No auth — identity is an anonymous device ID, so "My Rooms" is per-device (resets on reinstall); the community feed is public. No delete in MVP.

---

## Team Split (4 people, 24 hours)

> 2 of the 4 are more technical; they own the API integrations and the shared scaffolds
> (RoomContext shape, MongoDB/Cloudinary layer, device-ID identity, API route contracts) so the other two can build
> screens against typed seams from hour one.

| Person | Responsibility |
|---|---|
| 1 | Camera screen + image picker + `/scan` flow |
| 2 | Home, style picker, result screen, **community gallery screen** UI |
| 3 (technical) | Gemini API integration (Frame 2 + Frame 3 generation, 4-iteration selection) |
| 4 (technical) | Video API (Kling 3.0, 7s) + video playback + **MongoDB + Cloudinary layer** (`save-redesign`, `gallery` routes, device-ID `ownerId` plumbing) |
| Tech lead | Floating — owns shared scaffolds (RoomContext, MongoDB/Cloudinary modules, device-ID identity, API route contracts), unblocks everyone, owns the riskiest path (video generation) |

---

## Environment Variables Needed

```
GEMINI_API_KEY=
EACHLABS_API_KEY=
MONGODB_URI=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Store in `.env` at project root. Access via `process.env.*` in API routes only. The `MONGODB_URI`
and Cloudinary secrets must never reach the client — all DB and upload work happens in `/app/api/`.

---

## Setup Before Hackathon Starts

```bash
npx create-expo-app reroom
cd reroom
npx expo install expo-image-picker expo-video expo-sharing nativewind \
  expo-media-library @react-native-async-storage/async-storage expo-crypto
# server-side deps for the API routes (MongoDB + Cloudinary):
npm install mongodb cloudinary
```

Set up a free **MongoDB Atlas** cluster and a free **Cloudinary** account; put their credentials in
`.env` (see Environment Variables). Everyone installs **Expo Go** on their phones. Run
`npx expo start`, scan the QR code, app is live. **Keep the dev server running** — the API routes
(which talk to Gemini, eachlabs, MongoDB, and Cloudinary) are served by it.

---

## MVP Constraints (24hr scope)

- iOS and Android via Expo Go — no need for a production build during the hackathon
- No user accounts / no auth — but redesigns **are** persisted to the cloud (MongoDB Atlas + Cloudinary) and shown in the gallery: a public community feed + a per-device "My Rooms" history keyed by an anonymous device ID (see Cloud Storage & Gallery)
- No real-time room scanning — a single photo is enough
- If video generation takes >60s, show a "still rendering" state with an animated progress indicator
- Error states: if any API fails, show a friendly message and a retry button. Cloud-save failures are non-blocking — the user still sees their video.

---

## What Success Looks Like at Demo

A judge picks up a phone, opens the app, takes a photo of the room they're standing in, picks "Modern", waits ~60 seconds, and watches a cinematic 7-second video of that exact room transforming in front of their eyes — then saves it to their camera roll and sees it land in the gallery.
yo
That's the demo. Everything else is secondary.
