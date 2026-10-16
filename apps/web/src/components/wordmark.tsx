import { cn } from '@/lib/cn';

const sizes = {
  sm: { text: 'text-24', dot: 'size-2' },
  md: { text: 'text-26', dot: 'size-2' },
  lg: { text: 'text-30', dot: 'size-2.5' },
};

interface WordmarkProps {
  name: string;
  size?: keyof typeof sizes;
}

/** «لقمة» followed by the brand-colored dot. */
export function Wordmark({ name, size = 'md' }: WordmarkProps) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={cn('leading-none font-extrabold', sizes[size].text)}>{name}</span>
      <span aria-hidden className={cn('rounded-full bg-primary', sizes[size].dot)} />
    </span>
  );
}
