import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('keeps a font size and a text color together', () => {
    expect(cn('text-15', 'text-ink')).toBe('text-15 text-ink');
  });

  it('lets the later class win within the same group', () => {
    expect(cn('text-15', 'text-17')).toBe('text-17');
    expect(cn('bg-surface', 'bg-primary')).toBe('bg-primary');
    expect(cn('rounded-26', 'rounded-full')).toBe('rounded-full');
    expect(cn('shadow-card', 'shadow-float')).toBe('shadow-float');
    expect(cn('text-on-primary', 'text-ink-2')).toBe('text-ink-2');
  });

  it('drops falsy values', () => {
    expect(cn('p-4', false, undefined, 'gap-2')).toBe('p-4 gap-2');
  });
});
