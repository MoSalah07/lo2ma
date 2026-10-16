import { Meter } from '@/components/ui/meter';
import { cn } from '@/lib/cn';

interface BudgetLineProps {
  /** «من ميزانيتك». */
  label: string;
  /** «هيفضل معاك 50 ج», or «650 من 700 ج» for a week. */
  remaining: string;
  /** Share of the budget used, 0 to 1. */
  ratio: number;
  /** The weekly plan shows the amount bigger. */
  size?: 'sm' | 'lg';
}

/** How much of the budget a meal or a week uses: a caption and a bar. */
export function BudgetLine({ label, remaining, ratio, size = 'sm' }: BudgetLineProps) {
  const large = size === 'lg';
  return (
    <div className={cn('flex flex-col', large ? 'gap-2.5' : 'gap-1.5')}>
      <div className={cn('flex justify-between gap-2 text-12', large && 'items-baseline')}>
        <span className="text-muted">{label}</span>
        <span className={large ? 'text-16 font-bold' : 'font-semibold'}>{remaining}</span>
      </div>
      <Meter value={ratio} label={label} />
    </div>
  );
}
