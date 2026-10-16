import type { MetadataRoute } from 'next';
import { absoluteUrl, indexable } from '@/lib/seo/site';

/**
 * The AI crawlers Lo2ma welcomes by name, both kinds: those that read pages to answer someone (ChatGPT, Claude and
 * Perplexity search) and those that teach models, so assistants know Lo2ma before they search. `*` already
 * allows them; naming them keeps the choice visible, and keeps it if `*` ever gets stricter.
 */
const AI_CRAWLERS = [
  // OpenAI: training, ChatGPT search, and pages a ChatGPT user opens.
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  // Anthropic, the same three roles.
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  // Gemini (Google Search itself is Googlebot, under `*`).
  'Google-Extended',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot-Extended',
  'Meta-ExternalAgent',
  'Amazonbot',
  'DuckAssistBot',
  // Common Crawl, the open web archive many models learn from.
  'CCBot',
];

/** Nothing for crawlers there: the API answers the app, not people. */
const PRIVATE = ['/api/'];

export default function robots(): MetadataRoute.Robots {
  // A Vercel preview must never show up in search results next to the real site.
  if (!indexable) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      // A crawler follows only its own group, so the named one repeats the same rules.
      { userAgent: AI_CRAWLERS, allow: '/', disallow: PRIVATE },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
