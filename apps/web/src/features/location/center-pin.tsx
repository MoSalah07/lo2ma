import { cn } from '@/lib/cn';

interface CenterPinProps {
  lifted: boolean;
  /** A short note over the pin while it rests: what to do with the map. */
  hint?: string;
  className?: string;
}

const lift = 'transition motion-reduce:transition-none';

/**
 * The pin at the map's center: the map moves under it, the way courier apps work, so placing it is one drag. Its
 * shadow marks the exact point, and it lifts off it while the map moves. Everything sits in one grid cell, so it
 * is centered the same way in both directions. Decorative: the sheet says where the pin is.
 */
export function CenterPin({ lifted, hint, className }: CenterPinProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 grid place-items-center *:col-start-1 *:row-start-1',
        className,
      )}
    >
      <span className={cn('h-1.5 w-4 rounded-full bg-ink/25', lift, lifted && 'scale-75')} />
      {/* The pin is 56 px tall and stands on the point: half its height up puts its tip on the center. */}
      <span
        className={cn(
          'flex -translate-y-7 flex-col items-center',
          lift,
          lifted && '-translate-y-10',
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-primary shadow-card ring-4 ring-surface">
          <span className="size-2.5 rounded-full bg-on-primary" />
        </span>
        <span className="h-4 w-1 rounded-b-full bg-primary" />
      </span>
      {hint && (
        // Over the pin's head with a gap, and gone while the map moves.
        <span
          className={cn(
            '-translate-y-20 rounded-full bg-inverse px-3 py-1.5 text-center text-12 font-medium whitespace-nowrap text-on-inverse shadow-card',
            lift,
            lifted && 'opacity-0',
          )}
        >
          {hint}
        </span>
      )}
    </div>
  );
}
