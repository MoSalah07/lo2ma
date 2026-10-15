'use client';

import { ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import { focusRing } from '@/components/ui/focus';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

interface ComposerProps {
  busy: boolean;
  onSend: (text: string) => void;
}

/** Quick replies and the floating message box, pinned above the tab bar. */
export function Composer({ busy, onSend }: ComposerProps) {
  const t = useTranslations('chat');
  const tCommon = useTranslations('common');
  const [text, setText] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    onSend(text);
    setText('');
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-md flex-col gap-2.5 bg-linear-to-b from-bg/0 via-bg/95 via-30% to-bg/95 px-3 pt-4 pb-1">
      <div className="flex gap-2 overflow-x-auto px-1 scrollbar-none">
        <Chip disabled={busy} onClick={() => onSend(t('quickReplies.cheaper'))} className="text-13">
          {t('quickReplies.cheaper')}
        </Chip>
        <Chip disabled={busy} onClick={() => onSend(t('quickReplies.lighter'))} className="text-13">
          {t('quickReplies.lighter')}
        </Chip>
        <Link
          href="/plan"
          className={cn(
            'inline-flex h-11 shrink-0 items-center rounded-full bg-surface px-4 text-13 font-medium ring-1 ring-line ring-inset',
            focusRing,
          )}
        >
          {t('quickReplies.weeklyPlan')}
        </Link>
      </div>
      <form
        onSubmit={submit}
        className="flex h-14 items-center gap-2 rounded-28 bg-surface ps-4.5 pe-1.5 shadow-float"
      >
        <label htmlFor="chat-input" className="sr-only">
          {t('inputLabel')}
        </label>
        <input
          id="chat-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t('placeholder')}
          autoComplete="off"
          maxLength={500}
          className="h-11 min-w-0 flex-1 bg-transparent text-15 text-ink outline-none placeholder:text-muted"
        />
        <IconButton
          type="submit"
          label={tCommon('send')}
          icon={ArrowUp}
          variant="primary"
          disabled={busy || !text.trim()}
        />
      </form>
    </div>
  );
}
