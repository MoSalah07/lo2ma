import type { Locale } from '@lo2ma/i18n/locales';
import { localizedPath } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/site';
import type { LandingFacts } from './facts';

/** One language's version of the site, with the headings the `seo.llms` messages give it. */
export interface LlmsSection {
  locale: Locale;
  facts: LandingFacts;
  /** «In English», «بالعربي». */
  language: string;
  /** «Pages», «الصفحات». */
  pages: string;
  /** «Home page in English». */
  home: string;
}

const list = (items: { title: string; body: string }[]) =>
  items.map(({ title, body }) => `- **${title}**: ${body}`).join('\n');

/**
 * llms.txt (llmstxt.org): the site in plain Markdown for AI assistants and agents, which read it faster and more
 * reliably than a page full of markup. The name, a one-line summary, the pages, then what Lo2ma does and
 * promises in each language, in the landing page's own words. The first section leads.
 */
export function llmsTxt([lead, ...rest]: [LlmsSection, ...LlmsSection[]]): string {
  const sections = [lead, ...rest];
  const blocks = [
    `# ${sections.map((section) => section.facts.brand).join(' / ')}`,
    `> ${lead.facts.description}`,
    `## ${lead.pages}`,
    sections
      .map(
        ({ locale, home, facts }) =>
          `- [${home}](${absoluteUrl(localizedPath(locale))}): ${facts.description}`,
      )
      .join('\n'),
    ...sections.flatMap(({ language, facts }) => [
      `## ${language}`,
      facts.subtitle,
      facts.demoNote,
      `### ${facts.how.title}`,
      list(facts.how.items),
      `### ${facts.week.title}`,
      facts.week.body,
      `### ${facts.rules.title}`,
      list(facts.rules.items),
    ]),
  ];
  return `${blocks.join('\n\n')}\n`;
}
