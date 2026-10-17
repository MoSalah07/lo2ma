'use client';

import { formatMoney, formatNumber, formatTime, type AgentConversation } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { StepItem } from './step-item';

/** One conversation: who, what it cost, and every step the agent took, ending with who confirmed. */
export function ConversationDetail({ conversation }: { conversation: AgentConversation }) {
  const t = useTranslations('admin.agent');
  const locale = useLocale();
  const { customer, orderId, steps } = conversation;

  const stats = [
    { label: t('model'), value: <bdi dir="ltr">{conversation.model}</bdi> },
    { label: t('tokens'), value: formatNumber(conversation.tokens, locale) },
    { label: t('cost'), value: formatMoney(conversation.cost, locale) },
    {
      label: t('time'),
      value: t('seconds', { value: formatNumber(conversation.ms / 1000, locale, 1) }),
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="conversation" className="text-title-md">
            {t('conversationWith', { name: customer ?? t('guest') })}
          </h2>
          <span className="text-caption text-muted">
            {t('meta', {
              time: formatTime(conversation.startedAt),
              steps: t('steps', { count: steps.length }),
            })}
          </span>
        </div>
        {orderId && (
          <Link
            href={{ pathname: '/admin/orders', query: { q: orderId } }}
            className={buttonVariants({ variant: 'tonal', size: 'sm' })}
          >
            {/* One span, so the button's flex gap doesn't split the sentence from the number. */}
            <span>
              {t.rich('openOrder', {
                id: `#${orderId}`,
                order: (chunks) => <bdi dir="ltr">{chunks}</bdi>,
              })}
            </span>
          </Link>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 rounded-18 bg-surface-2 px-3.5 py-3">
            <dt className="text-caption text-muted">{stat.label}</dt>
            <dd className="truncate text-title-md">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <ol aria-labelledby="conversation" className="flex flex-col">
        {steps.map((step, index) => (
          <StepItem key={index} step={step} last={index === steps.length - 1} />
        ))}
      </ol>
    </>
  );
}
