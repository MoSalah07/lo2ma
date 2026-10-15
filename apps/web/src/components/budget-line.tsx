import { Meter } from '@/components/ui/meter';

interface BudgetLineProps {
  /** «من ميزانيتك». */
  label: string;
  /** «هيفضل معاك 50 ج». */
  remaining: string;
  /** Share of the budget used, 0 to 1. */
  ratio: number;
}

/** How much of the budget a meal uses: a caption and a bar. */
export function BudgetLine({ label, remaining, ratio }: BudgetLineProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between gap-2 text-12">
        <span className="text-muted">{label}</span>
        <span className="font-semibold">{remaining}</span>
      </div>
      <Meter value={ratio} label={label} />
    </div>
  );
}
