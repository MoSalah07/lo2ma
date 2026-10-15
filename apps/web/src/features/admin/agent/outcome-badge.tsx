'use client';

import type { AgentOutcome } from '@lo2ma/core';
import { useTranslations } from 'next-intl';
import { Badge, type BadgeProps } from '@/components/ui/badge';

const tones: Record<AgentOutcome, BadgeProps['tone']> = {
  ordered: 'good',
  plan: 'tint',
  noResults: 'warn',
  noOrder: 'neutral',
};

/** How a conversation ended: an order, a weekly plan, nothing found, or no order. */
export function OutcomeBadge({ outcome }: { outcome: AgentOutcome }) {
  const t = useTranslations('admin.agent.outcomes');
  return <Badge tone={tones[outcome]}>{t(outcome)}</Badge>;
}
