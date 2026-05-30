# CLAUDE.md — ReRoom

You are building **ReRoom**, a mobile app built with Expo (React Native) that lets users photograph their room and receive a cinematic AI-generated transformation video. This is a 24-hour hackathon MVP. Prioritize working code over perfection.

> **Revision (2026-05-30):** Updated after a tech-stack audit. See **Revision Notes** at the bottom
> for the rationale behind each change (Gemini model, 2-keyframe video pipeline, on-device storage).

---

## Project Context

**What it does:**
1. User takes a photo of their room
2. Gemini (`gemini-3.1-flash-image-preview`, Nano Banana 2) generates two images: a chaos frame (mid-transformation) and a final redesigned room
3. The **real photo (start frame)** and the **final redesign (end frame)** are sent to Higgsfield, which animates the transition into a cinematic video. The motion prompt creates the chaotic mid-transformation between the two frames.
4. User sees the storyboard (all 3 frames) and watches the video
5. The redesign is saved on-device; the user can replay past redesigns from a gallery and save the video to their camera roll

**Stack:**
- Expo **SDK 54/55** with Expo Router (file-based routing)
- NativeWind v4 for styling — you write the exact same Tailwind classes (`className="flex-1 p-4 bg-slate-900"`); NativeWind compiles them to React Native style objects using the real `tailwindcss` engine + `tailwind.config.js`. (Vanilla Tailwind CSS targets the browser/DOM and cannot run in React Native — NativeWind is how Tailwind runs on RN. Most classes work; web-only features like `hover`/CSS grid have RN-specific behavior, but ReRoom's layouts don't need them.)
- `expo-image-picker` for camera
- `expo-video` for video playback
- `expo-sharing` for the share sheet
- `expo-media-library` for saving the video to the camera roll
- `expo-file-system` + `@react-native-async-storage/async-storage` for on-device persistence
- Google Gemini **`gemini-3.1-flash-image-preview`** (Nano Banana 2) for image generation — paid, no free tier; billing must be enabled
- Higgsfield API via eachlabs.ai for video generation (**start frame + end frame**, 2 keyframes)
- API keys live server-side only (in API Routes) — never in client components

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
- All Gemini and Higgsfield calls go through Expo API Routes (`/app/api/`) — never call them directly from components
- The API routes are served by the running dev server (`npx expo start`); the device reaches them over the LAN. Keep the dev server up during the demo.
- Always handle loading, error, and success states explicitly
- Higgsfield is async — implement polling every 3 seconds with a max timeout of 120 seconds
- Log API errors clearly with the endpoint and status code

**State management**
- Use React Context (`RoomContext`) for **ephemeral session state** (current photo, style, generated frames, video URL while a redesign is in flight)
- Use a **separate storage module** (`lib/storage.ts`) for **durable state** (saved redesigns). The context writes through to storage *once* when generation completes — keep the two lifetimes separate.
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
│       └── generate-video+api.ts    # Higgsfield API route
├── components/
│   ├── StoryboardStrip.tsx   # 3-frame preview component
│   ├── ProgressSteps.tsx     # 4-step loading indicator
│   ├── StyleCard.tsx         # Style option card
│   └── GalleryItem.tsx       # Single saved-redesign card
├── context/
│   └── RoomContext.tsx        # Ephemeral session state
├── lib/
│   └── storage.ts             # On-device persistence (file-system + AsyncStorage)
├── constants/
│   └── styles.ts             # Style options config (Minimal/Cozy/Modern/Maximalist)
├── hooks/
│   ├── useHiggsfield.ts      # Polling logic for Higgsfield job status
│   └── useGallery.ts         # Load/refresh the saved-redesigns list
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
  2. "Creating the chaos..."
  3. "Designing your new space..."
  4. "Rendering your transformation..."
- Each step activates as the corresponding API call completes
- Show frame thumbnails as they arrive — don't wait for everything
- On completion: persist the redesign via `lib/storage.ts`, then navigate to `/result`

### `result.tsx` — Result Screen
- StoryboardStrip at top showing all 3 frames with arrows between them
- Video player below (expo-video, autoplay, looped)
- 2-line redesign description from Gemini response
- "Save to Photos" button via `expo-media-library`
- "Share" button via `expo-sharing`
- "Try Another Room" → resets ephemeral context, navigates to `/scan` (saved redesigns remain)

### `gallery.tsx` — Saved Redesigns
- Uses `useGallery()` to load the metadata list from storage
- Grid of `GalleryItem` cards (thumbnail + style + date), newest first
- Tap an item → replay its storyboard strip + video (reuse result-screen components)
- Empty state when nothing saved
- Delete per item (removes files + metadata entry)

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
1. Calls Gemini (`gemini-3.1-flash-image-preview`) with the photo + style to generate Frame 2 (chaos)
2. Calls Gemini (`gemini-3.1-flash-image-preview`) with the photo + style to generate Frame 3 (final redesign)
3. Returns both images as base64

**Response:**
```typescript
{
  chaosFrame: string,    // base64 — storyboard only
  finalFrame: string,    // base64 — also used as the video end frame
  description: string    // short redesign description for result screen
}
```

**Gemini prompts:**

Frame 2 (chaos):
> "Generate an image of this exact room mid-transformation. Furniture is floating in mid-air, objects are displaced and hovering, everything is in dramatic cinematic disarray as if a wind is sweeping through. Keep the same room dimensions and walls."

Frame 3 (final):
> "Generate an image of this exact room fully redesigned in [STYLE] style. Clean, intentional, beautifully decorated. Keep the same room dimensions, walls, windows, and doors."

---

### `POST /api/generate-video`

**Request:**
```typescript
{
  startFrameBase64: string,  // Frame 1 — original room photo
  endFrameBase64: string     // Frame 3 — final redesign
}
```

> The chaos frame (Frame 2) is intentionally NOT sent. Higgsfield (and Kling/Luma) only accept
> 2 ordered keyframes; the chaos is created by the motion prompt between start and end.

**What it does:**
1. Submits the start + end frame to Higgsfield via eachlabs.ai
2. Returns a job ID
3. Client polls `GET /api/generate-video?jobId=xxx` every 3 seconds
4. Returns video URL when complete

**Motion prompt to pass to Higgsfield:**
> "Cinematic room transformation. Objects float and swirl through the air in slow motion, then gracefully settle into a beautiful new arrangement. Warm dramatic lighting, smooth camera drift, satisfying resolution."

**Response (polling):**
```typescript
{
  status: "processing" | "complete" | "error",
  videoUrl?: string
}
```

---

## On-Device Storage (`lib/storage.ts`)

No server database — everything is local to the device.

- **Binaries:** the 3 frame images + the video are written to `FileSystem.documentDirectory`.
  - Gemini frames are base64 → write with `FileSystem.writeAsStringAsync(path, b64, { encoding: 'base64' })`.
  - Higgsfield video is a URL → download with `FileSystem.downloadAsync(url, path)`.
- **Metadata:** a JSON array in `AsyncStorage` under a single key (e.g. `reroom.gallery`):
  ```typescript
  type SavedRedesign = {
    id: string;            // generated locally (e.g. timestamp-based)
    style: "minimal" | "cozy" | "modern" | "maximalist";
    createdAt: string;     // ISO string
    description: string;
    framePaths: [string, string, string];  // [real, chaos, final] file URIs
    videoPath: string;     // local file URI
  };
  ```
- **Suggested surface:**
  ```typescript
  saveRedesign(input): Promise<SavedRedesign>   // writes files + appends metadata
  listRedesigns(): Promise<SavedRedesign[]>     // newest first
  getRedesign(id): Promise<SavedRedesign | null>
  deleteRedesign(id): Promise<void>             // removes files + metadata entry
  ```
- **Camera roll** (separate from gallery): `expo-media-library`
  `MediaLibrary.saveToLibraryAsync(videoPath)` on the result screen, after a permission request.

---

## Environment Variables

```
GEMINI_API_KEY=
EACHLABS_API_KEY=
```

Access via `process.env.GEMINI_API_KEY` in API routes only. Never reference in any component file.

---

## Error Handling

- Every API call must have a try/catch
- On error, set an `error` state and show a retry button — never silently fail
- Higgsfield polling: if no completion after 120 seconds, show "This is taking longer than expected" with a retry option
- If Gemini returns a malformed response, log it and surface a user-friendly message
- Storage writes can fail (disk full, permission) — wrap them in try/catch and don't block the result screen if persistence fails; surface a non-fatal toast/message instead
- `expo-media-library` requires runtime permission — request it on demand and handle denial gracefully

---

## What NOT to Do

- No user authentication
- No server-side database or remote storage — persistence is **on-device only** (`expo-file-system` + `AsyncStorage`)
- No Redux, Zustand, or external state libraries
- No web-only browser APIs (`window.localStorage`, `document`, `window`) — use the Expo storage APIs instead
- No skipping loading states — every async operation needs visual feedback
- No hardcoded API keys anywhere in the codebase
- Don't send the chaos frame to the video API — it is storyboard-only
- Don't over-engineer — this ships in 24 hours

---

## Definition of Done

A judge picks up a phone, opens the app, photographs the room they're standing in, picks a style, waits ~60 seconds, watches a cinematic video of that room transforming, saves it to their camera roll, and sees it appear in the gallery. The app doesn't crash. The video plays. That's done.

---

## Revision Notes (2026-05-30)

1. **Gemini model:** `gemini-2.0-flash` (text-only) → **`gemini-3.1-flash-image-preview`**
   (Nano Banana 2), which natively does image-in + prompt → edited-image-out (up to 4K, strong text
   rendering, up to 14 reference images). **No free tier** (~$0.067/image at 1024px) — enable
   billing before the hackathon. It is a `-preview` model: expect more restrictive rate limits and
   possible behavior changes. (The cheaper stable alternative is `gemini-2.5-flash-image` / Nano
   Banana 1, which has a ~500/day free tier and 1K output — keep it in mind as a fallback if the
   preview model's rate limits bite during team testing.)
2. **Video pipeline:** Verified that Higgsfield, Kling, and Luma all cap at **2 ordered keyframes**
   (start + end). The original "pass all 3 frames as keyframes" approach is not supported by any
   mainstream provider. We now send **start = real photo, end = final redesign**, and let the
   **motion prompt** create the chaos between them. The chaos frame stays as a storyboard artifact.
3. **API routes / Expo Go:** Expo API Routes require a running server. In dev that's the machine
   running `npx expo start`; keep it up and on the same network as the demo phone.
4. **Persistence + gallery (new scope):** Added on-device persistence (`expo-file-system` +
   `AsyncStorage`) and a `/gallery` screen, plus save-to-camera-roll (`expo-media-library`).
   `RoomContext` stays ephemeral; durable state lives in `lib/storage.ts` to keep the live pipeline
   simple.
