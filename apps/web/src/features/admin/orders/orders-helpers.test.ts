import { describe, expect, it } from 'vitest';
import { toCsv } from './orders-csv';
import { pageList } from './page-list';

describe('pageList', () => {
  it('shows the first pages and the last one, like the design', () => {
    expect(pageList(1, 129)).toEqual([1, 2, 3, 'gap', 129]);
  });

  it('keeps the current page and its neighbours in the middle', () => {
    expect(pageList(7, 129)).toEqual([1, 'gap', 6, 7, 8, 'gap', 129]);
    expect(pageList(129, 129)).toEqual([1, 'gap', 128, 129]);
  });

  it('shows a single skipped page instead of a gap, and handles tiny counts', () => {
    expect(pageList(4, 6)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(pageList(1, 1)).toEqual([1]);
    expect(pageList(1, 0)).toEqual([]);
  });
});

describe('toCsv', () => {
  it('quotes cells with commas, quotes or line breaks, and starts with a BOM for Excel', () => {
    const csv = toCsv(['الأوردر', 'العميل'], [['LQ-1', 'Omar "Oz", Jr.']]);
    expect(csv).toBe('﻿الأوردر,العميل\r\nLQ-1,"Omar ""Oz"", Jr."');
  });
});
