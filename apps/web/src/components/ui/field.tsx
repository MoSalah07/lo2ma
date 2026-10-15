import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { focusRing } from './focus';

interface ControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  /** Receives the ids that tie the control to its label, hint and error. */
  children: (control: ControlProps) => ReactNode;
}

/** A label, a control and an optional hint or error, wired up for screen readers. */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-13 font-semibold text-ink-2">
        {label}
      </label>
      {children({
        id,
        'aria-describedby': message ? messageId : undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {message && (
        <p id={messageId} className={cn('text-12', error ? 'text-on-danger' : 'text-muted')}>
          {message}
        </p>
      )}
    </div>
  );
}

export const inputClass = cn(
  'h-12 w-full rounded-16 bg-surface-2 px-4 text-15 text-ink placeholder:text-muted',
  'aria-invalid:ring-2 aria-invalid:ring-on-danger',
  focusRing,
);

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(inputClass, className)} {...props} />;
}
