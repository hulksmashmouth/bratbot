import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL_KEY = 'dollypocket.baseUrl';
const MODEL_KEY = 'dollypocket.model';
const RAG_URL_KEY = 'dollypocket.ragUrl';
const RAG_ENABLED_KEY = 'dollypocket.ragEnabled';

export const DEFAULT_MODEL = 'qwen2.5:3b';

// When running via Expo on the same Mac that hosts Ollama, the dev server's
// host IP (from the Metro/Expo manifest) is the phone's route back to that Mac.
function guessHost(): string | undefined {
  const hostUri =
    Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  return hostUri?.split(':')[0];
}

export function guessDefaultBaseUrl(): string {
  const host = guessHost();
  return host ? `http://${host}:11434` : 'http://localhost:11434';
}

export function guessDefaultRagUrl(): string {
  const host = guessHost();
  return host ? `http://${host}:11435` : 'http://localhost:11435';
}

export async function getBaseUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem(BASE_URL_KEY);
  return stored ?? guessDefaultBaseUrl();
}

export async function setBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(BASE_URL_KEY, url.trim());
}

export async function getModel(): Promise<string> {
  const stored = await AsyncStorage.getItem(MODEL_KEY);
  return stored ?? DEFAULT_MODEL;
}

export async function setModel(model: string): Promise<void> {
  await AsyncStorage.setItem(MODEL_KEY, model.trim());
}

export async function getRagUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem(RAG_URL_KEY);
  return stored ?? guessDefaultRagUrl();
}

export async function setRagUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(RAG_URL_KEY, url.trim());
}

export async function getRagEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(RAG_ENABLED_KEY);
  return stored === null ? true : stored === 'true';
}

export async function setRagEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(RAG_ENABLED_KEY, String(enabled));
}
