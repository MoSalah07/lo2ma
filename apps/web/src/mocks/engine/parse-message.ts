import { fromPounds, type Ingredient, type Piasters } from '@lo2ma/core';

// A stand-in for the LLM until phase 3: reads a budget, calories and foods to avoid from one message.

export interface ParsedMessage {
  budget?: Piasters;
  caloriesMax?: number;
  exclusions: Ingredient[];
  wantsLighter: boolean;
  wantsCheaper: boolean;
  wantsPlan: boolean;
}

const INGREDIENT_WORDS: Record<Ingredient, RegExp> = {
  chicken: /فراخ|فرخة|دجاج|chicken/i,
  beef: /لحمة|لحم|beef|meat/i,
  fish: /سمك|جمبري|fish|seafood|shrimp/i,
  nuts: /مكسرات|nuts?/i,
  dairy: /ألبان|البان|لبن|جبن|dairy|milk|cheese/i,
};

const NEGATION = /(مش|من غير|بدون|بلاش|ماعدا|no|without|not|don'?t|avoid)[\s\S]{0,20}$/i;
const CALORIE_UNIT = /^\s*(سعر|سعرة|كالوري|kcal|cal|calories)/i;
const ARABIC_INDIC = /[٠-٩]/g;

const toLatinDigits = (text: string) =>
  text.replace(ARABIC_INDIC, (digit) => String(digit.charCodeAt(0) - 0x0660));

export function parseMessage(raw: string): ParsedMessage {
  const text = toLatinDigits(raw);
  const result: ParsedMessage = {
    exclusions: [],
    wantsLighter: /أخف|خفيف|light/i.test(text),
    wantsCheaper: /أرخص|cheaper|cheap/i.test(text),
    wantsPlan: /خطة|الأسبوع|week|plan/i.test(text),
  };

  for (const match of text.matchAll(/\d+/g)) {
    const value = Number(match[0]);
    const after = text.slice((match.index ?? 0) + match[0].length);
    if (CALORIE_UNIT.test(after)) result.caloriesMax ??= value;
    else if (value >= 50) result.budget ??= fromPounds(value);
  }

  for (const [ingredient, pattern] of Object.entries(INGREDIENT_WORDS) as [Ingredient, RegExp][]) {
    const match = pattern.exec(text);
    if (match && NEGATION.test(text.slice(0, match.index))) result.exclusions.push(ingredient);
  }

  return result;
}
