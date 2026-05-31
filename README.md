# ReRoom

Point. Redesign. Watch it happen.

A mobile app that lets you photograph your room and receive a cinematic AI-generated transformation video.

---

## Project Structure

```
RoomRevamp-RR-/
├── frontend/                        # Expo (React Native) app
│   ├── app/
│   │   ├── index.tsx                # Home screen
│   │   ├── scan.tsx                 # Camera / gallery screen
│   │   ├── style.tsx                # Style picker (Minimal / Cozy / Modern / Maximalist)
│   │   ├── generating.tsx           # Progress screen — calls backend, polls for video
│   │   └── result.tsx               # Storyboard + video playback + share
│   ├── components/
│   │   ├── StoryboardStrip.tsx      # 3-frame preview with arrows
│   │   ├── ProgressSteps.tsx        # 4-step loading indicator
│   │   └── StyleCard.tsx            # Style option card
│   ├── context/
│   │   └── RoomContext.tsx          # Global session state (photo, style, frames, video)
│   └── constants/
│       └── styles.ts                # Style options config
│
├── backend/                         # Express API server
│   ├── src/
│   │   ├── index.ts                 # Server entry point (port 3000)
│   │   └── routes/
│   │       ├── generateFrames.ts    # POST /api/generate-frames — Gemini (4 candidates each frame)
│   │       └── generateVideo.ts     # POST/GET /api/generate-video — Kling 3.0, 7s
│   ├── package.json
│   └── tsconfig.json
│
├── documents/                       # PRD and design docs
├── workflows/                       # CLAUDE.md workflow config
├── .env                             # GEMINI_API_KEY, EACHLABS_API_KEY (never commit)
└── .gitignore
```

---

## Stack

| Layer    | Technology                            |
|----------|---------------------------------------|
| Mobile   | Expo SDK 54, Expo Router, NativeWind |
| Camera   | expo-image-picker                     |
| Video    | expo-video, expo-sharing              |
| Backend  | Node.js, Express, TypeScript          |
| AI Image | Google Gemini (gemini-3.1-flash-image-preview) |
| AI Video | Higgsfield via eachlabs.ai (Kling 3.0, 7s) |

---

## Getting Started

### 1. Fill in your API keys

```
# .env
GEMINI_API_KEY=your_key_here
EACHLABS_API_KEY=your_key_here
```

### 2. Start the backend

```bash
cd backend
npm install
npm run dev
```

### 3. Start the frontend

```bash
cd frontend
npm install
npx expo start
```
