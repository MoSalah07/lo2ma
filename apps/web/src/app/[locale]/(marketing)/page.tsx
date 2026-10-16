import { locales } from '@lo2ma/i18n/locales';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { JsonLd } from '@/components/json-ld';
import { Reveal } from '@/components/motion/entrance';
import { EndCta } from '@/features/landing/end-cta';
import { landingFacts } from '@/features/landing/facts';
import { Hero } from '@/features/landing/hero';
import { HowItWorks } from '@/features/landing/how-it-works';
import { LandingFooter } from '@/features/landing/landing-footer';
import { RulesSection } from '@/features/landing/rules-section';
import { WeekSection } from '@/features/landing/week-section';
import { publicPageMetadata } from '@/lib/seo/metadata';
import { homeGraph } from '@/lib/seo/structured-data';
import { seoText } from '@/lib/seo/text';

/** The one page search engines list, in each language. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return publicPageMetadata(locale, '', await seoText(locale));
}

/** The landing page. The sections are Server Components; the browser adds the theme button and the motion. */
export default async function HomePage() {
  const locale = await getLocale();
  const facts = await landingFacts(locale);
  const other = locales.find((option) => option !== locale) ?? locale;
  const otherCommon = await getTranslations({ locale: other, namespace: 'common' });

  return (
    <>
      <JsonLd
        data={homeGraph({
          locale,
          brand: facts.brand,
          alternateBrand: otherCommon('brand'),
          description: facts.description,
          country: facts.country,
          features: [...facts.how.items, ...facts.rules.items].map((item) => item.body),
        })}
      />
      <main className="flex flex-col">
        <Hero />
        {/* The hero is the first paint and stays put; the rest rises in as it scrolls into view. */}
        <HowItWorks />
        <Reveal>
          <WeekSection />
        </Reveal>
        <Reveal>
          <RulesSection />
        </Reveal>
        <Reveal>
          <EndCta />
        </Reveal>
      </main>
      <LandingFooter />
    </>
  );
}
