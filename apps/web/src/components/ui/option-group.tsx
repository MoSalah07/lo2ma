import { useId, type ReactNode } from 'react';

interface OptionGroupProps {
  /** «ميعاد البريك», «هدفك»: what the choices inside are about. */
  legend: string;
  /** A note at the end of the label's line, such as the minimum order. */
  aside?: string;
  children: ReactNode;
}

/** A labelled set of choices or controls. Screen readers name the group by its legend before reading the options. */
export function OptionGroup({ legend, aside, children }: OptionGroupProps) {
  const legendId = useId();
  return (
    <fieldset aria-labelledby={legendId} className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span id={legendId} className="text-label-md text-ink-2">
          {legend}
        </span>
        {aside && <span className="text-caption text-muted">{aside}</span>}
      </div>
      {children}
    </fieldset>
  );
}
