export interface RagResult {
  id: string;
  title: string;
  createTime: string;
  text: string;
  score: number;
}

export async function searchHistory(
  ragUrl: string,
  query: string,
  topK = 5,
  timeoutMs = 5000
): Promise<RagResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${ragUrl}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`RAG search failed (status ${res.status})`);
    const data = await res.json();
    return data.results ?? [];
  } finally {
    clearTimeout(timer);
  }
}

export async function checkRagHealth(ragUrl: string): Promise<{ chunks: number }> {
  const res = await fetch(`${ragUrl}/health`);
  if (!res.ok) throw new Error(`RAG server responded with status ${res.status}`);
  return res.json();
}
