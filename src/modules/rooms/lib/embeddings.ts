import "server-only";

export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "bge-m3";

/**
 * Turns texts into embedding vectors with the local Ollama server.
 * bge-m3 is multilingual, so Vietnamese queries match English room descriptions.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const baseUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const res = await fetch(`${baseUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });

  if (!res.ok) {
    throw new Error(`Ollama embedding request failed: ${res.status} ${await res.text()}`);
  }

  const { embeddings } = (await res.json()) as { embeddings: number[][] };
  return embeddings;
}
