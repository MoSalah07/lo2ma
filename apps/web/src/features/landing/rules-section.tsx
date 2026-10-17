import { Flame, ReceiptText, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { landingValues, ruleKeys, type RuleKey } from './facts';
import { Section, SectionTitle } from './section';

const looks: Record<RuleKey, { icon: LucideIcon; tile: string }> = {
  noAiPay: { icon: ShieldCheck, tile: 'bg-tint text-on-tint' },
  calorieSource: { icon: Flame, tile: 'bg-accent text-on-accent' },
  fullBill: { icon: ReceiptText, tile: 'bg-highlight text-on-highlight' },
};

/** The product rules a visitor might doubt: the AI can't pay, calories have a source, the bill is complete. */
export function RulesSection() {
  const t = useTranslations('landing.rules');
  const locale = useLocale();

  return (
    <Section className="flex flex-col gap-7">
      <SectionTitle>{t('title')}</SectionTitle>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ruleKeys.map((key) => {
          const { icon: Icon, tile } = looks[key];
          return (
            <li
              key={key}
              className="flex flex-col gap-3 rounded-28 bg-surface p-6 ring-1 ring-line ring-inset"
            >
              <span className={cn('flex size-11 items-center justify-center rounded-16', tile)}>
                <Icon aria-hidden className="size-5" />
              </span>
              <h3 className="text-title-md leading-heading">{t(`${key}.title`)}</h3>
              <p className="text-body-lg leading-loose text-ink-2">
                {t(`${key}.body`, landingValues(locale))}
              </p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
