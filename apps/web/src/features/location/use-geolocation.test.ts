import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGeolocation } from './use-geolocation';

type Success = (position: { coords: { latitude: number; longitude: number } }) => void;
type Failure = (error: { code: number; PERMISSION_DENIED: number }) => void;

function fakeGeolocation(answer: (success: Success, failure: Failure) => void) {
  const getCurrentPosition = vi.fn(answer);
  vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } });
  return getCurrentPosition;
}

afterEach(() => vi.unstubAllGlobals());

describe('useGeolocation', () => {
  it('does nothing until asked', () => {
    const getCurrentPosition = fakeGeolocation(() => {});
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.status).toBe('idle');
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('hands over the position as a point', () => {
    let answer: Success = () => {};
    fakeGeolocation((success) => {
      answer = success;
    });
    const found = vi.fn();
    const { result } = renderHook(() => useGeolocation());

    act(() => result.current.locate(found));
    expect(result.current.status).toBe('locating');

    act(() => answer({ coords: { latitude: 30.0287, longitude: 31.4086 } }));
    expect(found).toHaveBeenCalledWith({ lat: 30.0287, lng: 31.4086 });
    expect(result.current.status).toBe('idle');
  });

  it('tells a refused permission apart from a position it could not get', () => {
    fakeGeolocation((_, failure) => failure({ code: 1, PERMISSION_DENIED: 1 }));
    const denied = renderHook(() => useGeolocation());
    act(() => denied.result.current.locate(vi.fn()));
    expect(denied.result.current.status).toBe('denied');

    fakeGeolocation((_, failure) => failure({ code: 3, PERMISSION_DENIED: 1 }));
    const timedOut = renderHook(() => useGeolocation());
    act(() => timedOut.result.current.locate(vi.fn()));
    expect(timedOut.result.current.status).toBe('unavailable');
  });

  it('says unavailable when the browser has no geolocation', () => {
    vi.stubGlobal('navigator', {});
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.locate(vi.fn()));
    expect(result.current.status).toBe('unavailable');
  });
});
