import type { z } from 'zod';

/**
 * Reads a server-sent event stream and yields each `data:` payload, parsed and validated.
 * A network chunk can end in the middle of an event, so text is buffered until a blank line closes it.
 */
export async function* readSseEvents<T>(
  stream: ReadableStream<Uint8Array>,
  schema: z.ZodType<T>,
): AsyncGenerator<T> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    // `stream: true` keeps a multi-byte Arabic letter intact when it is split between two chunks.
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = frame
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n');
      if (data) yield schema.parse(JSON.parse(data));
      boundary = buffer.indexOf('\n\n');
    }
  }
}
