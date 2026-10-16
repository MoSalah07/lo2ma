import { formatMoney, MIN_ORDER } from '@lo2ma/core';
import { Flame, ReceiptText, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { Section, SectionTitle } from './section';

const rules: { key: 'noAiPay' | 'calorieSource' | 'fullBill'; icon: LucideIcon; tile: string }[] = [
  { key: 'noAiPay', icon: ShieldCheck, tile: 'bg-tint text-on-tint' },
  { key: 'calorieSource', icon: Flame, tile: 'bg-lilac text-on-lilac' },
  { key: 'fullBill', icon: ReceiptText, tile: 'bg-pink text-on-pink' },
];

/** The product rules a visitor might doubt: the AI can't pay, calories have a source, the bill is complete. */
export function RulesSection() {
  const t = useTranslations('landing.rules');
  const locale = useLocale();

  return (
    <Section className="flex flex-col gap-7">
      <SectionTitle>{t('title')}</SectionTitle>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rules.map(({ key, icon: Icon, tile }) => (
          <li
            key={key}
            className="flex flex-col gap-3 rounded-28 bg-surface p-6 ring-1 ring-line ring-inset"
          >
            <span className={cn('flex size-11 items-center justify-center rounded-16', tile)}>
              <Icon aria-hidden className="size-5" />
            </span>
            <h3 className="text-18 leading-heading font-bold">{t(`${key}.title`)}</h3>
            <p className="text-15 leading-loose text-ink-2">
              {t(`${key}.body`, { amount: formatMoney(MIN_ORDER, locale) })}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
