import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ChatBubbleProps {
  from: 'user' | 'agent';
  /** The letter in the agent's avatar («ل» / «L»). */
  avatar: string;
  busy?: boolean;
  children: ReactNode;
}

/** The user's message is a dark bubble at the end; the agent's reply is plain text next to its avatar. */
export function ChatBubble({ from, avatar, busy = false, children }: ChatBubbleProps) {
  if (from === 'user') {
    return (
      <p className="max-w-4/5 self-end rounded-22 bg-inverse px-4 py-2.5 text-body-md text-on-inverse">
        {children}
      </p>
    );
  }

  return (
    <div className="flex items-start gap-2.5" aria-busy={busy}>
      <span
        aria-hidden
        className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-primary text-title-sm text-on-primary"
      >
        {avatar}
      </span>
      <div className={cn('min-w-0 flex-1 pt-0.5 text-body-md leading-loose text-ink-2')}>
        {children}
      </div>
    </div>
  );
}
