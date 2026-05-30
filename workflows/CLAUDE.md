# CLAUDE.md — ReRoom

You are building **ReRoom**, a mobile app built with Expo (React Native) that lets users photograph their room and receive a cinematic AI-generated transformation video. This is a 24-hour hackathon MVP. Prioritize working code over perfection.

---

## Project Context

**What it does:**
1. User takes a photo of their room
2. Gemini generates two images: a chaos frame (mid-transformation) and a final redesigned room — 4 candidates each, best one selected
3. All 3 frames are passed to Higgsfield which animates them into a 7-second cinematic transition video
4. User sees the storyboard and watches the video

**Stack:**
- Expo SDK 51+ with Expo Router (file-based routing)
- NativeWind for styling (Tailwind class names)
- `expo-image-picker` for camera
- `expo-video` for video playback
- `expo-sharing` for share functionality
- Google Gemini API for image generation (gemini-2.0-flash)
- Higgsfield API via eachlabs.ai — **Kling 3.0 model, 7 seconds, no multi-shot, no enhance**
- API keys live server-side only — never in client components

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
- Always handle loading, error, and success states explicitly
- Higgsfield is async — implement polling every 3 seconds with a max timeout of 120 seconds
- Log API errors clearly with the endpoint and status code

**State management**
- Use React Context for global session state (photo, style, generated frames, video URL)
- Keep it simple — no Redux, no Zustand, no external state library

---

## File Structure

```
reroom/
├── app/
│   ├── index.tsx          # Home screen
│   ├── scan.tsx           # Camera screen
│   ├── style.tsx          # Style picker screen
│   ├── generating.tsx     # Loading/progress screen
│   ├── result.tsx         # Result screen with video
│   └── api/
│       ├── generate-frames+api.ts   # Gemini API route
│       └── generate-video+api.ts    # Higgsfield API route
├── components/
│   ├── StoryboardStrip.tsx   # 3-frame preview component
│   ├── ProgressSteps.tsx     # 4-step loading indicator
│   └── StyleCard.tsx         # Style option card
├── context/
│   └── RoomContext.tsx        # Global session state
├── constants/
│   └── styles.ts             # Style options config (Minimal/Cozy/Modern/Maximalist)
├── hooks/
│   └── useHiggsfield.ts      # Polling logic for Higgsfield job status
└── .env
```

---

## Screens & What They Do

### `index.tsx` — Home
- Full screen centered layout
- App name "ReRoom" + tagline "Point. Redesign. Watch it happen."
- Single CTA: "Scan Your Room" → navigates to `/scan`

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
- Then calls `/api/generate-video` with all 3 frames
- Shows 4-step progress:
  1. "Analyzing your room..."
  2. "Creating the chaos..." (4 candidates generated, best selected)
  3. "Designing your new space..." (4 candidates generated, best selected)
  4. "Rendering your transformation..." (Kling 3.0, 7s)
- Each step activates as the corresponding API call completes
- Show frame thumbnails as they arrive — don't wait for everything
- On completion → navigate to `/result`

### `result.tsx` — Result Screen
- StoryboardStrip at top showing all 3 frames with arrows between them
- 7-second video player below (expo-video, autoplay, looped)
- 2-line redesign description from Gemini response
- "Share" button via expo-sharing
- "Try Another Room" → resets context, navigates to `/scan`

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
1. Calls Gemini to generate **4 candidate images** for Frame 2 (chaos), selects best
2. Calls Gemini to generate **4 candidate images** for Frame 3 (final redesign), selects best
3. Returns both selected images as base64

**Critical image generation requirements:**
- **Minimum 2K resolution**
- **16:9 ratio**
- **Neutral background, nothing touching the edges of the frame**
- The video is only as good as the frames — do not skip the 4-iteration selection step

**Response:**
```typescript
{
  chaosFrame: string,    // base64, best of 4 candidates
  finalFrame: string,    // base64, best of 4 candidates
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
  frame1Base64: string,  // original photo
  frame2Base64: string,  // chaos frame (best candidate)
  frame3Base64: string   // final redesign frame (best candidate)
}
```

**What it does:**
1. Submits all 3 frames to Higgsfield via eachlabs.ai as consecutive keyframes
2. Model: **Kling 3.0** — do not use any other model
3. Duration: **7 seconds**
4. No multi-shot, no enhance — keep settings clean
5. Returns a job ID
6. Client polls `GET /api/generate-video?jobId=xxx` every 3 seconds
7. Returns video URL when complete

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

---

## What NOT to Do

- No user authentication
- No database or persistent storage of any kind
- No Redux, Zustand, or external state libraries
- No web-only APIs (`localStorage`, `document`, `window`)
- No skipping loading states — every async operation needs visual feedback
- No hardcoded API keys anywhere in the codebase
- Don't over-engineer — this ships in 24 hours
- Don't use any Higgsfield model other than Kling 3.0
- Don't skip the 4-iteration frame selection — it directly affects video quality

---

## Definition of Done

A judge picks up a phone, opens the app, photographs the room they're standing in, picks a style, waits ~60 seconds, and watches a cinematic 7-second video of that room transforming. The app doesn't crash. The video plays. That's done.