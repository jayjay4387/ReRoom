import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const OWNER_ID_KEY = 'reroom.ownerId';

// Returns this device's anonymous owner id, generating + persisting one on first call.
// This is the no-auth identity that powers the gallery's "My Rooms" view — it is sent
// as `ownerId` to POST /api/save-redesign and as ?owner= to GET /api/gallery.
// Per-device: it resets if the app is reinstalled / storage is cleared.
export async function getOwnerId(): Promise<string> {
  let id = await AsyncStorage.getItem(OWNER_ID_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await AsyncStorage.setItem(OWNER_ID_KEY, id);
  }
  return id;
}
