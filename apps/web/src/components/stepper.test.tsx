import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Stepper } from './stepper';

function Harness({ initial }: { initial: number }) {
  const [value, setValue] = useState(initial);
  return (
    <Stepper
      value={value}
      onChange={setValue}
      min={10000}
      max={50000}
      step={2500}
      format={(piasters) => `${piasters / 100} ج`}
      decreaseLabel="قلّل الميزانية"
      increaseLabel="زوّد الميزانية"
    />
  );
}

describe('Stepper', () => {
  it('moves by one step each way and shows the new value', async () => {
    const user = userEvent.setup();
    render(<Harness initial={15000} />);

    await user.click(screen.getByRole('button', { name: 'زوّد الميزانية' }));
    expect(screen.getByRole('status')).toHaveTextContent('175 ج');

    await user.click(screen.getByRole('button', { name: 'قلّل الميزانية' }));
    await user.click(screen.getByRole('button', { name: 'قلّل الميزانية' }));
    expect(screen.getByRole('status')).toHaveTextContent('125 ج');
  });

  it('cannot go under the minimum order', () => {
    render(<Harness initial={10000} />);
    expect(screen.getByRole('button', { name: 'قلّل الميزانية' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'زوّد الميزانية' })).toBeEnabled();
  });
});
