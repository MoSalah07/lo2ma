import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageSwitcher } from './language-switcher';

// The real navigation needs the Next.js router. A plain link shows where each option points.
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/chat',
  Link: ({ href, locale, children, ...props }: ComponentProps<'a'> & { locale: string }) => (
    <a href={`/${locale}${String(href)}`} {...props}>
      {children}
    </a>
  ),
}));

const options = [
  { locale: 'ar' as const, label: 'عربي' },
  { locale: 'en' as const, label: 'English' },
];

function renderIn(locale: 'ar' | 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={null}>
      <LanguageSwitcher label="اللغة" options={options} />
    </NextIntlClientProvider>,
  );
}

describe('LanguageSwitcher', () => {
  it('is a labelled navigation with a link to the same page in each language', () => {
    renderIn('ar');
    expect(screen.getByRole('navigation', { name: 'اللغة' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'عربي' })).toHaveAttribute('href', '/ar/chat');
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/en/chat');
  });

  it('marks the current language and tags each label with its own language', () => {
    renderIn('en');
    const english = screen.getByRole('link', { name: 'English' });
    expect(english).toHaveAttribute('aria-current', 'true');
    expect(english).toHaveAttribute('lang', 'en');
    expect(screen.getByRole('link', { name: 'عربي' })).not.toHaveAttribute('aria-current');
  });
});
