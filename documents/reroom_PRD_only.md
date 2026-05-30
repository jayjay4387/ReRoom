# ReRoom — Product Requirements Document

---

## Product Overview

**Name:** ReRoom  
**Tagline:** *Point. Redesign. Watch it happen.*  
**Core idea:** User scans their room → Gemini generates a chaos frame and a final redesign frame → all 3 frames are passed to Higgsfield → cinematic transition video of the room transforming.

---

## Core User Flow (MVP)

1. **Scan** — User opens app, taps a button to open the native camera via `expo-image-picker`. Real viewfinder, feels like a proper camera app.
2. **Style Select** — User picks a vibe: Minimal / Cozy / Modern / Maximalist (simple 4-button selector)
3. **Frame Generation (3-step image pipeline via Gemini)** — App sends the original photo + selected style to Gemini. Gemini generates two images:
   - **Frame 2 (Chaos):** The room mid-transition — furniture floating, objects displaced, everything in dramatic mid-air disarray. Prompt should emphasize cinematic chaos, items hovering, nothing settled.
   - **Frame 3 (Final):** The fully redesigned room in the selected style. Clean, intentional, complete transformation.
4. **3-frame storyboard** — App now has 3 frames:
   - Frame 1: User's real photo (current room)
   - Frame 2: AI-generated chaos/transition state
   - Frame 3: AI-generated final redesign
5. **Transition video** — All 3 frames + a motion prompt are sent to Higgsfield. Higgsfield animates between them to produce a smooth cinematic video: current room → chaotic mid-transformation → final redesigned room
6. **Result screen** — Shows the 3 frames as a storyboard strip and the full generated video below it. Share/download button.

---

## Technical Stack

| Layer | Tech |
|---|---|
| Framework | Expo (React Native, SDK 51+) |
| Routing | Expo Router (file-based, same concept as Next.js App Router) |
| Styling | NativeWind (Tailwind class names in React Native) |
| Camera | `expo-image-picker` for native camera viewfinder |
| Room analysis + image generation | Google Gemini (gemini-2.0-flash or equivalent with image output) |
| Transition video | Higgsfield API via eachlabs.ai — Kling 3.0 model, 7 seconds |
| API layer | Expo API Routes or lightweight Express server to keep API keys off the client |
| Testing on device | Expo Go app (scan QR code, instant live reload) |
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
- Input: base64 original room photo + selected style
- **Output resolution: 2K minimum, 16:9 ratio, neutral background — nothing touching the edges**
- Generate 4 candidate images, select the best one before proceeding — frame quality directly determines video quality
- Prompt: *"Generate an image of this exact room mid-transformation. Furniture is floating in mid-air, objects are displaced and hovering, everything is in dramatic cinematic disarray as if a wind is sweeping through. Keep the same room dimensions and walls. Clean neutral background, nothing touching the edges of the frame. 16:9 ratio, high detail, 2K resolution."*
- Output: Best of 4 generated images of the room in chaos (Frame 2)

### 2. Gemini — Frame 3 (Final Redesign)
- Input: base64 original room photo + selected style
- **Output resolution: 2K minimum, 16:9 ratio, neutral background — nothing touching the edges**
- Generate 4 candidate images, select the best one before proceeding — this is the most important frame, it's what the user sees last
- Prompt: *"Generate an image of this exact room fully redesigned in [STYLE] style. Clean, intentional, beautifully decorated. Keep the same room dimensions, walls, windows, and doors. Clean neutral background, nothing touching the edges. 16:9 ratio, high detail, 2K resolution."*
- Output: Best of 4 generated images of the fully redesigned room (Frame 3)

### Frame Quality Note
The video is only as good as the start and end frames. Invest generation time here — do not skip the 4-iteration selection step. A weak Frame 3 means a weak video regardless of how good Higgsfield is.

### 3. Higgsfield API (via eachlabs.ai)
- Model: **Kling 3.0**
- Video length: **7 seconds**
- No multi-shot, no enhance — keep it clean
- Input: 3 frames in sequence — Frame 1 (real photo), Frame 2 (chaos), Frame 3 (final redesign)
- Higgsfield supports multi-frame and multimodal inputs natively — pass all 3 as consecutive keyframes in a single generation pipeline
- Motion prompt: *"Cinematic room transformation. Objects float and swirl through the air in slow motion, then gracefully settle into a beautiful new arrangement. Warm dramatic lighting, smooth camera drift, satisfying resolution."*
- Output: 7-second MP4 transition video animating between all 3 frames
- Note: Generation is async — poll for completion every 3 seconds, show a loading state

---

## Screens

### `/` — Home
- Full screen, centered
- App name + tagline
- Single CTA button: "Scan Your Room"

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
  - Step 4: "Rendering your transformation..." (Higgsfield animates all 3 frames, Kling 3.0, 7s)
- Estimated wait: ~60-90 seconds total
- Show storyboard frames progressively as each one completes — don't wait for everything

### `/result` — Result Screen
- 3-frame storyboard strip at top: Frame 1 (current) → Frame 2 (chaos) → Frame 3 (redesigned)
- Full 7-second transition video below, autoplaying and looped via `expo-video`
- Short description of the redesign style
- Share button via `expo-sharing`
- "Try another room" button → back to `/scan`

---

## Team Split (4 people, 24 hours)

| Person | Responsibility |
|---|---|
| 1 | Camera screen + image picker + `/scan` flow |
| 2 | Home, style picker, result screen UI |
| 3 | Gemini API integration (Frame 2 + Frame 3 generation, 4-iteration selection) |
| 4 | Higgsfield API integration (Kling 3.0, 7s) + video playback on result screen |

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
npx expo install expo-image-picker expo-video expo-sharing nativewind
```

Everyone installs **Expo Go** on their phones. Run `npx expo start`, scan the QR code, app is live.

---

## MVP Constraints (24hr scope)

- iOS and Android via Expo Go — no need for a production build during the hackathon
- No user accounts, no database, no persistence — everything is session-based
- No real-time room scanning — a single photo is enough
- If Higgsfield generation takes >60s, show a "still rendering" state with an animated progress indicator
- Error states: if any API fails, show a friendly message and a retry button

---

## What Success Looks Like at Demo

A judge picks up a phone, opens the app, takes a photo of the room they're standing in, picks "Modern", waits 60 seconds, and watches a cinematic 7-second video of that exact room transforming in front of their eyes.

That's the demo. Everything else is secondary.
