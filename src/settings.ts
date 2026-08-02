import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL_KEY = 'bratbot.baseUrl';
const MODEL_KEY = 'bratbot.model';

export const DEFAULT_MODEL = 'llama3.2';

// When running via Expo on the same Mac that hosts Ollama, the dev server's
// host IP (from the Metro/Expo manifest) is the phone's route back to that Mac.
export function guessDefaultBaseUrl(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0];
  return host ? `http://${host}:11434` : 'http://localhost:11434';
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
