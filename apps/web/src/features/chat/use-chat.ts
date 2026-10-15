import { chatEventSchema } from '@lo2ma/core';
import { useLocale } from 'next-intl';
import { jsonBody, request } from '@/lib/api';
import { readSseEvents } from '@/lib/sse';
import { useChatStore } from './store';

let lastId = 0;
const nextId = () => String(++lastId);

/**
 * Sends a message and streams the agent's reply into the store as it arrives: text first, word by word,
 * then the suggestion cards. FastAPI will send the exact same events in phase 3.
 */
export function useChat() {
  const locale = useLocale();
  const { messages, add, update } = useChatStore();
  const busy = messages.some((message) => message.status === 'streaming');

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;

    add({ id: nextId(), role: 'user', text: message, status: 'done' });
    const replyId = nextId();
    add({ id: replyId, role: 'agent', text: '', status: 'streaming' });

    try {
      const response = await request('/chat', {
        method: 'POST',
        ...jsonBody({ message, locale }),
      });
      if (!response.body) throw new Error('The chat reply has no body');

      for await (const event of readSseEvents(response.body, chatEventSchema)) {
        if (event.type === 'token') {
          update(replyId, (reply) => ({ ...reply, text: reply.text + event.text }));
        } else if (event.type === 'suggestions') {
          update(replyId, (reply) => ({
            ...reply,
            suggestions: event.suggestions,
            budget: event.budget,
          }));
        } else if (event.type === 'error') {
          throw new Error(event.code);
        }
      }
      update(replyId, (reply) => ({ ...reply, status: 'done' }));
    } catch {
      update(replyId, (reply) => ({ ...reply, status: 'error' }));
    }
  }

  return { messages, busy, send };
}
