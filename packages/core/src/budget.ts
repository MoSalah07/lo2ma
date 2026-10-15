import { assertPiasters, type Piasters } from './money.ts';

export interface BudgetUsage {
  /** Negative when over budget. */
  remaining: Piasters;
  /** Share of the budget spent, from 0 to 1, for progress bars. */
  ratio: number;
  overBudget: boolean;
}

export function budgetUsage(budget: Piasters, spent: Piasters): BudgetUsage {
  assertPiasters(budget);
  assertPiasters(spent);
  if (budget <= 0) throw new RangeError(`Budget must be positive, got ${budget}`);

  return {
    remaining: budget - spent,
    ratio: Math.min(Math.max(spent / budget, 0), 1),
    overBudget: spent > budget,
  };
}
