/** Parse SSE across arbitrary UTF-8/network chunk boundaries; require an explicit end marker. */
export async function readCompletionStream(
  body: ReadableStream<Uint8Array>,
  onText: (text: string) => void,
  signal?: AbortSignal
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = '',
    text = '',
    completed = false;
  const abort = () => {
    void reader.cancel();
  };
  signal?.addEventListener('abort', abort, { once: true });
  try {
    while (!completed) {
      signal?.throwIfAborted();
      const { done, value } = await reader.read();
      signal?.throwIfAborted();
      pending += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') {
          completed = true;
          break;
        }
        if (!data) continue;
        const parsed = JSON.parse(data);
        if (parsed.error) throw new Error('Explanation stream failed');
        const next = parsed.choices?.[0]?.delta?.content;
        if (typeof next === 'string') {
          text += next;
          onText(text);
        }
      }
      if (done) break;
    }
    if (!completed) throw new Error('Explanation stream ended early; partial text is not a complete response');
    return text;
  } finally {
    signal?.removeEventListener('abort', abort);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
