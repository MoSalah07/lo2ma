'use client';

import { VOICE_MIN_SECONDS } from '@lo2ma/core';
import { ArrowUp, AudioLines, Mic } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Chip } from '@/components/ui/chip';
import { focusRing } from '@/components/ui/focus';
import { IconButton, iconButtonVariants } from '@/components/ui/icon-button';
import { VoiceNotice, type VoiceProblem } from '@/components/voice-notice';
import { Link } from '@/i18n/navigation';
import type { Recording } from '@/lib/audio';
import { cn } from '@/lib/cn';
import { useTranscribe } from './api';
import { useVoiceRecorder } from './use-voice-recorder';
import { RecordingBar, TranscribingBar } from './voice-bar';

interface ComposerProps {
  busy: boolean;
  onSend: (text: string) => void;
}

const hint = 'flex items-center gap-1.5 px-2.5 text-caption leading-body text-muted';

/**
 * Quick replies and the floating message box, pinned above the tab bar. The user can also talk: the
 * recording is written down into the box, and nothing is sent until they check it and press send.
 */
export function Composer({ busy, onSend }: ComposerProps) {
  const t = useTranslations('chat');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [text, setText] = useState('');
  const [fromVoice, setFromVoice] = useState(false);
  const [problem, setProblem] = useState<VoiceProblem | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const mic = useRef<HTMLButtonElement>(null);
  const transcribe = useTranscribe();
  // Counts transcriptions, so a cancelled one that answers late is ignored.
  const attempt = useRef(0);

  function writeDown({ audio, seconds }: Recording) {
    if (seconds < VOICE_MIN_SECONDS) {
      setProblem('missed');
      return;
    }
    const id = ++attempt.current;
    transcribe.mutate(
      { audio, locale },
      {
        onSuccess: ({ text: heard }) => {
          if (id !== attempt.current) return;
          if (!heard.trim()) {
            setProblem('missed');
            return;
          }
          setText(heard);
          setFromVoice(true);
        },
        onError: () => {
          if (id === attempt.current) setProblem('missed');
        },
      },
    );
  }

  const voice = useVoiceRecorder(writeDown);
  const transcribing = transcribe.isPending;
  const voiceBusy = voice.recording || transcribing;

  // The recording bar's buttons go away when it ends, so focus comes back to the box: on the words to check,
  // or on the mic to try again. Only when focus was lost, so a tap elsewhere in the meantime is kept.
  const wasVoiceBusy = useRef(false);
  useEffect(() => {
    const ended = wasVoiceBusy.current && !voiceBusy;
    wasVoiceBusy.current = voiceBusy;
    if (!ended || (document.activeElement && document.activeElement !== document.body)) return;
    (input.current?.value.trim() ? input.current : (mic.current ?? input.current))?.focus();
  }, [voiceBusy]);

  async function talk() {
    setProblem(null);
    if (!(await voice.start())) setProblem('denied');
  }

  function cancelTranscribing() {
    attempt.current += 1;
    transcribe.reset();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    onSend(text);
    setText('');
    setFromVoice(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-above-nav z-10 mx-auto flex max-w-app flex-col gap-2.5 bg-linear-to-b from-bg/0 via-bg/95 via-30% to-bg/95 px-bar pt-4 pb-1">
      {!voice.recording && !transcribing && !problem && !fromVoice && (
        <div className="flex gap-2 overflow-x-auto px-1 scrollbar-none">
          <Chip
            disabled={busy}
            onClick={() => onSend(t('quickReplies.cheaper'))}
            className="text-body-sm"
          >
            {t('quickReplies.cheaper')}
          </Chip>
          <Chip
            disabled={busy}
            onClick={() => onSend(t('quickReplies.lighter'))}
            className="text-body-sm"
          >
            {t('quickReplies.lighter')}
          </Chip>
          <Link
            href="/plan"
            className={cn(
              'hit inline-flex h-control-sm shrink-0 items-center rounded-control bg-surface px-3.5 text-body-sm font-medium ring-1 ring-line ring-inset',
              focusRing,
            )}
          >
            {t('quickReplies.weeklyPlan')}
          </Link>
        </div>
      )}

      {problem && <VoiceNotice problem={problem}>{t(`voice.${problem}`)}</VoiceNotice>}
      {/* One live region for every voice step; «بكتب كلامك…» is already on screen, so it is only read out. */}
      <p role="status" className={cn(hint, !(voice.recording || fromVoice) && 'sr-only')}>
        {voice.recording && t('voice.listening')}
        {transcribing && t('voice.transcribing')}
        {!voice.recording && !transcribing && fromVoice && (
          <>
            <Mic aria-hidden className="size-3.5 shrink-0" />
            {t('voice.review')}
          </>
        )}
      </p>

      {voice.recording ? (
        <RecordingBar
          seconds={voice.seconds}
          levels={voice.levels}
          onCancel={voice.cancel}
          onStop={voice.stop}
        />
      ) : transcribing ? (
        <TranscribingBar onCancel={cancelTranscribing} />
      ) : (
        <form
          onSubmit={submit}
          className={cn(
            'flex h-14 items-center gap-2 rounded-panel bg-surface ps-4.5 pe-1.5 shadow-float',
            fromVoice && 'ring-1 ring-line',
          )}
        >
          <label htmlFor="chat-input" className="sr-only">
            {t('inputLabel')}
          </label>
          <input
            ref={input}
            id="chat-input"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setProblem(null);
              if (!event.target.value) setFromVoice(false);
            }}
            placeholder={voice.supported ? t('placeholderVoice') : t('placeholder')}
            autoComplete="off"
            maxLength={500}
            className="h-11 min-w-0 flex-1 bg-transparent text-body-md text-ink outline-none placeholder:text-muted"
          />
          {voice.supported && !text.trim() ? (
            <>
              <IconButton
                ref={mic}
                label={t('voice.start')}
                icon={Mic}
                variant="tint"
                onClick={() => void talk()}
              />
              <Link
                href="/voice"
                aria-label={t('voice.call')}
                className={iconButtonVariants({ variant: 'primary' })}
              >
                <AudioLines aria-hidden className="size-5" />
              </Link>
            </>
          ) : (
            <IconButton
              type="submit"
              label={tCommon('send')}
              icon={ArrowUp}
              variant="primary"
              disabled={busy || !text.trim()}
            />
          )}
        </form>
      )}
    </div>
  );
}
