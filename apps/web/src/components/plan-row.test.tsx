import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlanRow } from './plan-row';

describe('PlanRow', () => {
  it('shows the weekday above the day of the month, then the meal and its line', () => {
    render(<PlanRow weekday="الأحد" day="18" meal="كشري كبير + سلطة" meta="105 ج" />);

    const weekday = screen.getByText('الأحد');
    const day = screen.getByText('18');
    expect(weekday.compareDocumentPosition(day) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('كشري كبير + سلطة')).toBeInTheDocument();
    expect(screen.getByText('105 ج')).toBeInTheDocument();
  });

  it('puts the action at the end of the row', () => {
    render(
      <PlanRow weekday="Wed" day="21" meal="Tuna salad" meta="Ordering at 12:30">
        <button type="button">Swap</button>
      </PlanRow>,
    );

    const meal = screen.getByText('Tuna salad');
    const swap = screen.getByRole('button', { name: 'Swap' });
    expect(meal.compareDocumentPosition(swap) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
