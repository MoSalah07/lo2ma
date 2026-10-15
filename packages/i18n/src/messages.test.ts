import {
  isArgumentElement,
  isDateElement,
  isNumberElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
  isTimeElement,
  parse,
  type MessageFormatElement,
} from '@formatjs/icu-messageformat-parser';
import { describe, expect, it } from 'vitest';
import { intlLocales, locales, type Locale } from './locales.ts';
import { messages } from './messages.ts';

type Entry = [path: string, message: string];

function entries(node: unknown, prefix = ''): Entry[] {
  if (typeof node === 'string') return [[prefix, node]];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, child]) =>
    entries(child, prefix ? `${prefix}.${key}` : key),
  );
}

interface Shape {
  args: string[];
  tags: string[];
  plurals: Record<string, string[]>;
}

/** Reads a message the way next-intl does and lists its arguments, rich-text tags and plural forms. */
function shapeOf(message: string): Shape {
  const args = new Set<string>();
  const tags = new Set<string>();
  const plurals: Record<string, string[]> = {};

  const walk = (elements: MessageFormatElement[]) => {
    for (const element of elements) {
      if (isTagElement(element)) {
        tags.add(element.value);
        walk(element.children);
      } else if (isPluralElement(element) || isSelectElement(element)) {
        args.add(element.value);
        if (isPluralElement(element)) plurals[element.value] = Object.keys(element.options);
        for (const option of Object.values(element.options)) walk(option.value);
      } else if (
        isArgumentElement(element) ||
        isNumberElement(element) ||
        isDateElement(element) ||
        isTimeElement(element)
      ) {
        args.add(element.value);
      }
    }
  };

  walk(parse(message));
  return { args: [...args].sort(), tags: [...tags].sort(), plurals };
}

// CLDR plural categories for each language, straight from Intl. "zero" may fall back to "other".
const requiredForms = Object.fromEntries(
  locales.map((locale) => [
    locale,
    new Intl.PluralRules(intlLocales[locale])
      .resolvedOptions()
      .pluralCategories.filter((category) => category !== 'zero'),
  ]),
) as Record<Locale, string[]>;

const arEntries = entries(messages.ar);
const enByPath = new Map(entries(messages.en));

describe('messages', () => {
  it('has exactly the same keys in Arabic and English', () => {
    expect([...enByPath.keys()].sort()).toEqual(arEntries.map(([path]) => path).sort());
  });

  it.each(arEntries)('%s has the same placeholders and tags in both languages', (path, ar) => {
    const en = enByPath.get(path) ?? '';
    const arShape = shapeOf(ar);
    const enShape = shapeOf(en);
    expect(enShape.args).toEqual(arShape.args);
    expect(enShape.tags).toEqual(arShape.tags);
  });

  it.each(locales)('covers every %s plural form', (locale) => {
    for (const [path, message] of entries(messages[locale])) {
      for (const [arg, forms] of Object.entries(shapeOf(message).plurals)) {
        expect(forms, `${path} → {${arg}}`).toEqual(expect.arrayContaining(requiredForms[locale]));
      }
    }
  });
});
