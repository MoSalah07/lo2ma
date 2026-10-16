import { CURRENCY_CODE } from '@lo2ma/core';
import { locales, regionTags, type Locale } from '@lo2ma/i18n/locales';
import type { Graph } from 'schema-dts';
import { localizedPath } from './metadata';
import { absoluteUrl } from './site';

/** What the home page says about Lo2ma, in one language. */
export interface HomeFacts {
  locale: Locale;
  brand: string;
  /** The brand in the other language («Lo2ma» for «لقمة»), so engines know both names are one thing. */
  alternateBrand: string;
  description: string;
  country: string;
  /** What it does, in the page's own words. */
  features: string[];
}

/** The square logo search engines show next to the name, made by `npm run images`. */
export const logoPath = '/icons/512.png';

/**
 * The home page's structured data: one graph of three linked things, who makes Lo2ma, the website and the web
 * app. Search engines read it for the site name and the logo; AI answers read it to tell what Lo2ma is and does,
 * in the same words the page shows.
 */
export function homeGraph(facts: HomeFacts): Graph {
  const organization = absoluteUrl('/#organization');
  const home = absoluteUrl(localizedPath(facts.locale));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organization,
        name: facts.brand,
        alternateName: facts.alternateBrand,
        url: absoluteUrl('/'),
        logo: absoluteUrl(logoPath),
        areaServed: { '@type': 'Country', name: facts.country },
      },
      {
        '@type': 'WebSite',
        '@id': absoluteUrl('/#website'),
        name: facts.brand,
        alternateName: facts.alternateBrand,
        url: absoluteUrl('/'),
        inLanguage: locales.map((locale) => regionTags[locale]),
        publisher: { '@id': organization },
      },
      {
        '@type': 'WebApplication',
        '@id': `${home}#app`,
        name: facts.brand,
        url: home,
        description: facts.description,
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web',
        inLanguage: regionTags[facts.locale],
        // Using Lo2ma is free; the food is paid to the restaurant.
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: 0, priceCurrency: CURRENCY_CODE },
        featureList: facts.features,
        publisher: { '@id': organization },
      },
    ],
  };
}
