'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { usePrefs } from '@/features/prefs/api';
import { ChatBubble } from './chat-bubble';
import { ChatHeader } from './chat-header';
import { Composer } from './composer';
import { MealCard } from './meal-card';
import { MealRow } from './meal-row';
import { useChat } from './use-chat';

export function ChatScreen() {
  const t = useTranslations();
  const prefs = usePrefs();
  const { messages, busy, send } = useChat();
  const endRef = useRef<HTMLDivElement>(null);
  const avatar = t('common.brandInitial');

  // Keep the newest words in view while the reply streams in.
  const lastText = messages.at(-1)?.text;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length, lastText]);

  return (
    <>
      <ChatHeader prefs={prefs.data} />
      {/* role="log" announces finished messages politely; aria-busy holds a reply until it's complete. */}
      <div role="log" className="flex flex-col gap-3.5 px-4 pt-1 pb-56">
        <ChatBubble from="agent" avatar={avatar}>
          {t('chat.greeting')}
        </ChatBubble>
        {messages.map((message) => {
          const [first, ...others] = message.suggestions ?? [];
          return (
            <div key={message.id} className="flex flex-col gap-3.5">
              <ChatBubble from={message.role} avatar={avatar} busy={message.status === 'streaming'}>
                {message.status === 'error'
                  ? t('common.error')
                  : message.text || (message.status === 'streaming' ? t('chat.thinking') : '')}
              </ChatBubble>
              {first && <MealCard suggestion={first} budget={message.budget} />}
              {others.map((suggestion) => (
                <MealRow key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          );
        })}
        {/* Keeps the newest card above the message box and tab bar when scrolled into view. */}
        <div ref={endRef} className="scroll-mb-60" />
      </div>
      <Composer busy={busy} onSend={(text) => void send(text)} />
    </>
  );
}
