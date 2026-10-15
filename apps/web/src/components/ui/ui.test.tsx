import { render, screen } from '@testing-library/react';
import { X } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Button, buttonVariants } from './button';
import { Chip } from './chip';
import { Field, Input } from './field';
import { IconButton } from './icon-button';
import { Meter } from './meter';

describe('Button', () => {
  it('is a plain button by default, so it never submits a form by accident', () => {
    render(<Button>يلا نبدأ</Button>);
    expect(screen.getByRole('button', { name: 'يلا نبدأ' })).toHaveAttribute('type', 'button');
  });

  it('lets a later class override the variant default', () => {
    const classes = buttonVariants({ variant: 'link', size: 'sm', className: 'px-0' }).split(' ');
    expect(classes).toContain('px-0');
    expect(classes).not.toContain('px-4');
  });
});

describe('IconButton', () => {
  it('takes its accessible name from the label and hides the icon from screen readers', () => {
    const { container } = render(<IconButton label="قفل" icon={X} />);
    expect(screen.getByRole('button', { name: 'قفل' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Chip', () => {
  it('only reports a pressed state when it is a toggle', () => {
    render(
      <>
        <Chip pressed>1:30</Chip>
        <Chip pressed={false}>2:00</Chip>
        <Chip>أرخص من كده</Chip>
      </>,
    );
    expect(screen.getByRole('button', { name: '1:30' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '2:00' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'أرخص من كده' })).not.toHaveAttribute('aria-pressed');
  });
});

describe('Meter', () => {
  it('exposes the share as a percentage and clamps it to 0–100', () => {
    render(
      <>
        <Meter value={0.75} label="من ميزانيتك" />
        <Meter value={1.4} label="أكتر من الميزانية" />
      </>,
    );
    expect(screen.getByRole('meter', { name: 'من ميزانيتك' })).toHaveAttribute(
      'aria-valuenow',
      '75',
    );
    expect(screen.getByRole('meter', { name: 'أكتر من الميزانية' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });
});

describe('Field', () => {
  it('ties the label to the control and describes it with the error', () => {
    render(
      <Field label="الإيميل" error="اكتب إيميل صح.">
        {(control) => <Input {...control} />}
      </Field>,
    );
    const input = screen.getByLabelText('الإيميل');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('اكتب إيميل صح.');
  });
});
