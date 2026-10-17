import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

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
      <label htmlFor={id} className="text-label-md text-ink-2">
        {label}
      </label>
      {children({
        id,
        'aria-describedby': message ? messageId : undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {message && (
        <p id={messageId} className={cn('text-caption', error ? 'text-on-danger' : 'text-muted')}>
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * A text field: a hairline box that takes the brand color and a soft halo while you type in it. The halo is the
 * focus indicator, so it shows on a click as well as on Tab.
 */
export const inputClass = cn(
  'h-control-md w-full rounded-control border border-line bg-surface px-3.5 text-body-md text-ink outline-none',
  'transition-[border-color,box-shadow] placeholder:text-muted',
  'focus:border-primary focus:ring-3 focus:ring-primary/20',
  'aria-invalid:border-on-danger aria-invalid:ring-3 aria-invalid:ring-on-danger/15',
);

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(inputClass, className)} {...props} />;
}
