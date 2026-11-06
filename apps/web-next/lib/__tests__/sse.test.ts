import { it, expect } from 'vitest';
import { readCompletionStream } from '../sse';
const stream = (parts: Uint8Array[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) controller.enqueue(part);
      controller.close();
    },
  });
it('reassembles split lines and UTF-8 before requiring DONE', async () => {
  const bytes = new TextEncoder().encode('data: {"choices":[{"delta":{"content":"你好"}}]}\r\n\r\ndata: [DONE]\n\n');
  const chunks = Array.from(bytes, byte => new Uint8Array([byte]));
  expect(await readCompletionStream(stream(chunks), () => undefined)).toBe('你好');
});
it('reports a truncated stream instead of treating partial text as complete', async () => {
  const partial = new TextEncoder().encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n');
  let shown = '';
  await expect(
    readCompletionStream(stream([partial]), value => {
      shown = value;
    })
  ).rejects.toThrow('ended early');
  expect(shown).toBe('partial');
});
it('cancels a pending reader when aborted', async () => {
  const controller = new AbortController();
  const task = readCompletionStream(new ReadableStream(), () => undefined, controller.signal);
  controller.abort();
  await expect(task).rejects.toThrow();
});
