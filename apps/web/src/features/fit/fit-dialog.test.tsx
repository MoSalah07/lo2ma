import type { CaloriePref } from '@lo2ma/core';
import { messages } from '@lo2ma/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FitDialog } from './fit-dialog';
import { useBodyProfile } from './profile-store';

const t = messages.ar.fit;

beforeEach(() => useBodyProfile.setState({ profile: null }));

function open(value: CaloriePref = { mode: 'around', kcal: 700 }) {
  const onConfirm = vi.fn();
  render(
    <NextIntlClientProvider locale="ar" messages={messages.ar}>
      <FitDialog open onOpenChange={vi.fn()} value={value} onConfirm={onConfirm} />
    </NextIntlClientProvider>,
  );
  return onConfirm;
}

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

/** The design canvas's example: a man of 28, 178 cm and 82 kg who trains 3 or 4 days a week. */
function fillOfficeMan(age = '28') {
  fireEvent.click(screen.getByRole('button', { name: t.sexes.male }));
  type(t.age, age);
  type(t.heightCm, '178');
  type(t.weightKg, '82');
}

const save = () => screen.getByRole('button', { name: t.save });

describe('FitDialog', () => {
  it('works out the canvas example and saves it with the goal behind it', () => {
    const onConfirm = open();
    expect(save()).toBeDisabled();
    expect(screen.getByText(t.fillToSee)).toBeInTheDocument();

    fillOfficeMan();
    expect(screen.getByText('780 سعر')).toBeInTheDocument();
    expect(screen.getByText('57 جم')).toBeInTheDocument();

    fireEvent.click(save());
    expect(onConfirm).toHaveBeenCalledWith({ mode: 'fit', goal: 'cut', kcal: 780, protein: 57 });
    expect(useBodyProfile.getState().profile).toEqual({
      sex: 'male',
      age: 28,
      heightCm: 178,
      weightKg: 82,
      training: 'moderate',
    });
  });

  it('reads Arabic-Indic digits', () => {
    open();
    type(t.age, '٢٨');
    expect(screen.getByLabelText(t.age)).toHaveValue('28');
  });

  it('shows every step of the calculation on request', () => {
    open();
    fillOfficeMan();
    fireEvent.click(screen.getByRole('button', { name: t.how }));
    expect(screen.getByText('تنشيف: أقل 20%')).toBeInTheDocument();
    expect(screen.getByText('2,230 سعر')).toBeInTheDocument();
  });

  it('does not offer cutting under 18', () => {
    open();
    fillOfficeMan('16');
    expect(screen.getByRole('status')).toHaveTextContent('التنشيف من 18 سنة');
    expect(save()).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /ثبات/ }));
    expect(screen.queryByText('التنشيف من 18 سنة')).not.toBeInTheDocument();
    expect(save()).toBeEnabled();
  });

  it('says what a field accepts once the user leaves it', () => {
    open();
    type(t.heightCm, '300');
    expect(screen.queryByText('اكتب رقم من 120 لـ 230')).not.toBeInTheDocument();
    fireEvent.blur(screen.getByLabelText(t.heightCm));
    expect(screen.getByText('اكتب رقم من 120 لـ 230')).toBeInTheDocument();
  });

  it('starts the steppers at the goal just worked out', () => {
    open();
    fillOfficeMan();
    fireEvent.click(screen.getByRole('button', { name: t.manual }));
    const [calories, protein] = screen.getAllByRole('status');
    expect(calories).toHaveTextContent('780 سعر');
    expect(protein).toHaveTextContent('57 جم');
  });

  it('opens a goal typed by hand on the steppers, and saves it without a goal', () => {
    const onConfirm = open({ mode: 'fit', kcal: 650, protein: 40 });
    expect(screen.getByRole('button', { name: t.manual })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: t.moreCalories }));
    fireEvent.click(save());
    expect(onConfirm).toHaveBeenCalledWith({ mode: 'fit', kcal: 700, protein: 40 });
  });

  it('remembers the body on this phone for next time', () => {
    useBodyProfile.setState({
      profile: { sex: 'female', age: 30, heightCm: 165, weightKg: 60, training: 'light' },
    });
    open();
    expect(screen.getByLabelText(t.weightKg)).toHaveValue('60');
    expect(screen.getByRole('button', { name: t.sexes.female })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(save()).toBeEnabled();
  });
});
