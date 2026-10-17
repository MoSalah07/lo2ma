import type { CalorieSource, MealNumbers } from '@lo2ma/core';
import { messages } from '@lo2ma/i18n';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { FitMatch } from './fit-match';

const goal = { kcal: 780, protein: 57 };

/** The canvas's steak: about 740 kcal (680–810), 54 g of protein. */
const steak: MealNumbers & { kcalSource: CalorieSource } = {
  kcal: 740,
  kcalSource: 'ai',
  kcalRange: { low: 680, high: 810 },
  macros: { protein: 54, carbs: 41, fat: 38 },
};

function show(meal = steak, detailed = false) {
  render(
    <NextIntlClientProvider locale="ar" messages={messages.ar}>
      <FitMatch meal={meal} goal={goal} detailed={detailed} />
    </NextIntlClientProvider>,
  );
}

describe('FitMatch', () => {
  it('measures the meal against the goal, as on the canvas', () => {
    show();
    expect(screen.getByText('في هدفك')).toBeInTheDocument();
    expect(screen.getByText('تقدير AI')).toBeInTheDocument();
    expect(screen.getByText('740 من 780 سعر')).toBeInTheDocument();
    expect(screen.getByText('54 من 57 جم')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'السعرات' })).toHaveAttribute('aria-valuenow', '95');
    expect(screen.getByText('كارب 41 جم · دهون 38 جم')).toBeInTheDocument();
  });

  it('says when the protein falls short, and has no estimate badge for a published number', () => {
    show({ ...steak, kcalSource: 'restaurant', macros: { ...steak.macros, protein: 42 } });
    expect(screen.getByText('بروتين أقل')).toBeInTheDocument();
    expect(screen.queryByText('تقدير AI')).not.toBeInTheDocument();
  });

  it('shows protein, carbs and fat as tiles on the meal screen', () => {
    show(steak, true);
    expect(screen.getByText('41 جم')).toBeInTheDocument();
    expect(screen.getByText('38 جم')).toBeInTheDocument();
  });
});
