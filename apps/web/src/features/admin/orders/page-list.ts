export type PageItem = number | 'gap';

/**
 * The page buttons to show: always the first and last, plus the current page and its neighbours, with a gap
 * where pages are skipped. (1 of 129) → 1 2 … 129; (7 of 129) → 1 … 6 7 8 … 129.
 */
export function pageList(page: number, pageCount: number): PageItem[] {
  const wanted = new Set(
    [1, pageCount, page - 1, page, page + 1, page === 1 ? 3 : 0].filter(
      (n) => n >= 1 && n <= pageCount,
    ),
  );
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((n, index) => {
    const previous = sorted[index - 1];
    if (previous === undefined || n === previous + 1) return [n];
    // A gap of exactly one page shows that page instead of «…».
    return n === previous + 2 ? [previous + 1, n] : ['gap' as const, n];
  });
}
