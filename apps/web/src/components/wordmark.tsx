import { cn } from '@/lib/cn';

const sizes = {
  sm: { text: 'text-headline-sm', dot: 'size-2' },
  md: { text: 'text-headline-sm', dot: 'size-2' },
  lg: { text: 'text-headline-md', dot: 'size-2.5' },
  /** The sign-in screen, where the brand is the picture. */
  xl: { text: 'text-display-md', dot: 'size-3' },
};

interface WordmarkProps {
  name: string;
  size?: keyof typeof sizes;
}

/** «لقمة» followed by the brand-colored dot. */
export function Wordmark({ name, size = 'md' }: WordmarkProps) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={cn('leading-none', sizes[size].text)}>{name}</span>
      <span aria-hidden className={cn('rounded-full bg-primary', sizes[size].dot)} />
    </span>
  );
}
