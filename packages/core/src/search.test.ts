import { describe, expect, it } from 'vitest';
import { foldForSearch, searchWords } from './search.ts';

describe('foldForSearch', () => {
  it('ignores how ة, ى and the alefs are written', () => {
    expect(foldForSearch('القريه الذكيه')).toBe(foldForSearch('القرية الذكية'));
    expect(foldForSearch('مستشفى')).toBe(foldForSearch('مستشفي'));
    expect(foldForSearch('أحمد إبراهيم آمال')).toBe('احمد ابراهيم امال');
  });

  it('drops harakat and tatweel', () => {
    expect(foldForSearch('مُحَمَّد')).toBe('محمد');
    expect(foldForSearch('مـــصـر')).toBe('مصر');
  });

  it('lower-cases Latin letters', () => {
    expect(foldForSearch('Smart VILLAGE B7')).toBe('smart village b7');
  });
});

describe('searchWords', () => {
  it('splits a query into folded words', () => {
    expect(searchWords('  القريه   B7 ')).toEqual(['القريه', 'b7']);
  });

  it('finds nothing to search in blank text', () => {
    expect(searchWords('   ')).toEqual([]);
  });
});
