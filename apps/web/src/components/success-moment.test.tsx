import { act, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SuccessMoment } from './success-moment';

function moment(onDone: () => void) {
  return (
    <NextIntlClientProvider locale="ar" messages={null}>
      <SuccessMoment title="اتبعت للمطعم!" note="هتلاقيه في طلباتك" onDone={onDone} />
    </NextIntlClientProvider>
  );
}

async function wait(ms: number) {
  await act(() => vi.advanceTimersByTimeAsync(ms));
}

function setReducedMotion(reduce: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: reduce && query.includes('reduce'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
}

describe('SuccessMoment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // No WebGL in tests, so the still check shows.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ends once after its time, even when the screen behind re-renders', async () => {
    setReducedMotion(false);
    const onDone = vi.fn<() => void>();
    const { rerender } = render(moment(onDone));

    await wait(1_000);
    rerender(moment(() => onDone()));
    await wait(599);
    expect(onDone).not.toHaveBeenCalled();

    await wait(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('is shorter for people who turn motion off', async () => {
    setReducedMotion(true);
    const onDone = vi.fn<() => void>();
    render(moment(onDone));

    await wait(1_000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('moves focus to the news, so it is read out', () => {
    setReducedMotion(false);
    render(moment(vi.fn()));

    expect(screen.getByRole('heading', { name: 'اتبعت للمطعم!' })).toHaveFocus();
    expect(screen.getByText('هتلاقيه في طلباتك')).toBeInTheDocument();
  });
});
