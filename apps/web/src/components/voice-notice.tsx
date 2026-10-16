import { Mic, MicOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type VoiceProblem = 'denied' | 'missed';

/** Why voice didn't work this time. Typing always still works, so it never blocks anything. */
export function VoiceNotice({ problem, children }: { problem: VoiceProblem; children: ReactNode }) {
  const Icon = problem === 'denied' ? MicOff : Mic;
  return (
    <p
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-18 px-3.5 py-3 text-13 leading-body',
        problem === 'denied' ? 'bg-warn text-on-warn' : 'bg-surface text-ink-2 ring-1 ring-line',
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-4.5 shrink-0" />
      {children}
    </p>
  );
}
