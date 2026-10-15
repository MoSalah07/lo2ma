'use client';

import { formatNumber } from '@lo2ma/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { IconButton } from '@/components/ui/icon-button';
import { focusRing } from '@/components/ui/focus';
import { cn } from '@/lib/cn';
import { pageList } from './page-list';

interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

/** Previous, the page numbers (with «…» for skipped ones), next. */
export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  const t = useTranslations('admin.orders');
  const locale = useLocale();
  if (pageCount <= 1) return null;

  return (
    <nav aria-label={t('pages')} className="flex items-center gap-1">
      <IconButton
        label={t('prev')}
        icon={ChevronLeft}
        flipInRtl
        variant="ghost"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      />
      {pageList(page, pageCount).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} aria-hidden className="w-7 text-center text-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={t('page', { page: formatNumber(item, locale) })}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onChange(item)}
            className={cn(
              'inline-flex size-11 items-center justify-center rounded-full text-13 tabular-nums transition-colors',
              item === page
                ? 'bg-inverse font-semibold text-on-inverse'
                : 'text-ink hover:bg-surface-2',
              focusRing,
            )}
          >
            {formatNumber(item, locale)}
          </button>
        ),
      )}
      <IconButton
        label={t('next')}
        icon={ChevronRight}
        flipInRtl
        variant="ghost"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      />
    </nav>
  );
}
