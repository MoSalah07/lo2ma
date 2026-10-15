'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/** What a screen shows while its data loads: a few placeholder blocks and a hidden "loading" for screen readers. */
export function LoadingBlocks({ count = 3 }: { count?: number }) {
  const t = useTranslations('common');
  return (
    <div role="status" className="flex flex-col gap-3">
      <span className="sr-only">{t('loading')}</span>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-24 rounded-24" />
      ))}
    </div>
  );
}

/** A failed request: a short message and a retry button. */
export function ErrorMessage({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const t = useTranslations('common');
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-15 text-ink-2">{message ?? t('error')}</p>
      {onRetry && (
        <Button variant="tonal" size="sm" onClick={onRetry}>
          {t('retry')}
        </Button>
      )}
    </div>
  );
}
