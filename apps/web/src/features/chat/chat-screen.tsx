'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { Appear, Sequence, SequenceItem } from '@/components/motion/entrance';
import { Screen } from '@/components/screen';
import { usePrefs } from '@/features/prefs/api';
import { fitTargetOf } from '@/features/prefs/options';
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
  const goal = fitTargetOf(prefs.data?.calories);

  // Keep the newest words in view while the reply streams in.
  const lastText = messages.at(-1)?.text;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length, lastText]);

  return (
    <>
      <ChatHeader prefs={prefs.data} />
      {/* role="log" announces finished messages politely; aria-busy holds a reply until it's complete. */}
      <Screen role="log" clear="composer" className="pt-1">
        <ChatBubble from="agent" avatar={avatar}>
          {t('chat.greeting')}
        </ChatBubble>
        {messages.map((message) => {
          const [first, ...others] = message.suggestions ?? [];
          return (
            <Appear key={message.id} className="flex flex-col gap-stack">
              <ChatBubble from={message.role} avatar={avatar} busy={message.status === 'streaming'}>
                {message.status === 'error'
                  ? t('common.error')
                  : message.text || (message.status === 'streaming' ? t('chat.thinking') : '')}
              </ChatBubble>
              {first && (
                <Sequence className="flex flex-col gap-stack">
                  <SequenceItem>
                    <MealCard suggestion={first} budget={message.budget} goal={goal} />
                  </SequenceItem>
                  {others.map((suggestion) => (
                    <SequenceItem key={suggestion.id}>
                      <MealRow suggestion={suggestion} goal={goal} />
                    </SequenceItem>
                  ))}
                </Sequence>
              )}
            </Appear>
          );
        })}
        {/* Keeps the newest card above the message box and tab bar when scrolled into view. */}
        <div ref={endRef} className="scroll-mb-60" />
      </Screen>
      <Composer busy={busy} onSend={(text) => void send(text)} />
    </>
  );
}
