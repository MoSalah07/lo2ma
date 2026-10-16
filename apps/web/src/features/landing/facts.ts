import { formatMoney, formatTime, MIN_ORDER, PLAN_CHANGE_CUTOFF } from '@lo2ma/core';
import type { Locale } from '@lo2ma/i18n/locales';
import { getTranslations } from 'next-intl/server';

/** The three steps of «how it works» and the three rules, in the order the page shows them. */
export const stepKeys = ['say', 'pick', 'pay'] as const;
export const ruleKeys = ['noAiPay', 'calorieSource', 'fullBill'] as const;
export type StepKey = (typeof stepKeys)[number];
export type RuleKey = (typeof ruleKeys)[number];

/** Values the landing's messages are filled with, so every place says the same amount and time. */
export const landingValues = (locale: Locale) => ({
  amount: formatMoney(MIN_ORDER, locale),
  time: formatTime(PLAN_CHANGE_CUTOFF),
});

/**
 * What the landing page says Lo2ma is, does and promises, as plain text in one language: for the structured data
 * and llms.txt, so machines read exactly what people read. Server only.
 */
export async function landingFacts(locale: Locale) {
  const t = await getTranslations({ locale });
  const values = landingValues(locale);
  return {
    brand: t('common.brand'),
    description: t('seo.description'),
    country: t('seo.country'),
    subtitle: t('landing.subtitle'),
    demoNote: t('landing.demoNote'),
    how: {
      title: t('landing.how.title'),
      items: stepKeys.map((key) => ({
        title: t(`landing.how.${key}.title`),
        body: t(`landing.how.${key}.body`),
      })),
    },
    week: { title: t('landing.week.title'), body: t('landing.week.body', values) },
    rules: {
      title: t('landing.rules.title'),
      items: ruleKeys.map((key) => ({
        title: t(`landing.rules.${key}.title`),
        body: t(`landing.rules.${key}.body`, values),
      })),
    },
  };
}

export type LandingFacts = Awaited<ReturnType<typeof landingFacts>>;
