'use client';

import { Search } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/cn';

interface SearchBoxProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** A pill search field with a hidden label, for the orders and agent-log lists. */
export function SearchBox({ label, placeholder, value, onChange, className }: SearchBoxProps) {
  const id = useId();
  return (
    <div
      className={cn(
        'flex h-12 items-center gap-2.5 rounded-full bg-surface-2 px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary',
        className,
      )}
    >
      <Search aria-hidden className="size-4.5 shrink-0 text-muted" />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-0 flex-1 bg-transparent text-14 text-ink outline-none placeholder:text-muted"
      />
    </div>
  );
}
