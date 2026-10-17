'use client';

import { ChevronDown, Keyboard, Mic, MicOff, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Screen } from '@/components/screen';
import { buttonVariants } from '@/components/ui/button';
import { focusRing } from '@/components/ui/focus';
import { IconButton, iconButtonVariants } from '@/components/ui/icon-button';
import { VoiceNotice } from '@/components/voice-notice';
import { useChatStore } from '@/features/chat/store';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { captionsFor } from './captions';
import { useVoiceSession } from './use-voice-session';
import { VoiceMeal } from './voice-meal';
import { VoiceOrb } from './voice-orb';

/** A call with Lo2ma: talk, hear the answer, pick the meal with a button. Paying is never by voice. */
export function VoiceScreen() {
  const t = useTranslations();
  const call = useVoiceSession();
  const messages = useChatStore((state) => state.messages);
  const { phase } = call;
  const { before, now, suggestion } = captionsFor(phase, messages);
  const problem = phase === 'blocked' || phase === 'unsupported';
  const listening = phase === 'listening' && !call.muted;
  const tappable = listening || phase === 'speaking';
  const hint = call.failed ? t('common.error') : listening ? t('voiceMode.hint') : null;

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="sr-only">{t('voiceMode.title')}</h1>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-bar">
        <Link href="/chat" aria-label={t('voiceMode.minimize')} className={iconButtonVariants()}>
          <ChevronDown aria-hidden className="size-5" />
        </Link>
        {!problem && (
          <span className="inline-flex h-8 items-center gap-1.5 rounded-tag bg-tint px-3 text-label-md text-on-tint">
            <span aria-hidden className="size-2 rounded-full bg-primary" />
            {t(`voiceMode.phase.${call.muted ? 'muted' : phase}`)}
          </span>
        )}
        <span aria-hidden className="size-11" />
      </header>

      {problem ? (
        <Screen className="flex-1 justify-center">
          {phase === 'blocked' ? (
            <VoiceNotice problem="denied">{t('chat.voice.denied')}</VoiceNotice>
          ) : (
            <VoiceNotice problem="missed">{t('voiceMode.unsupported')}</VoiceNotice>
          )}
          <Link href="/chat" className={buttonVariants({ variant: 'tonal', size: 'md' })}>
            {t('voiceMode.keyboard')}
          </Link>
        </Screen>
      ) : (
        <>
          <div className="flex h-75 shrink-0 items-center justify-center">
            <VoiceOrb
              level={call.level}
              speaking={phase === 'speaking'}
              label={phase === 'speaking' ? t('voiceMode.interrupt') : t('voiceMode.done')}
              onTap={tappable ? call.tap : undefined}
            />
          </div>

          <div className="flex flex-1 flex-col items-center gap-3 px-gutter text-center">
            {/* Read out once a reply is whole, not on every streamed word. */}
            <div
              aria-live="polite"
              aria-busy={phase === 'thinking'}
              className="flex flex-col items-center gap-3"
            >
              <p className="text-body-md text-muted">{before ?? t('chat.greeting')}</p>
              {now && <p className="text-title-lg leading-body font-bold text-balance">{now}</p>}
            </div>
            {!now && hint && (
              <p
                role={call.failed ? 'alert' : undefined}
                className="text-title-lg leading-body font-bold text-balance"
              >
                {hint}
              </p>
            )}
            {suggestion && <VoiceMeal suggestion={suggestion} />}
          </div>

          <div className="flex flex-col items-center gap-3.5 px-gutter pt-stack pb-screen-end">
            <div className="flex items-center gap-5">
              <Link
                href="/chat"
                aria-label={t('voiceMode.keyboard')}
                className={cn(iconButtonVariants(), 'size-14')}
              >
                <Keyboard aria-hidden className="size-5.5" />
              </Link>
              <IconButton
                label={call.muted ? t('voiceMode.unmute') : t('voiceMode.mute')}
                icon={call.muted ? MicOff : Mic}
                aria-pressed={call.muted}
                onClick={call.toggleMute}
                className="size-14"
              />
              <Link
                href="/chat"
                aria-label={t('voiceMode.end')}
                className={cn(
                  'inline-flex h-14 w-18 items-center justify-center rounded-full bg-danger text-on-danger',
                  focusRing,
                )}
              >
                <X aria-hidden className="size-6" />
              </Link>
            </div>
            <p className="text-caption text-muted">{t('voiceMode.payNote')}</p>
          </div>
        </>
      )}
    </div>
  );
}
