// Where the auth token lives.
//
// Native: expo-secure-store (Keychain / Android Keystore).
// Web, or a build that does not contain the SecureStore native module:
// AsyncStorage, which is where the token used to live on every platform.
//
// A token left in AsyncStorage by an older build is moved into SecureStore the
// first time it is read, so nobody is signed out by the upgrade.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_KEY = 'quickgift_auth_token'; // SecureStore keys: letters, digits, . - _
const LEGACY_KEY = 'token';

let SecureStore = null;
if (Platform.OS !== 'web') {
  try {
    // Required lazily so a binary without the native module still boots.
    SecureStore = require('expo-secure-store');
  } catch {
    SecureStore = null;
  }
}

// undefined = not read from disk yet; null = read, no token.
let cached;

async function secureGet() {
  if (!SecureStore) return null;
  try {
    return await SecureStore.getItemAsync(SECURE_KEY);
  } catch {
    return null;
  }
}

async function secureSet(value) {
  if (!SecureStore) return false;
  try {
    await SecureStore.setItemAsync(SECURE_KEY, value);
    return true;
  } catch {
    return false;
  }
}

async function secureDelete() {
  if (!SecureStore) return;
  try {
    await SecureStore.deleteItemAsync(SECURE_KEY);
  } catch {}
}

export async function getToken() {
  if (cached !== undefined) return cached;

  let token = await secureGet();
  if (!token) {
    // Older builds (and web) keep it in AsyncStorage.
    let legacy = null;
    try {
      legacy = await AsyncStorage.getItem(LEGACY_KEY);
    } catch {}
    if (legacy) {
      token = legacy;
      if (await secureSet(legacy)) {
        AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
      }
    }
  }
  // A concurrent setToken/clearToken may have run while we were reading.
  if (cached === undefined) cached = token || null;
  return cached;
}

export async function setToken(value) {
  cached = value || null;
  if (!value) return clearToken();
  if (await secureSet(value)) {
    AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
  } else {
    try {
      await AsyncStorage.setItem(LEGACY_KEY, value);
    } catch {}
  }
}

export async function clearToken() {
  cached = null;
  await secureDelete();
  try {
    await AsyncStorage.removeItem(LEGACY_KEY);
  } catch {}
}

/** The token if it has already been read this session (no disk access). */
export function peekToken() {
  return cached || null;
}
