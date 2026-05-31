import Constants from 'expo-constants';

// The frontend (Expo Go on a phone) and the Express backend run on different hosts,
// so relative URLs like `/api/...` don't work — they'd hit the Expo dev server, not
// the backend on :3000. We resolve an absolute base URL instead:
//
//   1. EXPO_PUBLIC_API_URL  — explicit override (set in .env for tunnels/staging/prod).
//   2. The packager's LAN host (e.g. "192.168.1.5:8081") → http://192.168.1.5:3000.
//      This "just works" in Expo Go on the same Wi-Fi without hardcoding an IP.
//   3. localhost:3000        — last-resort fallback (simulator / web).
function resolveBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override.replace(/\/+$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:3000`;

  return 'http://localhost:3000';
}

export const API_BASE_URL = resolveBaseUrl();

// Build a full backend URL from an `/api/...` path.
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
