# CLAUDE.md — ReRoom

You are building **ReRoom**, a mobile app built with Expo (React Native) that lets users photograph their room and receive a cinematic AI-generated transformation video. This is a 24-hour hackathon MVP. Prioritize working code over perfection.

> **Revision (2026-05-30):** Updated after a tech-stack audit. See **Revision Notes** at the bottom
> for the rationale behind each change (Gemini model, 2-keyframe video pipeline, MongoDB + Cloudinary
> cloud storage with a public community gallery).

---

## Project Context

**What it does:**
1. User takes a photo of their room
2. Gemini (`gemini-3.1-flash-image-preview`, Nano Banana 2) generates two images: a chaos frame (mid-transformation) and a final redesigned room — **4 candidates each, best one selected** (2K, 16:9, neutral background)
3. The **real photo (start frame)** and the **final redesign (end frame)** are sent to Kling 3.0 (via eachlabs.ai), which animates the transition into a 7-second cinematic video. The motion prompt creates the chaotic mid-transformation between the two frames.
4. User sees the storyboard (all 3 frames) and watches the video
5. The redesign is uploaded to the cloud — **files (3 frames + video) → Cloudinary, metadata + URLs → MongoDB Atlas** — and appears in a **public community gallery** that every device sees. The user can also save the video to their camera roll.

**Stack:**
- Expo **SDK 54/55** with Expo Router (file-based routing)
- NativeWind v4 for styling — you write the exact same Tailwind classes (`className="flex-1 p-4 bg-slate-900"`); NativeWind compiles them to React Native style objects using the real `tailwindcss` engine + `tailwind.config.js`. (Vanilla Tailwind CSS targets the browser/DOM and cannot run in React Native — NativeWind is how Tailwind runs on RN. Most classes work; web-only features like `hover`/CSS grid have RN-specific behavior, but ReRoom's layouts don't need them.)
- `expo-image-picker` for camera
- `expo-video` for video playback
- `expo-sharing` for the share sheet
- `expo-media-library` for saving the video to the camera roll
- **MongoDB Atlas** for the gallery backbone — one document per redesign (style, description, Cloudinary URLs, createdAt). Accessed **only** from API routes via the `mongodb` Node driver.
- **Cloudinary** for file storage — the 3 frames + the 7s video. Uploaded **only** from API routes via the `cloudinary` Node SDK; returns CDN URLs stored in the Mongo document.
- `@react-native-async-storage/async-storage` (optional) — lightweight on-device cache of the current session result for instant replay; not the source of truth
- Google Gemini **`gemini-3.1-flash-image-preview`** (Nano Banana 2) for image generation — paid, no free tier; billing must be enabled. Generate **4 candidates per frame, pick best** (2K, 16:9, neutral background)
- Video generation via eachlabs.ai — **Kling 3.0 model, 7 seconds, start frame + end frame, no multi-shot, no enhance**
- API keys + DB/Cloudinary credentials live server-side only (in API Routes) — never in client components

---

## Code Rules

**General**
- TypeScript everywhere, no `any` types
- Functional components only, no class components
- Keep components small and single-purpose
- Co-locate types with the file that uses them unless shared across 3+ files
- No premature abstraction — duplicate code is fine for a hackathon, over-engineering is not

**React Native specific**
- Use `<View>` not `<div>`, `<Text>` not `<p>`, `<Pressable>` not `<button>`
- All text must be wrapped in `<Text>` — never raw strings in JSX
- Use NativeWind classes for styling, avoid inline StyleSheet unless NativeWind can't handle it
- Handle both iOS and Android — don't assume one platform

**API calls**
- All Gemini, video (Kling/eachlabs), MongoDB, and Cloudinary calls go through Expo API Routes (`/app/api/`) — never call them directly from components
- The API routes are served by the running dev server (`npx expo start`); the device reaches them over the LAN. Keep the dev server up during the demo.
- Always handle loading, error, and success states explicitly
- Video generation is async — implement polling every 3 seconds with a max timeout of 120 seconds
- Log API errors clearly with the endpoint and status code

**State management**
- Use React Context (`RoomContext`) for **ephemeral session state** (current photo, style, generated frames, video URL while a redesign is in flight)
- **Durable state lives in the cloud** (MongoDB + Cloudinary), reached through API routes. When generation completes, the client calls `POST /api/save-redesign` once; the gallery reads from `GET /api/gallery`. The client never holds DB/Cloudinary credentials.
- Keep it simple — no Redux, no Zustand, no external state library

---

## File Structure

```
reroom/
├── app/
│   ├── index.tsx          # Home screen (CTA + "View past rooms")
│   ├── scan.tsx           # Camera screen
│   ├── style.tsx          # Style picker screen
│   ├── generating.tsx     # Loading/progress screen
│   ├── result.tsx         # Result screen with video + save/share
│   ├── gallery.tsx        # Saved redesigns grid + replay
│   └── api/
│       ├── generate-frames+api.ts   # Gemini API route
│       ├── generate-video+api.ts    # Kling 3.0 (eachlabs) API route
│       ├── save-redesign+api.ts     # Upload files to Cloudinary + insert Mongo doc
│       └── gallery+api.ts           # GET community feed from Mongo (newest first)
├── components/
│   ├── StoryboardStrip.tsx   # 3-frame preview component
│   ├── ProgressSteps.tsx     # 4-step loading indicator
│   ├── StyleCard.tsx         # Style option card
│   └── GalleryItem.tsx       # Single community-feed card
├── context/
│   └── RoomContext.tsx        # Ephemeral session state
├── lib/
│   ├── mongo.ts               # MongoDB Atlas client + helpers (server/API-route only)
│   └── cloudinary.ts          # Cloudinary upload helpers (server/API-route only)
├── constants/
│   └── styles.ts             # Style options config (Minimal/Cozy/Modern/Maximalist)
├── hooks/
│   ├── useVideoJob.ts        # Polling logic for the Kling/eachlabs video job status
│   └── useGallery.ts         # Fetches GET /api/gallery (community feed)
└── .env
```

---

## Screens & What They Do

### `index.tsx` — Home
- Full screen centered layout
- App name "ReRoom" + tagline "Point. Redesign. Watch it happen."
- Primary CTA: "Scan Your Room" → navigates to `/scan`
- Secondary link: "View past rooms" → navigates to `/gallery`

### `scan.tsx` — Camera
- Button triggers `expo-image-picker` with `mediaTypes: Images`, `cameraType: back`
- Secondary option: pick from gallery
- Shows preview of captured photo
- "Looks good" → saves to context, navigates to `/style`

### `style.tsx` — Style Picker
- 4 style cards: Minimal / Cozy / Modern / Maximalist
- Each has an icon and one-line description
- Tap selects it (highlighted state), "Redesign" button → navigates to `/generating`

### `generating.tsx` — Loading Screen
- Calls `/api/generate-frames` on mount (passes base64 photo + style)
- Then calls `/api/generate-video` with the **start frame (real photo) + end frame (final redesign)**
- Shows 4-step progress:
  1. "Analyzing your room..."
  2. "Creating the chaos..." (4 candidates generated, best selected)
  3. "Designing your new space..." (4 candidates generated, best selected)
  4. "Rendering your transformation..." (Kling 3.0, 7s)
- Each step activates as the corresponding API call completes
- Show frame thumbnails as they arrive — don't wait for everything
- On completion: call `POST /api/save-redesign` (uploads the 3 frames + video to Cloudinary, inserts the Mongo document), then navigate to `/result`. If the save call fails, still go to `/result` — persistence is non-blocking for the demo.

### `result.tsx` — Result Screen
- StoryboardStrip at top showing all 3 frames with arrows between them
- 7-second video player below (expo-video, autoplay, looped)
- 2-line redesign description from Gemini response
- "Save to Photos" button via `expo-media-library`
- "Share" button via `expo-sharing`
- "Try Another Room" → resets ephemeral context, navigates to `/scan` (the saved redesign is already in the community gallery)

### `gallery.tsx` — Community Gallery (public feed)
- Uses `useGallery()` → `GET /api/gallery` to load **everyone's** redesigns from MongoDB, newest first
- Grid of `GalleryItem` cards (Cloudinary thumbnail + style + date)
- Tap an item → replay its storyboard strip + video from Cloudinary URLs (reuse result-screen components)
- Pull-to-refresh; empty state before any redesigns exist
- No auth — the feed is public. No delete in MVP (anyone could delete anyone's; out of scope for 24h)

---

## API Routes

### `POST /api/generate-frames`

**Request:**
```typescript
{
  imageBase64: string,  // base64 encoded room photo
  style: "minimal" | "cozy" | "modern" | "maximalist"
}
```

**What it does:**
1. Calls Gemini (`gemini-3.1-flash-image-preview`) to generate **4 candidate images** for Frame 2 (chaos), selects best
2. Calls Gemini (`gemini-3.1-flash-image-preview`) to generate **4 candidate images** for Frame 3 (final redesign), selects best
3. Returns both selected images as base64

**Critical image generation requirements:**
- **Minimum 2K resolution**
- **16:9 ratio**
- **Neutral background, nothing touching the edges of the frame**
- The video is only as good as the frames — do not skip the 4-iteration selection step

**Response:**
```typescript
{
  chaosFrame: string,    // base64, best of 4 candidates — storyboard only
  finalFrame: string,    // base64, best of 4 candidates — also used as the video end frame
  description: string    // short redesign description for result screen
}
```

**Gemini prompts:**

Frame 2 (chaos):
> "Generate an image of this exact room mid-transformation. Furniture is floating in mid-air, objects are displaced and hovering, everything is in dramatic cinematic disarray as if a wind is sweeping through. Keep the same room dimensions and walls. Clean neutral background, nothing touching the edges. 16:9 ratio, high detail, 2K resolution."

Frame 3 (final):
> "Generate an image of this exact room fully redesigned in [STYLE] style. Clean, intentional, beautifully decorated. Keep the same room dimensions, walls, windows, and doors. Clean neutral background, nothing touching the edges. 16:9 ratio, high detail, 2K resolution."

---

### `POST /api/generate-video`

**Request:**
```typescript
{
  startFrameBase64: string,  // Frame 1 — original room photo
  endFrameBase64: string     // Frame 3 — final redesign (best of 4 candidates)
}
```

> The chaos frame (Frame 2) is intentionally NOT sent. Kling 3.0 (and Higgsfield/Luma) only accept
> 2 ordered keyframes; the chaos is created by the motion prompt between start and end.

**What it does:**
1. Submits the start + end frame to eachlabs.ai
2. Model: **Kling 3.0** — do not use any other model
3. Duration: **7 seconds**
4. No multi-shot, no enhance — keep settings clean
5. Returns a job ID
6. Client polls `GET /api/generate-video?jobId=xxx` every 3 seconds
7. Returns video URL when complete

**Motion prompt to pass to the video model:**
> "Cinematic room transformation. Objects float and swirl through the air in slow motion, then gracefully settle into a beautiful new arrangement. Warm dramatic lighting, smooth camera drift, satisfying resolution."

**Response (polling):**
```typescript
{
  status: "processing" | "complete" | "error",
  videoUrl?: string
}
```

---

### `POST /api/save-redesign`

Persists a completed redesign to the cloud. Called once from `/generating` on completion.

**Request:**
```typescript
{
  style: "minimal" | "cozy" | "modern" | "maximalist",
  description: string,
  originalBase64: string,   // Frame 1 (real photo)
  chaosBase64: string,      // Frame 2 (chaos)
  finalBase64: string,      // Frame 3 (final redesign)
  videoUrl: string          // the eachlabs/Kling video URL from generate-video
}
```

**What it does (server-side only — holds Cloudinary + Mongo creds):**
1. Uploads the 3 frames (base64) to Cloudinary → 3 CDN image URLs
2. Uploads the video to Cloudinary by passing `videoUrl` to Cloudinary's remote-fetch upload → 1 CDN video URL (so it outlives the temporary eachlabs URL)
3. Inserts one document into MongoDB Atlas (see schema below)
4. Returns the saved document

**Response:** the saved `Redesign` document (see schema in **Cloud Storage** below).

---

### `GET /api/gallery`

Returns the **public community feed** — all redesigns, newest first.

**Query:** `?limit=30&before=<ISO date>` (simple pagination; optional for MVP)

**What it does:** `db.collection('redesigns').find().sort({ createdAt: -1 }).limit(limit)`

**Response:**
```typescript
{ redesigns: Redesign[] }
```

---

## Cloud Storage & Community Gallery

No accounts/auth, but **not** session-only — redesigns are persisted to the cloud so every device sees a shared community feed. This is also the project's MongoDB showcase.

- **Files → Cloudinary.** The 3 frames + the 7s video. Uploaded only from API routes (`lib/cloudinary.ts`); Cloudinary returns CDN URLs that stream directly into `expo-video` / `<Image>`. Files do **not** go into MongoDB.
- **Metadata → MongoDB Atlas.** One document per redesign in a `redesigns` collection (`lib/mongo.ts`, API-route only):
  ```typescript
  type Redesign = {
    _id: ObjectId;
    style: "minimal" | "cozy" | "modern" | "maximalist";
    description: string;
    frameUrls: [string, string, string];  // [real, chaos, final] Cloudinary URLs
    videoUrl: string;                      // Cloudinary URL
    createdAt: string;                     // ISO string
  };
  ```
- **On-device cache (optional):** `AsyncStorage` may hold the current session's result for instant `/result` replay. Not the source of truth — the gallery always reads from Mongo.
- **Camera roll** (separate from the feed): `expo-media-library`
  `MediaLibrary.saveToLibraryAsync(localVideoUri)` on the result screen, after a permission request. (Download the Cloudinary/eachlabs video to a temp file first if needed.)

---

## Environment Variables

```
GEMINI_API_KEY=
EACHLABS_API_KEY=
MONGODB_URI=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Access via `process.env.*` in API routes only. Never reference in any component file. The
`MONGODB_URI` and Cloudinary secrets must never reach the client — all DB/upload work happens in
`/app/api/` routes.

---

## Error Handling

- Every API call must have a try/catch
- On error, set an `error` state and show a retry button — never silently fail
- Video polling: if no completion after 120 seconds, show "This is taking longer than expected" with a retry option
- If Gemini returns a malformed response, log it and surface a user-friendly message
- Cloud persistence can fail (Cloudinary/Mongo down, no network) — wrap `save-redesign` in try/catch and **don't block** the result screen; the user still sees their video. Surface a non-fatal "couldn't save to gallery" message.
- The gallery feed can fail to load — show a retry + empty state, never a crash.
- `expo-media-library` requires runtime permission — request it on demand and handle denial gracefully

---

## What NOT to Do

- No user authentication — the community feed is public; anyone's redesign is visible to everyone
- No files in MongoDB — binaries go to **Cloudinary**; Mongo stores metadata + URLs only (no GridFS)
- No DB/Cloudinary credentials in client code — all of it lives in `/app/api/` routes
- No Redux, Zustand, or external state libraries
- No web-only browser APIs (`window.localStorage`, `document`, `window`)
- No skipping loading states — every async operation needs visual feedback
- No hardcoded API keys anywhere in the codebase
- Don't send the chaos frame to the video API — it is storyboard-only
- Don't over-engineer — this ships in 24 hours
- Don't use any video model other than Kling 3.0 (via eachlabs)
- Don't skip the 4-iteration frame selection — it directly affects video quality

---

## Definition of Done

A judge picks up a phone, opens the app, photographs the room they're standing in, picks a style, waits ~60 seconds, watches a cinematic 7-second video of that room transforming, saves it to their camera roll, and sees it appear in the gallery. The app doesn't crash. The video plays. That's done.

---

## Revision Notes (2026-05-30)

1. **Gemini model:** `gemini-2.0-flash` (text-only) → **`gemini-3.1-flash-image-preview`**
   (Nano Banana 2), which natively does image-in + prompt → edited-image-out (up to 4K, strong text
   rendering, up to 14 reference images). **No free tier** (~$0.067/image at 1024px) — enable
   billing before the hackathon. It is a `-preview` model: expect more restrictive rate limits and
   possible behavior changes. (The cheaper stable alternative is `gemini-2.5-flash-image` / Nano
   Banana 1, which has a ~500/day free tier and 1K output — keep it in mind as a fallback if the
   preview model's rate limits bite during team testing.)
2. **Video pipeline:** Chosen model is **Kling 3.0 via eachlabs.ai (7-second clip)**. Verified that
   Kling, Higgsfield, and Luma all cap at **2 ordered keyframes** (start + end). The original "pass
   all 3 frames as keyframes" approach is not supported by any mainstream provider. We now send
   **start = real photo, end = final redesign**, and let the **motion prompt** create the chaos
   between them. The chaos frame stays as a storyboard artifact. Frames are generated 4-candidates-
   pick-best at 2K / 16:9 / neutral background (from PR #4) since video quality follows frame quality.
3. **API routes / Expo Go:** Expo API Routes require a running server. In dev that's the machine
   running `npx expo start`; keep it up and on the same network as the demo phone.
4. **Cloud storage + community gallery (new scope, MongoDB showcase):** Redesigns persist to the
   cloud — **files → Cloudinary, metadata + URLs → MongoDB Atlas** — and surface in a **public
   community feed** (`/gallery`) that every device sees. Chosen over on-device storage to qualify
   for the "best use of MongoDB" prize and to make a stronger live demo (the feed fills up as people
   test). No auth. Files never go in Mongo (no GridFS) — Mongo holds queryable documents, Cloudinary
   holds blobs, which is the correct split. `RoomContext` stays ephemeral; all DB/upload work runs
   in `/app/api/` routes (`save-redesign`, `gallery`) so credentials never reach the client.
   `expo-media-library` still handles save-to-camera-roll.
