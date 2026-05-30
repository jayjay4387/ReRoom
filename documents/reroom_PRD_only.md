# ReRoom — Product Requirements Document

> **Revision (2026-05-30):** Updated after a tech-stack audit. Three corrections + one scope
> addition vs. the original draft. See **Key Technical Decisions** below for the *why*.

---

## Key Technical Decisions (2026-05-30 revision)

1. **Gemini image model corrected.** `gemini-2.0-flash` is a *text* model. Image generation now
   lives on the **Nano Banana** line — we use **Nano Banana 2 (`gemini-3.1-flash-image-preview`)**
   (image-in + text-prompt → edited-image-out, up to 4K, better text rendering, up to 14 reference
   images). **No free tier — billing must be enabled day one** (~$0.067/image at 1024px). It is a
   `-preview` model, so expect more restrictive rate limits; have a paid key ready for the team.
2. **Video pipeline is start-frame + end-frame, NOT 3 keyframes.** Chosen model: **Kling 3.0 via
   eachlabs.ai, 7-second clip.** No mainstream video model (Kling, Higgsfield, *or* Luma — all
   verified) accepts 3 ordered keyframes in one generation; they cap at **2** (start + end). So the
   transition video uses **Frame 1 (real photo) as the start** and **Frame 3 (final redesign) as
   the end**, and the **motion prompt** creates the chaotic mid-transition. The chaos image
   (Frame 2) is still generated and shown in the storyboard strip — it is just **not** a video
   keyframe.
3. **Expo API Routes need a running server.** During the hackathon that's the dev machine running
   `npx expo start`; the phone reaches the routes over the LAN. Keep the laptop up and on the same
   network during the demo. (No standalone Expo Go build bakes in the keys.)
4. **NEW — on-device persistence + gallery (scope addition).** The original draft was
   session-only. We now: (a) save the final video to the phone's camera roll, and (b) keep a
   persistent in-app gallery of past redesigns on the device. No accounts, no server DB — purely
   local storage. See **Storage & Persistence** below.

Also bumped: **Expo SDK 51 → 54/55**; `expo-video`, `expo-image-picker`, `expo-sharing`,
NativeWind v4 are all current.

---

## Product Overview

**Name:** ReRoom
**Tagline:** *Point. Redesign. Watch it happen.*
**Core idea:** User scans their room → Gemini generates a chaos frame and a final redesign frame →
the real photo and the final redesign are sent to Kling 3.0 (via eachlabs.ai) as start/end frames →
cinematic 7-second transition video of the room transforming. Past redesigns are saved on the device.

---

## Core User Flow (MVP)

1. **Scan** — User opens app, taps a button to open the native camera via `expo-image-picker`. Real viewfinder, feels like a proper camera app.
2. **Style Select** — User picks a vibe: Minimal / Cozy / Modern / Maximalist (simple 4-button selector)
3. **Frame Generation (image pipeline via Gemini)** — App sends the original photo + selected style to Gemini (`gemini-3.1-flash-image-preview`, Nano Banana 2). Gemini generates two images:
   - **Frame 2 (Chaos):** The room mid-transition — furniture floating, objects displaced, everything in dramatic mid-air disarray. Used in the storyboard strip (not as a video keyframe).
   - **Frame 3 (Final):** The fully redesigned room in the selected style. Clean, intentional, complete transformation.
4. **3-frame storyboard** — App now has 3 frames:
   - Frame 1: User's real photo (current room)
   - Frame 2: AI-generated chaos/transition state
   - Frame 3: AI-generated final redesign
5. **Transition video** — **Frame 1 (start) + Frame 3 (end)** + a motion prompt are sent to Kling 3.0 (via eachlabs.ai). It animates from the real room to the final redesign as a 7-second clip; the motion prompt ("objects float and swirl, then settle") creates the chaotic mid-transformation between the two keyframes.
6. **Result screen** — Shows the 3 frames as a storyboard strip and the full generated video below it. Save-to-camera-roll + share buttons. The redesign is automatically saved to the on-device gallery.
7. **Gallery** — User can revisit any past redesign from a persistent on-device gallery and replay its storyboard + video.

---

## Technical Stack

| Layer | Tech |
|---|---|
| Framework | Expo (React Native, **SDK 54/55**) |
| Routing | Expo Router (file-based, same concept as Next.js App Router) |
| Styling | NativeWind v4 — Tailwind classes compiled to React Native styles; uses the real `tailwindcss` engine via `tailwind.config.js` (vanilla Tailwind CSS is web/DOM-only and can't run in RN) |
| Camera | `expo-image-picker` for native camera viewfinder |
| Room analysis + image generation | Google Gemini **`gemini-3.1-flash-image-preview`** (Nano Banana 2 — native image output, paid/no free tier) |
| Transition video | eachlabs.ai — **Kling 3.0 model, 7 seconds, start frame + end frame** (no multi-shot, no enhance) |
| API layer | Expo API Routes to keep API keys off the client (served by the running dev server) |
| On-device storage | `expo-file-system` (image/video files) + `AsyncStorage` (gallery metadata) |
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
The video is only as good as the start and end frames. Invest generation time here — do not skip the 4-iteration selection step. A weak Frame 3 means a weak video regardless of how good Higgsfield is.

### 3. Video API — Kling 3.0 (via eachlabs.ai)
- Model: **Kling 3.0**
- Video length: **7 seconds**
- No multi-shot, no enhance — keep it clean
- **Mode: image-to-video with start + end frame (2 keyframes max).**
- Input: **Frame 1 (real photo) as the start frame, Frame 3 (final redesign) as the end frame.** The chaos frame (Frame 2) is **not** sent — it cannot be a middle keyframe. Verified: Kling 3.0 (and Higgsfield, and Luma) all cap at 2 ordered keyframes; none accept a 3-keyframe sequence.
- Motion prompt: *"Cinematic room transformation. Objects float and swirl through the air in slow motion, then gracefully settle into a beautiful new arrangement. Warm dramatic lighting, smooth camera drift, satisfying resolution."* — this prompt is what produces the chaotic mid-transition between the two keyframes.
- Output: 7-second MP4 transition video (real room → chaotic motion → final redesign)
- Note: Generation is async — poll for completion every 3 seconds, show a loading state

---

## Storage & Persistence

No accounts, no server-side database. Everything is stored **locally on the device.**

- **Binaries** (3 frame images + the video file) are written to `expo-file-system`'s
  `documentDirectory`. The Gemini frames arrive as base64 (written straight to disk); the
  Higgsfield video arrives as a URL (downloaded via `FileSystem.downloadAsync`).
- **Metadata** (an array of `{ id, style, createdAt, framePaths[], videoPath }`) is stored in
  `AsyncStorage` as JSON — the gallery index.
- On the result screen, the user can also **save the video to the phone's camera roll** via
  `expo-media-library` (asks permission once).
- A redesign is persisted automatically when generation completes, so a reload or crash never
  loses the demo result.

---

## Screens

### `/` — Home
- App name + tagline
- Primary CTA button: "Scan Your Room"
- Secondary entry: **"View past rooms"** → `/gallery` (only meaningful once at least one redesign exists)

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
- "Try another room" button → back to `/scan` (past redesigns remain in the gallery)

### `/gallery` — Saved Redesigns
- Grid of past redesigns (thumbnail + style + date), newest first
- Tap a redesign → replay its full storyboard strip + video
- Empty state when nothing saved yet
- Delete option per item

---

## Team Split (4 people, 24 hours)

> 2 of the 4 are more technical; they own the API integrations and the shared scaffolds
> (RoomContext shape, storage layer, API route contracts) so the other two can build screens
> against typed seams from hour one.

| Person | Responsibility |
|---|---|
| 2 | Home, style picker, result screen, **gallery screen** UI |
| 3 (technical) | Gemini API integration (Frame 2 + Frame 3 generation, 4-iteration selection) |
| 4 (technical) | Video API integration (Kling 3.0, 7s) + video playback + **on-device storage layer** |
| Tech lead | Floating — owns shared scaffolds (RoomContext, storage module, API route contracts), unblocks everyone, owns the riskiest path (video generation) |

---

## Environment Variables Needed

```
GEMINI_API_KEY=
EACHLABS_API_KEY=
```

Store in `.env` at project root. Access via `process.env.GEMINI_API_KEY` in API routes. Never reference directly in client-side component code.

---

## Setup Before Hackathon Starts

```bash
npx create-expo-app reroom
cd reroom
npx expo install expo-image-picker expo-video expo-sharing nativewind \
  expo-file-system expo-media-library @react-native-async-storage/async-storage
```

Everyone installs **Expo Go** on their phones. Run `npx expo start`, scan the QR code, app is live.
**Keep the dev server running** — the API routes are served by it.

---

## MVP Constraints (24hr scope)

- iOS and Android via Expo Go — no need for a production build during the hackathon
- No user accounts and no server-side database — but redesigns **are** persisted locally on the device (see Storage & Persistence)
- No real-time room scanning — a single photo is enough
- If Higgsfield generation takes >60s, show a "still rendering" state with an animated progress indicator
- Error states: if any API fails, show a friendly message and a retry button

---

## What Success Looks Like at Demo

A judge picks up a phone, opens the app, takes a photo of the room they're standing in, picks "Modern", waits ~60 seconds, and watches a cinematic 7-second video of that exact room transforming in front of their eyes — then saves it to their camera roll and sees it land in the gallery.

That's the demo. Everything else is secondary.
