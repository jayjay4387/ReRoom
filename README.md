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
│   │       └── generateVideo.ts     # POST /api/generate-video — Higgsfield (DoP), blocks until rendered
│   ├── package.json
│   └── tsconfig.json
│
├── documents/                       # PRD and design docs
├── workflows/                       # CLAUDE.md workflow config
├── .env                             # GEMINI_API_KEY, HF_CREDENTIALS, MONGODB_URI, CLOUDINARY creds (never commit)
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
| AI Video | Higgsfield (DoP image-to-video, start/end frames) |
| Storage  | Cloudinary — 3 frames + 7s video, CDN URLs |
| Database | MongoDB Atlas — one doc per redesign (metadata + Cloudinary URLs) |
| Gallery  | Public community feed + per-device "My Rooms" |
| Identity | Anonymous device ID (UUID in AsyncStorage) — no login |

---

## Getting Started

### 1. Fill in your API keys

```
# .env
GEMINI_API_KEY=your_key_here
HF_CREDENTIALS=your_key_id:your_key_secret

# cloud storage + gallery layer (MongoDB + Cloudinary)
MONGODB_URI=your_atlas_uri_here
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_key_here
CLOUDINARY_API_SECRET=your_secret_here
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
