'use client';

import { formatCountdown } from '@lo2ma/core';
import { Check, LoaderCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { IconButton } from '@/components/ui/icon-button';

/** The still waveform for people who turn motion off, and the shape it starts from. */
const STILL_WAVE = [
  10, 16, 24, 32, 20, 28, 36, 22, 14, 26, 34, 18, 12, 24, 30, 16, 10, 20, 28, 14, 8, 18,
];

const bar = 'w-0.75 shrink-0 rounded-full bg-primary';

/** The last moments of loudness as bars, newest at the end; a fixed shape when motion is reduced. */
function Waveform({ levels }: { levels: number[] }) {
  return (
    <div
      aria-hidden
      className="flex h-9 min-w-0 flex-1 items-center justify-center gap-0.75 overflow-hidden"
    >
      <div className="flex items-center gap-0.75 motion-reduce:hidden">
        {/* Bars are only ever added at the end, so the index is a stable key. */}
        {levels.map((level, index) => (
          <span key={index} className={bar} style={{ height: `${4 + level * 32}px` }} />
        ))}
      </div>
      <div className="hidden items-center gap-0.75 motion-reduce:flex">
        {STILL_WAVE.map((height, index) => (
          <span key={index} className={bar} style={{ height: `${height}px` }} />
        ))}
      </div>
    </div>
  );
}

const barShell = 'flex h-14 items-center gap-2.5 rounded-28 bg-surface px-1.5 shadow-float';

interface RecordingBarProps {
  seconds: number;
  levels: number[];
  onCancel: () => void;
  onStop: () => void;
}

/** Takes the place of the message box while the user talks: cancel, the timer, the waveform and done. */
export function RecordingBar({ seconds, levels, onCancel, onStop }: RecordingBarProps) {
  const t = useTranslations('chat.voice');
  const done = useRef<HTMLButtonElement>(null);

  // The mic button that started this is gone, so keyboard focus moves to «خلّصت».
  useEffect(() => done.current?.focus(), []);

  return (
    <div className={barShell}>
      <IconButton label={t('cancel')} icon={X} variant="subtle" onClick={onCancel} />
      <span className="inline-flex shrink-0 items-center gap-1.5 text-15 font-semibold tabular-nums">
        <span aria-hidden className="size-2 rounded-full bg-on-pink" />
        {formatCountdown(seconds)}
      </span>
      <Waveform levels={levels} />
      <IconButton ref={done} label={t('stop')} icon={Check} variant="primary" onClick={onStop} />
    </div>
  );
}

/** While the server writes down what was said. */
export function TranscribingBar({ onCancel }: { onCancel: () => void }) {
  const t = useTranslations('chat.voice');
  return (
    <div className={barShell}>
      <IconButton label={t('cancel')} icon={X} variant="subtle" onClick={onCancel} />
      <LoaderCircle
        aria-hidden
        className="size-4.5 shrink-0 animate-spin text-primary motion-reduce:animate-none"
      />
      <span className="text-15 text-ink-2">{t('transcribing')}</span>
    </div>
  );
}
