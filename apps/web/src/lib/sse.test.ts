import { chatEventSchema, type ChatEvent } from '@lo2ma/core';
import { describe, expect, it } from 'vitest';
import { readSseEvents } from './sse';

/** A stream that delivers the text in the given pieces, like a slow network. */
function streamOf(...chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>) {
  const events: ChatEvent[] = [];
  for await (const event of readSseEvents(stream, chatEventSchema)) events.push(event);
  return events;
}

describe('readSseEvents', () => {
  it('yields every event in order', async () => {
    const events = await collect(
      streamOf(
        'data: {"type":"token","text":"لقيت "}\n\n',
        'data: {"type":"token","text":"3"}\n\n',
        'data: {"type":"done"}\n\n',
      ),
    );
    expect(events).toEqual([
      { type: 'token', text: 'لقيت ' },
      { type: 'token', text: '3' },
      { type: 'done' },
    ]);
  });

  it('joins an event that arrives split across chunks', async () => {
    const events = await collect(streamOf('data: {"type":"tok', 'en","text":"ok"}\n', '\n'));
    expect(events).toEqual([{ type: 'token', text: 'ok' }]);
  });

  it('rejects an event that does not match the schema', async () => {
    await expect(collect(streamOf('data: {"type":"oops"}\n\n'))).rejects.toThrow();
  });
});
