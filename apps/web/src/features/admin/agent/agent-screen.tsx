'use client';

import { agentFilterSchema, formatMoney, formatTime, type AgentFilter } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { focusRing } from '@/components/ui/focus';
import { cn } from '@/lib/cn';
import { setUrlParams, useUrlParam } from '@/lib/use-url-params';
import { useConversation, useConversations } from '../api';
import { PageHeader } from '../page-header';
import { SearchBox } from '../search-box';
import { useDebounced } from '@/lib/use-debounced';
import { ConversationDetail } from './conversation-detail';
import { OutcomeBadge } from './outcome-badge';

export function AgentScreen() {
  const t = useTranslations('admin.agent');
  const locale = useLocale();
  const param = useUrlParam();

  const [search, setSearch] = useState(param('q') ?? '');
  const q = useDebounced(search.trim());
  const filter = agentFilterSchema.catch('all').parse(param('filter'));

  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get('q') ?? '';
    if (q !== current) setUrlParams({ q: q || undefined });
  }, [q]);

  const list = useConversations(filter, param('q') ?? '');
  // Without a choice in the URL, the newest conversation is open.
  const selectedId = param('id') ?? list.data?.[0]?.id;
  const conversation = useConversation(selectedId);

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <Card
          role="region"
          aria-label={t('list')}
          className="flex w-full min-w-0 flex-col gap-3 rounded-26 p-3.5 lg:w-80 lg:shrink-0"
        >
          <SearchBox
            label={t('search')}
            placeholder={t('search')}
            value={search}
            onChange={setSearch}
          />
          <div role="group" aria-label={t('filter')} className="flex flex-wrap gap-1.5">
            {(['all', 'issues', 'ordered'] as const satisfies AgentFilter[]).map((option) => (
              <Chip
                key={option}
                pressed={filter === option}
                onClick={() => setUrlParams({ filter: option === 'all' ? undefined : option })}
                className="px-3.5 text-13 font-semibold"
              >
                {t(`filters.${option}`)}
              </Chip>
            ))}
          </div>

          {list.isError && <ErrorMessage onRetry={() => void list.refetch()} />}
          {list.isPending && <LoadingBlocks />}
          {list.data?.length === 0 && (
            <p className="py-6 text-center text-14 text-muted">{t('empty')}</p>
          )}
          <ul className="flex flex-col gap-1">
            {list.data?.map((item) => {
              const current = item.id === selectedId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={current || undefined}
                    onClick={() => setUrlParams({ id: item.id }, 'push')}
                    className={cn(
                      'flex w-full flex-col gap-1.5 rounded-18 p-3 text-start transition-colors',
                      current
                        ? 'bg-surface shadow-float ring-1 ring-line ring-inset'
                        : 'hover:bg-surface-2',
                      focusRing,
                    )}
                  >
                    <span className="flex justify-between gap-2 text-13">
                      <bdi className="font-bold">{item.customer ?? t('guest')}</bdi>
                      <span className="text-muted tabular-nums">{formatTime(item.startedAt)}</span>
                    </span>
                    <span dir="auto" className="truncate text-start text-13 text-ink-2">
                      {item.firstMessage}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <OutcomeBadge outcome={item.outcome} />
                      <span className="text-12 text-muted">{formatMoney(item.cost, locale)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="flex w-full min-w-0 flex-1 flex-col gap-4.5 rounded-26 p-5">
          {conversation.isError && <ErrorMessage onRetry={() => void conversation.refetch()} />}
          {conversation.isLoading && <LoadingBlocks />}
          {conversation.data && <ConversationDetail conversation={conversation.data} />}
        </Card>
      </div>
    </>
  );
}
