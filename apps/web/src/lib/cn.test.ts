import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('keeps a font size and a text color together', () => {
    expect(cn('text-body-md', 'text-ink')).toBe('text-body-md text-ink');
    expect(cn('text-ink-2', 'text-title-lg')).toBe('text-ink-2 text-title-lg');
  });

  it('lets the later class win within the same group', () => {
    expect(cn('text-body-md', 'text-title-md')).toBe('text-title-md');
    expect(cn('bg-surface', 'bg-primary')).toBe('bg-primary');
    expect(cn('rounded-card', 'rounded-full')).toBe('rounded-full');
    expect(cn('rounded-control', 'shadow-card')).toBe('rounded-control shadow-card');
    expect(cn('shadow-card', 'shadow-float')).toBe('shadow-float');
    expect(cn('text-on-primary', 'text-ink-2')).toBe('text-ink-2');
  });

  it('drops falsy values', () => {
    expect(cn('p-4', false, undefined, 'gap-2')).toBe('p-4 gap-2');
  });
});
