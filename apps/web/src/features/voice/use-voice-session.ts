import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useTranscribe } from '@/features/chat/api';
import { ApiError } from '@/lib/api';
import { useChatStore } from '@/features/chat/store';
import { useChat } from '@/features/chat/use-chat';
import {
  createVoiceSession,
  initialVoiceState,
  type VoiceSessionDeps,
  type VoiceSessionState,
} from './session';

type VoiceSession = ReturnType<typeof createVoiceSession>;

/**
 * Runs one call while the voice screen is open. The call talks to the same conversation as the chat, so
 * everything said is there when the user goes back to typing.
 */
export function useVoiceSession() {
  const locale = useLocale();
  const { send } = useChat();
  const transcribe = useTranscribe();
  const [state, setState] = useState<VoiceSessionState>(initialVoiceState);
  const deps = useRef<VoiceSessionDeps | null>(null);
  const session = useRef<VoiceSession | null>(null);

  // The session calls these later, from the microphone's timers, so it always gets the latest ones.
  useEffect(() => {
    deps.current = {
      locale,
      transcribe: async (audio) => {
        try {
          return (await transcribe.mutateAsync({ audio, locale })).text;
        } catch (error) {
          if (error instanceof ApiError && error.code === 'no_speech') return '';
          throw error;
        }
      },
      reply: async (text) => {
        const before = useChatStore.getState().messages.length;
        await send(text);
        const { messages } = useChatStore.getState();
        // The chat was still answering an earlier message, so this one wasn't sent.
        if (messages.length === before) throw new Error('chat_busy');
        const last = messages.at(-1);
        if (last?.role !== 'agent' || last.status !== 'done') throw new Error('no_reply');
        return last.text;
      },
    };
  });

  // One call per visit: the microphone opens with the screen and closes with it.
  useEffect(() => {
    const call = createVoiceSession(() => deps.current, setState);
    session.current = call;
    void call.connect();
    return () => {
      call.hangUp();
      session.current = null;
    };
  }, []);

  return {
    ...state,
    tap: () => session.current?.tap(),
    toggleMute: () => session.current?.toggleMute(),
  };
}
