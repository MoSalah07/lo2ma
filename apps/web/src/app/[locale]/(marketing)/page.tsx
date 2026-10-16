import { Reveal } from '@/components/motion/entrance';
import { EndCta } from '@/features/landing/end-cta';
import { Hero } from '@/features/landing/hero';
import { HowItWorks } from '@/features/landing/how-it-works';
import { LandingFooter } from '@/features/landing/landing-footer';
import { RulesSection } from '@/features/landing/rules-section';
import { WeekSection } from '@/features/landing/week-section';

/** The landing page. The sections are Server Components; the browser adds the theme button and the motion. */
export default function HomePage() {
  return (
    <>
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
