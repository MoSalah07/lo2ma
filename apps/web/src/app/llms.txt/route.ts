import type { Locale } from '@lo2ma/i18n/locales';
import { getTranslations } from 'next-intl/server';
import { landingFacts } from '@/features/landing/facts';
import { llmsTxt, type LlmsSection } from '@/features/landing/llms';

// Built once at build time, like the landing page it describes.
export const dynamic = 'force-static';

async function section(locale: Locale): Promise<LlmsSection> {
  const t = await getTranslations({ locale, namespace: 'seo.llms' });
  return {
    locale,
    facts: await landingFacts(locale),
    language: t('language'),
    pages: t('pages'),
    home: t('home'),
  };
}

/** /llms.txt for AI assistants. English leads: it is the language every model reads best; Arabic follows. */
export async function GET() {
  const body = llmsTxt([await section('en'), await section('ar')]);
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
