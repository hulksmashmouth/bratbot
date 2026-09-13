export class TtsError extends Error {}

/**
 * Asks the local Piper TTS server to synthesize `text`, returning a
 * fully-qualified URL an audio player can fetch directly.
 */
export async function synthesizeSpeech(
  ttsUrl: string,
  text: string,
  timeoutMs = 15000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${ttsUrl}/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!res.ok) throw new TtsError(`TTS server responded with status ${res.status}`);
    const data = await res.json();
    return `${ttsUrl}${data.url}`;
  } catch (err) {
    if (err instanceof TtsError) throw err;
    throw new TtsError(`Could not reach the TTS server at ${ttsUrl}.`);
  } finally {
    clearTimeout(timer);
  }
}

export async function checkTtsHealth(ttsUrl: string): Promise<{ voice: string }> {
  const res = await fetch(`${ttsUrl}/health`);
  if (!res.ok) throw new TtsError(`TTS server responded with status ${res.status}`);
  return res.json();
}
