import { describe, expect, it } from 'vitest';
import { homeGraph } from './structured-data';

const graph = homeGraph({
  locale: 'ar',
  brand: 'لقمة',
  alternateBrand: 'Lo2ma',
  description: 'وصف',
  country: 'مصر',
  features: ['أولًا', 'تانيًا'],
});
const organization = 'http://localhost:3000/#organization';

describe('the home page structured data', () => {
  it('describes the organization, the website and the web app in one graph', () => {
    expect(graph['@context']).toBe('https://schema.org');
    expect(graph['@graph']).toHaveLength(3);
  });

  it('names the organization in both languages, with an absolute logo', () => {
    expect(graph['@graph'][0]).toMatchObject({
      '@type': 'Organization',
      '@id': organization,
      name: 'لقمة',
      alternateName: 'Lo2ma',
      logo: 'http://localhost:3000/icons/512.png',
      areaServed: { '@type': 'Country', name: 'مصر' },
    });
  });

  it('links the website and the app to it by id, so engines read one entity', () => {
    expect(graph['@graph'][1]).toMatchObject({
      '@type': 'WebSite',
      inLanguage: ['ar-EG', 'en-EG'],
      publisher: { '@id': organization },
    });
    expect(graph['@graph'][2]).toMatchObject({
      '@type': 'WebApplication',
      publisher: { '@id': organization },
    });
  });

  it('says the app is free, in Egyptian pounds, with the features the page lists', () => {
    expect(graph['@graph'][2]).toMatchObject({
      url: 'http://localhost:3000/ar',
      inLanguage: 'ar-EG',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: 0, priceCurrency: 'EGP' },
      featureList: ['أولًا', 'تانيًا'],
    });
  });
});
