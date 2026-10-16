import { EndCta } from '@/features/landing/end-cta';
import { Hero } from '@/features/landing/hero';
import { HowItWorks } from '@/features/landing/how-it-works';
import { LandingFooter } from '@/features/landing/landing-footer';
import { LandingHeader } from '@/features/landing/landing-header';
import { RulesSection } from '@/features/landing/rules-section';
import { WeekSection } from '@/features/landing/week-section';

/** The landing page. Everything is a Server Component; only the theme button runs in the browser. */
export default function HomePage() {
  return (
    <>
      <LandingHeader />
      <main className="flex flex-col">
        <Hero />
        <HowItWorks />
        <WeekSection />
        <RulesSection />
        <EndCta />
      </main>
      <LandingFooter />
    </>
  );
}
