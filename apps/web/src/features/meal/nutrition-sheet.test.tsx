import type { MealBreakdown, Suggestion } from '@lo2ma/core';
import { messages } from '@lo2ma/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMealBreakdown, useReportNutrition } from './api';
import { NutritionSheet } from './nutrition-sheet';

vi.mock('./api', () => ({ useMealBreakdown: vi.fn(), useReportNutrition: vi.fn() }));

const t = messages.ar.meal;

const meal: Suggestion = {
  id: 'r02.m1.m4',
  restaurant: {
    id: 'r02',
    name: { ar: 'مشويات الدار', en: 'Mashweyat El Dar' },
    distanceKm: 2.1,
    etaMinutes: 20,
    deliveryFee: 2000,
  },
  items: [],
  bill: { food: 16500, delivery: 2000, service: 1000, total: 19500 },
  kcal: 750,
  kcalSource: 'ai',
  kcalRange: { low: 660, high: 850 },
  macros: { protein: 46, carbs: 62, fat: 33 },
  bestValue: false,
};

const breakdown: MealBreakdown = {
  dishes: [
    {
      id: 'r02-m1',
      name: { ar: 'كفتة مشوية + رز', en: 'Grilled kofta + rice' },
      quantity: 1,
      kcal: 690,
      kcalSource: 'ai',
      kcalRange: { low: 600, high: 790 },
      lines: [
        { name: { ar: 'كفتة لحمة', en: 'Beef kofta' }, grams: 175, kcal: 430, protein: 35 },
        {
          name: { ar: 'رز أبيض مطبوخ', en: 'Cooked white rice' },
          grams: 195,
          kcal: 255,
          protein: 5,
        },
      ],
    },
    {
      id: 'r02-m4',
      name: { ar: 'سلطة طحينة', en: 'Tahini salad' },
      quantity: 1,
      kcal: 60,
      kcalSource: 'restaurant',
      lines: [],
    },
  ],
};

const report = { mutate: vi.fn(), isPending: false, isSuccess: false };

beforeEach(() => {
  vi.mocked(useMealBreakdown).mockReturnValue({
    data: breakdown,
    isPending: false,
    isError: false,
  } as ReturnType<typeof useMealBreakdown>);
  vi.mocked(useReportNutrition).mockReturnValue(
    report as unknown as ReturnType<typeof useReportNutrition>,
  );
  report.isSuccess = false;
  report.mutate.mockClear();
});

function open() {
  render(
    <NextIntlClientProvider locale="ar" messages={messages.ar}>
      <NutritionSheet meal={meal} open onOpenChange={vi.fn()} />
    </NextIntlClientProvider>,
  );
}

describe('NutritionSheet', () => {
  it('lists the foods of an estimated dish, and keeps a published one whole', () => {
    open();
    expect(screen.getByRole('dialog', { name: t.how })).toHaveAccessibleDescription(
      /بين 660 و850 سعر/,
    );
    const table = screen.getByRole('table', { name: 'كفتة مشوية + رز' });
    expect(table).toHaveTextContent('كفتة لحمة');
    expect(table).toHaveTextContent('175 جم');
    expect(screen.getByText(/الرقم من المطعم/)).toBeInTheDocument();
    expect(screen.getByText('حوالي 750 سعر · 46 جم')).toBeInTheDocument();
  });

  it('sends a report when the dish came different', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: t.report }));
    expect(report.mutate).toHaveBeenCalledOnce();
  });

  it('says the report arrived', () => {
    report.isSuccess = true;
    open();
    expect(screen.getByRole('status')).toHaveTextContent(t.reported);
    expect(screen.queryByRole('button', { name: t.report })).not.toBeInTheDocument();
  });
});
