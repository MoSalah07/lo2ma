'use client';

import { formatMoney, formatNumber, type AgentStep } from '@lo2ma/core';
import {
  CircleCheck,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const looks: Record<AgentStep['kind'], { icon: LucideIcon; className: string }> = {
  user: { icon: User, className: 'bg-surface-2 text-ink-2' },
  understand: { icon: Sparkles, className: 'bg-lilac text-on-lilac' },
  tool: { icon: Wrench, className: 'bg-tint text-on-tint' },
  reply: { icon: MessageSquare, className: 'bg-lilac text-on-lilac' },
  confirmed: { icon: CircleCheck, className: 'bg-good text-on-good' },
};

const code =
  'rounded-14 bg-surface-2 px-3.5 py-3 font-mono text-12 leading-body whitespace-pre-wrap';

/** JSON on one line with a space after each separator, the way the design shows the parsed request. */
const compactJson = (value: unknown) => JSON.stringify(value, null, 1).replace(/\n\s*/g, ' ');

interface StepItemProps {
  step: AgentStep;
  last: boolean;
}

/** One step of a conversation trace: an icon on the timeline, a title, timing, and what happened. */
export function StepItem({ step, last }: StepItemProps) {
  const t = useTranslations('admin.agent');
  const locale = useLocale();
  const { icon: Icon, className } = looks[step.kind];

  const seconds = (ms: number) => t('seconds', { value: formatNumber(ms / 1000, locale, 1) });
  const usage = (tokens: number, ms: number) => (
    <>
      {t('tokenCount', { count: formatNumber(tokens, locale) })}
      <span aria-hidden>·</span>
      {seconds(ms)}
    </>
  );
  const clock = (at: string) => (
    <bdi dir="ltr" className="tabular-nums">
      {at}
    </bdi>
  );

  let title: ReactNode;
  let meta: ReactNode;
  let body: ReactNode;
  switch (step.kind) {
    case 'user':
      title = t('stepTitles.user');
      meta = clock(step.at);
      body = (
        <p
          dir="auto"
          className="self-start rounded-18 bg-inverse px-3.5 py-2.5 text-14 text-on-inverse"
        >
          {step.text}
        </p>
      );
      break;
    case 'understand':
      title = t('stepTitles.understand');
      meta = usage(step.tokens, step.ms);
      body = (
        <pre dir="ltr" className={code}>
          {compactJson(step.parsed)}
        </pre>
      );
      break;
    case 'tool':
      title = t.rich('stepTitles.tool', {
        tool: step.tool,
        name: (chunks) => (
          <bdi dir="ltr" className="font-mono">
            {chunks}
          </bdi>
        ),
      });
      meta = seconds(step.ms);
      body = (
        <>
          {step.call && (
            <pre dir="ltr" className={code}>
              {step.call}
            </pre>
          )}
          <p className="text-13 text-ink-2">
            {t(`toolResults.${step.tool}`, { count: step.results })}
          </p>
        </>
      );
      break;
    case 'reply':
      title = t('stepTitles.reply');
      meta = usage(step.tokens, step.ms);
      body = (
        <p dir="auto" className="rounded-18 bg-surface-2 px-3.5 py-2.5 text-14 leading-body">
          {step.text}
        </p>
      );
      break;
    case 'confirmed':
      title = t('stepTitles.confirmed');
      meta = clock(step.at);
      body = (
        <>
          <p className="text-13 text-ink-2">
            {t.rich('confirmedBody', {
              id: `#${step.orderId}`,
              total: formatMoney(step.total, locale),
              order: (chunks) => <bdi dir="ltr">{chunks}</bdi>,
            })}
          </p>
          <p className="flex items-center gap-2 self-start rounded-14 bg-good px-3 py-2 text-12 leading-body font-semibold text-on-good">
            <ShieldCheck aria-hidden className="size-4 shrink-0" />
            {t('safety')}
          </p>
        </>
      );
      break;
  }

  return (
    <li className="flex gap-3">
      <div className="flex shrink-0 flex-col items-center">
        <span
          className={cn('inline-flex size-8 items-center justify-center rounded-full', className)}
        >
          <Icon aria-hidden className="size-4" />
        </span>
        {!last && <span aria-hidden className="w-0.5 flex-1 bg-divider" />}
      </div>
      <div className={cn('flex min-w-0 flex-1 flex-col gap-2', !last && 'pb-4.5')}>
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h3 className="text-14 font-bold">{title}</h3>
          <span className="flex gap-1 text-12 text-muted">{meta}</span>
        </div>
        {body}
      </div>
    </li>
  );
}
