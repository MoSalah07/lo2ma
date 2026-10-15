'use client';

import type { AdminOrderStatus } from '@lo2ma/core';
import { useTranslations } from 'next-intl';
import { Badge, type BadgeProps } from '@/components/ui/badge';

const tones: Record<AdminOrderStatus, BadgeProps['tone']> = {
  new: 'tint',
  preparing: 'lilac',
  onTheWay: 'inverse',
  delivered: 'good',
  late: 'warn',
  rejected: 'danger',
};

/** An order's status as a colored pill. The word carries the meaning; the color only helps scanning. */
export function StatusBadge({ status }: { status: AdminOrderStatus }) {
  const t = useTranslations('admin.status');
  return (
    <Badge tone={tones[status]} size="md">
      {t(status)}
    </Badge>
  );
}
