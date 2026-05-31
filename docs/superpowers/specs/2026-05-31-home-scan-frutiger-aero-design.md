# ReRoom MVP Frontend — Home + Scan (Frutiger Aero) Design Spec

- **Date:** 2026-05-31
- **Issue:** [#11 — Frontend: Home + Scan screens](https://github.com/jayjay4387/ReRoom/issues/11) (also establishes the MVP frontend's overall visual language + nav shell)
- **Branch:** `feat/home-scan-design` (off `feat/expo-bootstrap`)

## 1. Goal & Scope

Establish the MVP frontend's **navigation shell** and **"Sky Glass" Frutiger Aero design system**, and ship the **Home** and **Scan** screens in it. The screens already exist functionally (`app/index.tsx`, `app/scan.tsx`) wired to `RoomContext`; this work adds the nav shell + a small reusable design layer and applies the visual language.

**In scope**
- Navigation shell: bottom tab bar (**Home · Gallery**) rendered as a custom **floating glass dock**; the creation flow (Scan → Style → Generating → Result) stacks **on top** of the tabs (dock hidden during the flow).
- **Gallery**: a "coming soon" **stub** (no backend yet).
- **Home** screen: full treatment — hero glass house, chrome-glass wordmark, glass card, glossy green CTA.
- **Scan** screen: two states (empty, photo-preview) in the same language.
- A small reusable component layer (`components/aero/`) shared by both screens.

**Out of scope (now)**
- Style / Generating / Result keep their existing implementation; re-skinning them is a follow-up.
- Gallery backend (MongoDB/Cloudinary) and the real feed.
- Frontend→backend API wiring (separate ticket). Scan only saves to `RoomContext` and navigates.

## 2. Constraints

- **Expo SDK 54** — required for the team's Expo Go. Do not bump without confirming Expo Go support.
- **Icons: HugeIcons only** — `@hugeicons/react-native` + `@hugeicons/core-free-icons`. No emoji, no `@expo/vector-icons`.
- **NativeWind v4** for layout/spacing/color utilities; visual effects (gradients, blur) via native libs.
- TypeScript strict (no `any`); functional components; RN primitives; works on iOS + Android.
- Hackathon ethos: prefer shipping working code; keep the reusable layer light, no premature abstraction.

## 3. Design language — "Sky Glass"

**Palette / tokens**
- Sky gradient (top→bottom): `#4FB0EE → #7CC6F1 → #BCE6FB → #DCF2FF`
- Grass/green accent: `#7CCD44 → #3C9A2D`
- Green CTA: base `#3BBF48`, gradient `#34D4A0 → #37B6CF → #5FCE5A`, plus a top white specular highlight
- Glass: white @ 20–28% opacity, 1px border `rgba(180,230,255,.8)`, blur ~7px, inner top highlight, soft drop shadow
- Iridescent sweep: diagonal multi-hue overlay (pink/cyan/green/gold @ ~16% each), layer opacity ~50%
- Text on sky: white + subtle blue drop shadow; the **ReRoom** wordmark uses a chrome-glass gradient (white→pale blue)

**Materials**
- Frosted glass (BlurView) for cards, the dock, the scan viewfinder, and secondary buttons.
- Glossy buttons: stacked gradients (top specular highlight + color gradient).
- **Hero glass house**: glossy translucent SVG with an iridescent tint and a soft reflection beneath.

**Shared background system**: sky gradient + 2 soft clouds + sun glow (top-right) + iridescent sweep + a low green grassy hill at the bottom.

**Motion** (nice-to-have, not required for MVP): gentle float on the house, specular sweep on the CTA.

## 4. Navigation architecture

```
app/
  _layout.tsx              # root Stack; mounts RoomProvider + imports global.css.
                           # Screens: (tabs), scan, style, generating, result — all headerShown:false
  (tabs)/
    _layout.tsx            # Tabs navigator with a CUSTOM floating-glass tabBar (Home, Gallery)
    index.tsx              # Home
    gallery.tsx            # Gallery stub
  scan.tsx                 # flow step — pushed over the tabs (dock hidden)
  style.tsx                # existing (unchanged for now)
  generating.tsx           # existing
  result.tsx               # existing
```

- Home CTA "Scan Your Room" → `router.push('/scan')`; flow screens render full-screen above the tab bar.
- **Custom tab bar** (`FloatingDock`): absolute, detached, rounded frosted-glass dock; active tab = glossy green pill; HugeIcons glyphs (Home, Image/Gallery).
- Back from Scan: glass back button (top-left) → `router.back()`.
- Moving `index.tsx` into `(tabs)/` and adding the tab `_layout.tsx` is the main routing change; existing flow screens move/stay at root level.

## 5. Reusable components (`components/aero/`)

Each is small and single-purpose; Home/Scan/Gallery compose them.
- **SkyBackground** — shared sky gradient + clouds + sun + iridescent sweep + grass hill; wraps screen content. Optional prop to dial decoration.
- **GlassCard** — frosted BlurView card with iridescent border + inner glow; `children`.
- **GlassButtonPrimary** — glossy green gradient pill; props `label`, `icon` (HugeIcons), `onPress`.
- **GlassButtonGhost** — frosted translucent pill; `label`, `icon`, `onPress`.
- **GlassHouse** — hero glass-house SVG with reflection.
- **FloatingDock** — custom `Tabs` `tabBar` (glass dock + active green pill).

## 6. Screen designs

### Home — `app/(tabs)/index.tsx`
Top→bottom: `SkyBackground` → hero `GlassHouse` + reflection → chrome-glass "ReRoom" wordmark → tagline "Point. Redesign. Watch it happen." → `GlassCard` (HugeIcons camera + "Scan a room to begin") → `GlassButtonPrimary` "Scan Your Room" → `/scan`. `FloatingDock` with Home active. No data.

### Gallery stub — `app/(tabs)/gallery.tsx`
`SkyBackground` + centered `GlassCard`: HugeIcons image icon + "Community gallery — coming soon." Exists so the tab is present; no data.

### Scan — `app/scan.tsx`
Header: glass back button + title.
- **State A (no photo):** `GlassCard` "viewfinder" (HugeIcons camera + prompt) → `GlassButtonPrimary` "Take Photo" (`launchCameraAsync`, images, `base64:true`, `quality:1`) → `GlassButtonGhost` "Choose from gallery" (`launchImageLibraryAsync`, `base64:true`).
- **State B (photo set):** photo inside a glossy glass frame → `GlassButtonPrimary` "Looks good" (saves asset to `RoomContext` via `setPhoto`, then `router.push('/style')`) → `GlassButtonGhost` "Retake" (`setPhoto(null)`).
- **SDK-54 fix:** existing `scan.tsx` uses `ImagePicker.MediaTypeOptions.Images` (deprecated in SDK 54) → switch to `mediaTypes: ['images']`.
- **Permissions:** request camera/library on demand; on denial show a glass notice + retry/open-settings; never crash; cancel → stay on State A. (Permission strings already configured in `app.json`'s expo-image-picker plugin.)

## 7. Data flow

`RoomContext` (existing) holds the photo (`ImagePickerAsset`, incl. `base64`) and the selected style. Scan sets the photo; downstream flow reads it. No new state stores, no Redux/Zustand.

## 8. Dependencies to add (`npx expo install`, SDK-54 versions)

- `expo-linear-gradient` — gradients (sky, CTA gloss, iridescent sweep)
- `expo-blur` — frosted glass (BlurView)
- `react-native-svg` — glass house + crisp decorative shapes
- `@react-native-masked-view/masked-view` — gradient/chrome wordmark text
- `@hugeicons/react-native` + `@hugeicons/core-free-icons` — icons

NativeWind v4 and expo-router are already installed.

## 9. Verification

- `npx tsc --noEmit` clean; `npx expo-doctor` passes.
- `npx expo export --platform android` bundles (headless proof the effects/deps compile).
- Device (Expo Go, SDK 54): Home renders with all effects; Home → Scan; "Take Photo" opens the camera on a real device; gallery fallback works; preview shows; "Looks good" → Style; "Retake" clears; `RoomContext` carries the photo (incl. base64).
- Acceptance = issue #11 success criteria.

## 10. Risks / notes

- **Performance:** many BlurViews + gradients on one screen can be heavy on low-end Android. Cap BlurViews to ~3–4 per screen; prefer static gradients over blur where possible.
- **Gradient text** needs MaskedView; if fiddly, fall back to a solid white wordmark with a shadow.
- **Glass house** stays a single, simple SVG component.
- Style/Generating/Result remain un-reskinned for now and will look inconsistent until a follow-up — acceptable for #11.
