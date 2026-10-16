import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';

/** The small pill above a landing heading. */
export function Eyebrow({ tone, children }: { tone: 'lilac' | 'pink'; children: ReactNode }) {
  return (
    <Badge tone={tone} className="h-7.5 px-3.5 text-13 font-medium">
      {children}
    </Badge>
  );
}
