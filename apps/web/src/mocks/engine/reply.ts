import type { Locale } from '@lo2ma/i18n';

// Replies the mock agent writes. In phase 3 the real LLM writes these, so they live with the mocks, not in
// @lo2ma/i18n (which holds the app's own interface text).

const arCount = (count: number) =>
  count === 1 ? 'اختيار واحد' : count === 2 ? 'اختيارين' : `${count} اختيارات`;

/** `fit`: the user has a fit goal, so the first meal is the closest to it rather than the cheapest. */
export function replyText(
  locale: Locale,
  found: number,
  askedForBudget: boolean,
  fit = false,
): string {
  if (locale === 'ar') {
    if (askedForBudget) return 'معاك كام النهارده؟ قولّي الميزانية وأنا أختارلك.';
    if (found === 0) return 'مالقيتش حاجة على قد الطلب ده. جرّب تزوّد الميزانية شوية أو تشيل شرط.';
    if (fit) {
      return found === 1
        ? `لقيت ${arCount(found)} قريب من هدفك:`
        : `لقيت ${arCount(found)} قريبة من هدفك. ده أقربهم:`;
    }
    return found === 1
      ? `لقيت ${arCount(found)} قريب:`
      : `لقيت ${arCount(found)} قريبة. ده أوفرهم:`;
  }
  if (askedForBudget) return "What's your budget today? Tell me and I'll pick for you.";
  if (found === 0)
    return "I couldn't find anything that fits. Try a slightly bigger budget or drop a filter.";
  if (fit) {
    return found === 1
      ? 'Found 1 option close to your goal:'
      : `Found ${found} options close to your goal. This one is the closest:`;
  }
  return found === 1
    ? 'Found 1 option nearby:'
    : `Found ${found} options nearby. This one is the best value:`;
}
