import type { Suggestion } from '@lo2ma/core';
import type { ChatMessage } from '@/features/chat/store';
import type { VoicePhase } from './session';

export interface Captions {
  /** The quiet line on top: what was said just before. */
  before?: string;
  /** The big line: what is being said now. */
  now?: string;
  /** The meal the last reply offered, to pick with a button. */
  suggestion?: Suggestion;
}

/** What the call screen shows as text, from the conversation it shares with the chat. */
export function captionsFor(phase: VoicePhase, messages: readonly ChatMessage[]): Captions {
  const last = messages.at(-1);
  const lastAgent = messages.findLast((message) => message.role === 'agent');
  const suggestion = lastAgent?.status === 'done' ? lastAgent.suggestions?.[0] : undefined;
  const userBefore = (reply: ChatMessage) =>
    messages.slice(0, messages.indexOf(reply)).findLast((message) => message.role === 'user')?.text;

  // The reply on its way or being read out, under what the user just said.
  const replying =
    last?.role === 'agent' &&
    last.status !== 'error' &&
    (phase === 'speaking' || (phase === 'thinking' && last.status === 'streaming'));
  if (replying) return { before: userBefore(last), now: last.text || undefined, suggestion };

  return { before: lastAgent?.status === 'done' ? lastAgent.text : undefined, suggestion };
}
