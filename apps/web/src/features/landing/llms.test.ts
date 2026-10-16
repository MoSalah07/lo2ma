import { describe, expect, it } from 'vitest';
import type { LandingFacts } from './facts';
import { llmsTxt, type LlmsSection } from './llms';

const facts = (brand: string): LandingFacts => ({
  brand,
  description: `${brand} description`,
  country: 'country',
  subtitle: `${brand} subtitle`,
  demoNote: `${brand} demo note`,
  how: { title: 'How', items: [{ title: 'Say', body: 'Say what you have.' }] },
  week: { title: 'Week', body: 'Plan the week.' },
  rules: { title: 'Rules', items: [{ title: 'No AI pay', body: 'You pay, not the AI.' }] },
});

const section = (locale: 'ar' | 'en', brand: string): LlmsSection => ({
  locale,
  facts: facts(brand),
  language: `${locale} language`,
  pages: `${locale} pages`,
  home: `${locale} home`,
});

const text = llmsTxt([section('en', 'Lo2ma'), section('ar', 'لقمة')]);

describe('llms.txt', () => {
  it('starts as llmstxt.org asks: the name, then a one-line summary', () => {
    const [title, summary] = text.split('\n\n');
    expect(title).toBe('# Lo2ma / لقمة');
    expect(summary).toBe('> Lo2ma description');
  });

  it('lists the home page in every language with absolute links', () => {
    expect(text).toContain('## en pages');
    expect(text).toContain('- [en home](http://localhost:3000/en): Lo2ma description');
    expect(text).toContain('- [ar home](http://localhost:3000/ar): لقمة description');
  });

  it('says what Lo2ma does in each language, the lead one first', () => {
    expect(text.indexOf('## en language')).toBeLessThan(text.indexOf('## ar language'));
    expect(text).toContain('- **Say**: Say what you have.');
    expect(text).toContain('لقمة demo note');
    expect(text.endsWith('\n')).toBe(true);
  });
});
