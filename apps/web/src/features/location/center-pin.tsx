import { cn } from '@/lib/cn';

/**
 * The pin at the map's center: the map moves under it, the way courier apps work, so placing it is one drag. Its
 * shadow marks the exact point, and it lifts off it while the map moves. Decorative: the address below says where.
 */
export function CenterPin({ lifted, className }: { lifted: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 grid place-items-center',
        className,
      )}
    >
      <span
        className={cn(
          'col-start-1 row-start-1 h-1.5 w-4 rounded-full bg-ink/25 transition-transform motion-reduce:transition-none',
          lifted && 'scale-75',
        )}
      />
      <span
        className={cn(
          'col-start-1 row-start-1 flex -translate-y-1/2 flex-col items-center transition-transform motion-reduce:transition-none',
          lifted && '-translate-y-3/4',
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-primary shadow-card ring-4 ring-surface">
          <span className="size-3 rounded-full bg-on-primary" />
        </span>
        <span className="h-4 w-1 rounded-b-full bg-primary" />
      </span>
    </div>
  );
}
