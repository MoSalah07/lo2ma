// Arabic marks people skip when typing (harakat, the dagger alef) and the tatweel that stretches words.
// Written as code points: most of them are invisible on their own.
const MARKS = /[\u064B-\u0670\u0640]/g;
// Alef with hamza above or below, with madda, and wasla.
const ALEF_FORMS = /[\u0623\u0625\u0622\u0671]/g;

/**
 * Text folded the way people type it, for search: lower case, no harakat or tatweel, every alef the same,
 * ى as ي and ة as ه. «القريه الذكيه» and «القرية الذكية» fold to the same text.
 */
export function foldForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(MARKS, '')
    .replace(ALEF_FORMS, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0629/g, '\u0647');
}

/** The words of a search query, folded. Every one of them must be found. */
export function searchWords(query: string): string[] {
  return foldForSearch(query).split(/\s+/).filter(Boolean);
}
