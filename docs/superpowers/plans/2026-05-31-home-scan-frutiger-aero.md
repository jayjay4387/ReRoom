# Home + Scan (Frutiger Aero "Sky Glass") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ReRoom MVP frontend nav shell + "Sky Glass" design system and apply it to the Home and Scan screens (issue #11).

**Architecture:** Expo Router with a `(tabs)` group (Home · Gallery) rendered through a custom floating-glass tab bar; the creation flow (`scan` → `style` → `generating` → `result`) is pushed on top of the tabs as root-level Stack screens (tab bar hidden during the flow). A small reusable `components/aero/` layer (SkyBackground, GlassCard, GlassButton, GlassHouse, FloatingDock) is composed by the screens. Visual effects use `expo-linear-gradient`, `expo-blur`, and `react-native-svg`; the wordmark uses MaskedView; all icons are HugeIcons.

**Tech Stack:** Expo SDK 54, Expo Router, NativeWind v4, TypeScript (strict), expo-linear-gradient, expo-blur, react-native-svg, @react-native-masked-view/masked-view, @hugeicons/react-native + @hugeicons/core-free-icons.

**Testing approach (deviation from default TDD — read this):** No test harness exists and the work is native-effect-heavy UI whose acceptance is visual. Per-task automated gate = `npx tsc --noEmit` (run from `frontend/`) **and** at integration points `npx expo export --platform android` (must bundle, exit 0). Final acceptance = device walkthrough in Expo Go (SDK 54) against issue #11's success criteria. Do **not** add jest/RNTL — it's out of scope for this MVP.

**Working directory:** all commands run from `C:/Users/thait/MPC/RoomRevamp-RR-/frontend` unless noted. Branch: `feat/home-scan-design`.

---

## File Structure

```
frontend/
  constants/
    theme.ts                       # NEW — Sky Glass design tokens
  components/aero/
    SkyBackground.tsx              # NEW — sky gradient + sun + clouds + iridescent sweep + grass hill
    GlassCard.tsx                  # NEW — frosted BlurView card
    GlassButton.tsx                # NEW — GlassButtonPrimary + GlassButtonGhost
    GlassHouse.tsx                 # NEW — hero glass-house SVG + reflection
    FloatingDock.tsx               # NEW — custom Tabs tabBar (glass dock, green active pill)
  app/
    _layout.tsx                    # MODIFY — root Stack lists (tabs)+scan+style+generating+result
    (tabs)/
      _layout.tsx                  # NEW — Tabs with tabBar={FloatingDock}
      index.tsx                    # MOVE from app/index.tsx + restyle (Home)
      gallery.tsx                  # NEW — stub
    scan.tsx                       # MODIFY — restyle + SDK54 mediaTypes fix + permissions + states
    style.tsx, generating.tsx, result.tsx   # unchanged
```

---

## Task 1: Install dependencies

**Files:** `frontend/package.json` (via installer)

- [ ] **Step 1: Install native deps (SDK-54 versions auto-resolved)**

Run from `frontend/`:
```bash
npx expo install expo-linear-gradient expo-blur react-native-svg @react-native-masked-view/masked-view
```

- [ ] **Step 2: Install HugeIcons**

```bash
npm install @hugeicons/react-native @hugeicons/core-free-icons
```

- [ ] **Step 3: Verify the exact icon export names exist** (used throughout the plan)

```bash
node -e "const i=require('@hugeicons/core-free-icons'); ['Home01Icon','Image01Icon','Camera01Icon','ArrowLeft01Icon','CheckmarkCircle01Icon','RefreshIcon'].forEach(n=>console.log(n, !!i[n]))"
```
Expected: each prints `<name> true`. If any prints `false`, open `node_modules/@hugeicons/core-free-icons` and pick the closest existing export (e.g. `Tick02Icon`, `RefreshIcon`/`ReloadIcon`, `ArrowLeft01Icon`), and use that name everywhere below.

- [ ] **Step 4: Doctor + typecheck**

```bash
npx expo-doctor
npx tsc --noEmit
```
Expected: doctor passes; tsc exit 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add aero deps (linear-gradient, blur, svg, masked-view, hugeicons)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Design tokens

**Files:** Create `frontend/constants/theme.ts`

- [ ] **Step 1: Write the tokens**

```ts
// frontend/constants/theme.ts
export const SKY_GRADIENT = ['#4FB0EE', '#7CC6F1', '#BCE6FB', '#DCF2FF'] as const;
export const GRASS_GRADIENT = ['#7CCD44', '#3C9A2D'] as const;
export const CTA_GREEN = ['#34D4A0', '#37B6CF', '#5FCE5A'] as const;
export const CTA_GREEN_BASE = '#3BBF48';
export const WORDMARK_GRADIENT = ['#FFFFFF', '#CFEEFF', '#9AD6FF'] as const;
export const IRIDESCENT = [
  'rgba(255,60,160,0.16)',
  'rgba(40,200,255,0.16)',
  'rgba(120,255,150,0.16)',
  'rgba(255,215,60,0.16)',
] as const;
export const GLASS = {
  fill: 'rgba(255,255,255,0.24)',
  border: 'rgba(180,230,255,0.8)',
  textDark: '#0F3B55',
} as const;
export const GREEN_TEXT = '#2F6B3A';
export const SKY_FALLBACK = '#4FB0EE';
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add constants/theme.ts
git commit -m "feat(aero): add Sky Glass design tokens" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: SkyBackground

**Files:** Create `frontend/components/aero/SkyBackground.tsx`

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/aero/SkyBackground.tsx
import { ReactNode } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { SKY_GRADIENT, GRASS_GRADIENT, IRIDESCENT, SKY_FALLBACK } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function SkyBackground({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={SKY_GRADIENT} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="sun" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="cloud" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <Stop offset="0.7" stopColor="#ffffff" stopOpacity="0.45" />
            <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width * 0.85} cy={40} rx={130} ry={130} fill="url(#sun)" />
        <Ellipse cx={width * 0.22} cy={150} rx={90} ry={34} fill="url(#cloud)" />
        <Ellipse cx={width * 0.84} cy={250} rx={62} ry={24} fill="url(#cloud)" opacity={0.7} />
      </Svg>
      <LinearGradient
        colors={IRIDESCENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
        pointerEvents="none"
      />
      <View style={styles.hillClip} pointerEvents="none">
        <LinearGradient colors={GRASS_GRADIENT} style={styles.hill} />
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SKY_FALLBACK },
  content: { flex: 1 },
  hillClip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, overflow: 'hidden' },
  hill: {
    position: 'absolute',
    bottom: 0,
    left: -width * 0.16,
    right: -width * 0.16,
    height: 150,
    borderTopLeftRadius: width,
    borderTopRightRadius: width,
  },
});
```

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/aero/SkyBackground.tsx
git commit -m "feat(aero): SkyBackground (sky gradient + sun + clouds + sweep + grass)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: GlassCard

**Files:** Create `frontend/components/aero/GlassCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/aero/GlassCard.tsx
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { GLASS } from '../../constants/theme';

export default function GlassCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.shadow, style]}>
      <BlurView intensity={28} tint="light" style={styles.card}>
        <View style={styles.inner}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 18,
    shadowColor: '#143C5A',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
    backgroundColor: GLASS.fill,
  },
  inner: { padding: 14, alignItems: 'center', gap: 6 },
});
```

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/aero/GlassCard.tsx
git commit -m "feat(aero): GlassCard frosted glass container" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: GlassButton (Primary + Ghost)

**Files:** Create `frontend/components/aero/GlassButton.tsx`

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/aero/GlassButton.tsx
import { Pressable, Text, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CTA_GREEN, GLASS } from '../../constants/theme';

type Props = {
  label: string;
  icon?: typeof HugeiconsIcon extends never ? never : any; // HugeIcons icon object
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function GlassButtonPrimary({ label, icon, onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.shadow, style, pressed && styles.pressed]}>
      <View style={styles.clip}>
        <LinearGradient colors={CTA_GREEN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
          <LinearGradient
            colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
            style={styles.gloss}
            pointerEvents="none"
          />
          {icon && <HugeiconsIcon icon={icon} size={18} color="#ffffff" />}
          <Text style={styles.primaryText}>{label}</Text>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

export function GlassButtonGhost({ label, icon, onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [style, pressed && styles.pressed]}>
      <View style={[styles.clip, styles.ghostBorder]}>
        <BlurView intensity={24} tint="light" style={[styles.fill, styles.ghostFill]}>
          {icon && <HugeiconsIcon icon={icon} size={16} color={GLASS.textDark} />}
          <Text style={styles.ghostText}>{label}</Text>
        </BlurView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    width: '86%',
    borderRadius: 999,
    shadowColor: '#145A1E',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  clip: { width: '86%', borderRadius: 999, overflow: 'hidden', alignSelf: 'center' },
  fill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13 },
  gloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  primaryText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  ghostBorder: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.62)' },
  ghostFill: { backgroundColor: 'rgba(255,255,255,0.32)' },
  ghostText: { color: GLASS.textDark, fontWeight: '600', fontSize: 14 },
  pressed: { opacity: 0.9 },
});
```
Note: the primary button's outer `shadow` view sets width 86% and the inner `clip` also 86% with `alignSelf:center` — simplify by removing width from `clip` for primary (it fills shadow). If tsc/layout complains, set `clip` width to `'100%'` for primary usage. Keep ghost using the same `clip`.

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` → exit 0. If the `icon` prop type errors, replace its type with `icon?: any;`.

- [ ] **Step 3: Commit**

```bash
git add components/aero/GlassButton.tsx
git commit -m "feat(aero): GlassButtonPrimary + GlassButtonGhost" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: GlassHouse

**Files:** Create `frontend/components/aero/GlassHouse.tsx`

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/aero/GlassHouse.tsx
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLG, Stop, Polygon, Rect } from 'react-native-svg';

export default function GlassHouse() {
  return (
    <View style={styles.wrap}>
      <Svg width={84} height={74} viewBox="0 0 84 74">
        <Defs>
          <SvgLG id="body" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#aae1ff" stopOpacity="0.3" />
          </SvgLG>
          <SvgLG id="door" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#7fe6bf" />
            <Stop offset="1" stopColor="#37b98c" />
          </SvgLG>
        </Defs>
        <Polygon points="42,4 10,30 74,30" fill="#ffffff" fillOpacity={0.6} />
        <Rect x="18" y="30" width="48" height="38" rx="6" fill="url(#body)" stroke="#c8f2ff" strokeWidth="1" />
        <Rect x="36" y="50" width="12" height="18" rx="3" fill="url(#door)" />
        <Rect x="50" y="38" width="10" height="10" rx="2" fill="#ffffff" fillOpacity={0.75} />
      </Svg>
      <View style={styles.reflect} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  reflect: {
    width: 70,
    height: 12,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginTop: 2,
    transform: [{ scaleX: 1.15 }],
  },
});
```

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/aero/GlassHouse.tsx
git commit -m "feat(aero): GlassHouse hero SVG" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: FloatingDock (custom tab bar)

**Files:** Create `frontend/components/aero/FloatingDock.tsx`

- [ ] **Step 1: Write the component**

```tsx
// frontend/components/aero/FloatingDock.tsx
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Home01Icon, Image01Icon } from '@hugeicons/core-free-icons';
import { CTA_GREEN, GREEN_TEXT } from '../../constants/theme';

const ICONS: Record<string, any> = { index: Home01Icon, gallery: Image01Icon };
const LABELS: Record<string, string> = { index: 'Home', gallery: 'Gallery' };

export default function FloatingDock({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <BlurView intensity={30} tint="light" style={styles.dock}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          const icon = ICONS[route.name] ?? Home01Icon;
          const label = LABELS[route.name] ?? route.name;
          if (focused) {
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.tab}>
                <LinearGradient colors={CTA_GREEN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pill}>
                  <HugeiconsIcon icon={icon} size={16} color="#ffffff" />
                  <Text style={styles.onText}>{label}</Text>
                </LinearGradient>
              </Pressable>
            );
          }
          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab}>
              <View style={styles.pill}>
                <HugeiconsIcon icon={icon} size={16} color={GREEN_TEXT} />
                <Text style={styles.offText}>{label}</Text>
              </View>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14, bottom: 18 },
  dock: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    padding: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  tab: { flex: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, borderRadius: 13 },
  onText: { color: '#ffffff', fontWeight: '700', fontSize: 11 },
  offText: { color: GREEN_TEXT, fontWeight: '600', fontSize: 11 },
});
```
Note: if `@react-navigation/bottom-tabs` isn't directly resolvable for the type import, run `npx expo install @react-navigation/bottom-tabs` (it's a peer of expo-router's Tabs) — but try the import first; expo-router usually provides it transitively.

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/aero/FloatingDock.tsx
git commit -m "feat(aero): FloatingDock custom glass tab bar" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Routing restructure (tabs + root stack)

**Files:**
- Create: `frontend/app/(tabs)/_layout.tsx`
- Move: `frontend/app/index.tsx` → `frontend/app/(tabs)/index.tsx` (content replaced in Task 9; move now so routing resolves)
- Create: `frontend/app/(tabs)/gallery.tsx` (temporary minimal, finalized in Task 10)
- Modify: `frontend/app/_layout.tsx`

- [ ] **Step 1: Move Home into the tabs group**

```bash
mkdir -p "app/(tabs)"
git mv app/index.tsx "app/(tabs)/index.tsx"
```

- [ ] **Step 2: Create the tabs layout**

```tsx
// frontend/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import FloatingDock from '../../components/aero/FloatingDock';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingDock {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="gallery" />
    </Tabs>
  );
}
```
Note: if TS flags `sceneStyle`, use `sceneContainerStyle` instead (API name varies by version); keep `backgroundColor: 'transparent'`.

- [ ] **Step 3: Create a temporary gallery screen (finalized in Task 10)**

```tsx
// frontend/app/(tabs)/gallery.tsx
import { View, Text } from 'react-native';

export default function GalleryScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Text>Gallery</Text>
    </View>
  );
}
```

- [ ] **Step 4: Update the root layout to register flow screens**

```tsx
// frontend/app/_layout.tsx
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RoomProvider } from '../context/RoomContext';

export default function RootLayout() {
  return (
    <RoomProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="style" />
        <Stack.Screen name="generating" />
        <Stack.Screen name="result" />
      </Stack>
    </RoomProvider>
  );
}
```

- [ ] **Step 5: Typecheck + bundle**

```bash
npx tsc --noEmit
npx expo export --platform android --output-dir dist-verify && rm -rf dist-verify
```
Expected: tsc exit 0; export bundles (exit 0). If `index.tsx`'s old content references things removed, it still compiles (it's the prior Home screen) — that's fine; Task 9 replaces it.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(nav): (tabs) group with FloatingDock + root stack for flow screens" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Home screen (restyle)

**Files:** Modify `frontend/app/(tabs)/index.tsx` (replace contents)

- [ ] **Step 1: Write the Home screen**

```tsx
// frontend/app/(tabs)/index.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Camera01Icon } from '@hugeicons/core-free-icons';
import SkyBackground from '../../components/aero/SkyBackground';
import GlassCard from '../../components/aero/GlassCard';
import GlassHouse from '../../components/aero/GlassHouse';
import { GlassButtonPrimary } from '../../components/aero/GlassButton';
import { WORDMARK_GRADIENT, GLASS } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <SkyBackground>
      <View style={styles.container}>
        <GlassHouse />
        <MaskedView maskElement={<Text style={styles.brand}>ReRoom</Text>}>
          <LinearGradient colors={WORDMARK_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
            <Text style={[styles.brand, styles.brandHidden]}>ReRoom</Text>
          </LinearGradient>
        </MaskedView>
        <Text style={styles.tag}>Point. Redesign. Watch it happen.</Text>
        <GlassCard style={styles.card}>
          <HugeiconsIcon icon={Camera01Icon} size={26} color={GLASS.textDark} />
          <Text style={styles.lead}>Scan a room to begin</Text>
        </GlassCard>
        <View style={styles.spacer} />
        <GlassButtonPrimary label="Scan Your Room" icon={Camera01Icon} onPress={() => router.push('/scan')} />
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 72, paddingHorizontal: 20, paddingBottom: 110 },
  brand: { fontSize: 40, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center', color: '#000' },
  brandHidden: { opacity: 0 },
  tag: { marginTop: 4, fontSize: 13, textAlign: 'center', color: '#EEF8FF' },
  card: { width: '100%', marginTop: 24 },
  lead: { fontSize: 12, color: GLASS.textDark, opacity: 0.85 },
  spacer: { flex: 1 },
});
```
Note: in the MaskedView, the mask `Text` color must be opaque (`#000`) so the mask is solid; the visible gradient-filled text is the second `Text` rendered transparent inside the gradient. This produces gradient-filled letters. If MaskedView misbehaves on Android, fall back to a plain `<Text style={[styles.brand,{color:'#fff'}]}>ReRoom</Text>` with a text shadow.

- [ ] **Step 2: Typecheck + bundle**

```bash
npx tsc --noEmit
npx expo export --platform android --output-dir dist-verify && rm -rf dist-verify
```
Expected: exit 0 both.

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat(home): Sky Glass home screen (hero house, wordmark, CTA)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Gallery stub (finalize)

**Files:** Modify `frontend/app/(tabs)/gallery.tsx`

- [ ] **Step 1: Write the stub**

```tsx
// frontend/app/(tabs)/gallery.tsx
import { View, Text, StyleSheet } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Image01Icon } from '@hugeicons/core-free-icons';
import SkyBackground from '../../components/aero/SkyBackground';
import GlassCard from '../../components/aero/GlassCard';
import { GLASS } from '../../constants/theme';

export default function GalleryScreen() {
  return (
    <SkyBackground>
      <View style={styles.center}>
        <GlassCard style={styles.card}>
          <HugeiconsIcon icon={Image01Icon} size={30} color={GLASS.textDark} />
          <Text style={styles.title}>Community gallery</Text>
          <Text style={styles.sub}>Coming soon</Text>
        </GlassCard>
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 90 },
  card: { width: '86%' },
  title: { fontSize: 15, fontWeight: '700', color: GLASS.textDark },
  sub: { fontSize: 12, color: GLASS.textDark, opacity: 0.7 },
});
```

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/gallery.tsx"
git commit -m "feat(gallery): Sky Glass coming-soon stub" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Scan screen (restyle + states + permissions + SDK54 fix)

**Files:** Modify `frontend/app/scan.tsx` (replace contents)

- [ ] **Step 1: Write the Scan screen**

```tsx
// frontend/app/scan.tsx
import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  Camera01Icon,
  Image01Icon,
  CheckmarkCircle01Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons';
import SkyBackground from '../components/aero/SkyBackground';
import GlassCard from '../components/aero/GlassCard';
import { GlassButtonPrimary, GlassButtonGhost } from '../components/aero/GlassButton';
import { useRoom } from '../context/RoomContext';
import { GLASS } from '../constants/theme';

export default function ScanScreen() {
  const router = useRouter();
  const { photo, setPhoto } = useRoom();

  const pickFrom = async (mode: 'camera' | 'library') => {
    try {
      const perm =
        mode === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', `Please allow ${mode === 'camera' ? 'camera' : 'photo'} access in Settings.`);
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 1 };
      const result =
        mode === 'camera'
          ? await ImagePicker.launchCameraAsync({ ...opts, cameraType: ImagePicker.CameraType.back })
          : await ImagePicker.launchImageLibraryAsync(opts);
      if (!result.canceled) setPhoto(result.assets[0]);
    } catch {
      Alert.alert('Something went wrong', 'Could not open that. Please try again.');
    }
  };

  return (
    <SkyBackground>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={GLASS.textDark} />
        </Pressable>
        <Text style={styles.htitle}>{photo ? 'Looks good?' : 'Scan your room'}</Text>
      </View>

      <View style={styles.body}>
        {photo ? (
          <>
            <View style={styles.frame}>
              <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
            </View>
            <View style={styles.btns}>
              <GlassButtonPrimary label="Looks good" icon={CheckmarkCircle01Icon} onPress={() => router.push('/style')} />
              <GlassButtonGhost label="Retake" icon={RefreshIcon} onPress={() => setPhoto(null)} />
            </View>
          </>
        ) : (
          <>
            <GlassCard style={styles.vf}>
              <HugeiconsIcon icon={Camera01Icon} size={32} color={GLASS.textDark} />
              <Text style={styles.vtext}>Point at the room you want to redesign</Text>
            </GlassCard>
            <View style={styles.btns}>
              <GlassButtonPrimary label="Take Photo" icon={Camera01Icon} onPress={() => pickFrom('camera')} />
              <GlassButtonGhost label="Choose from gallery" icon={Image01Icon} onPress={() => pickFrom('library')} />
            </View>
          </>
        )}
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 54, paddingHorizontal: 14, paddingBottom: 6 },
  back: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)',
  },
  htitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 36 },
  vf: { width: '100%', height: 160 },
  vtext: { fontSize: 11, color: GLASS.textDark, opacity: 0.85, textAlign: 'center', paddingHorizontal: 18 },
  frame: {
    width: '100%', height: 320, borderRadius: 18, overflow: 'hidden',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.82)',
  },
  photo: { width: '100%', height: '100%' },
  btns: { marginTop: 'auto', alignItems: 'center', gap: 10 },
});
```
Note: `mediaTypes: ['images']` is the SDK-54 array form (replaces the deprecated `ImagePicker.MediaTypeOptions.Images`). If tsc flags the `['images']` type, check the installed `expo-image-picker` types and use the documented value (`['images']` for SDK 54; older fallback `ImagePicker.MediaTypeOptions.Images`).

- [ ] **Step 2: Typecheck + bundle**

```bash
npx tsc --noEmit
npx expo export --platform android --output-dir dist-verify && rm -rf dist-verify
```
Expected: exit 0 both.

- [ ] **Step 3: Commit**

```bash
git add app/scan.tsx
git commit -m "feat(scan): Sky Glass scan screen (states, permissions, SDK54 mediaTypes)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Final verification on device

**Files:** none (verification + any small fixes)

- [ ] **Step 1: Full automated gate**

```bash
npx tsc --noEmit
npx expo-doctor
npx expo export --platform android --output-dir dist-verify && rm -rf dist-verify
```
Expected: tsc exit 0; doctor passes; export bundles.

- [ ] **Step 2: Device walkthrough (Expo Go, SDK 54)**

```bash
npx expo start -c
```
Scan the QR in Expo Go and confirm against issue #11:
- Home renders: blue sky + sun + clouds + grass + iridescent sweep + hero glass house + "ReRoom" wordmark + glass card + glossy green "Scan Your Room"; floating glass dock shows Home (active) + Gallery.
- Tab to Gallery → "Community gallery — Coming soon" card.
- Tap "Scan Your Room" → Scan screen (dock hidden, glass back button).
- "Take Photo" → camera opens on a real device; capture → preview in glass frame.
- "Choose from gallery" → library opens; pick → preview.
- "Retake" clears; "Looks good" → Style screen.
- Confirm the photo (incl. base64) is in `RoomContext` (Style/Generating read it).

- [ ] **Step 3: Fix any device-only issues** (e.g. MaskedView fallback, blur performance) inline, re-run Step 1, then commit:

```bash
git add -A
git commit -m "fix(frontend): device-verified polish for Home + Scan" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review (author checklist — completed)

- **Spec coverage:** nav shell (Task 8) ✓; floating glass dock (Task 7) ✓; Gallery stub (Task 10) ✓; design tokens + components (Tasks 2–7) ✓; Home (Task 9) ✓; Scan two states + permissions + SDK54 fix (Task 11) ✓; deps incl. HugeIcons (Task 1) ✓; verification (Task 12) ✓.
- **Placeholders:** none — every code step has full content. External icon export names get a verification step (Task 1, Step 3) rather than being assumed.
- **Type consistency:** `setPhoto`/`photo` match `RoomContext`; `GlassButtonPrimary`/`GlassButtonGhost` named exports match imports in Tasks 9–11; `SkyBackground`/`GlassCard`/`GlassHouse`/`FloatingDock` default exports match imports; token names (`SKY_GRADIENT`, `CTA_GREEN`, `WORDMARK_GRADIENT`, `IRIDESCENT`, `GLASS`, `GREEN_TEXT`, `GRASS_GRADIENT`, `SKY_FALLBACK`) defined in Task 2 and used consistently.
- **Known runtime caveats flagged inline:** MaskedView Android fallback (Task 9), `sceneStyle`/`sceneContainerStyle` name (Task 8), `mediaTypes` value (Task 11), `@react-navigation/bottom-tabs` type import (Task 7), shadow+overflow on primary button (Task 5).
```
