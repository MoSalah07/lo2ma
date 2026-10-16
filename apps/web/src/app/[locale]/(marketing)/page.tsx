import { Reveal } from '@/components/motion/entrance';
import { EndCta } from '@/features/landing/end-cta';
import { Hero } from '@/features/landing/hero';
import { HowItWorks } from '@/features/landing/how-it-works';
import { LandingFooter } from '@/features/landing/landing-footer';
import { LandingHeader } from '@/features/landing/landing-header';
import { RulesSection } from '@/features/landing/rules-section';
import { WeekSection } from '@/features/landing/week-section';

/** The landing page. The sections are Server Components; the browser adds the theme button and the motion. */
export default function HomePage() {
  return (
    <>
      <LandingHeader />
      <main className="flex flex-col">
        <Hero />
        {/* The hero is the first paint and stays put; the sections below rise in as they scroll into view. */}
        <Reveal>
          <HowItWorks />
        </Reveal>
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
