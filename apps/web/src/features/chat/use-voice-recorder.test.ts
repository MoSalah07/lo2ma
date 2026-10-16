import { VOICE_MAX_SECONDS } from '@lo2ma/core';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openMicrophone, startRecording, type Microphone } from '@/lib/audio';
import { useVoiceRecorder } from './use-voice-recorder';

vi.mock('@/lib/audio', () => ({
  SAMPLE_MS: 100,
  canRecord: () => true,
  openMicrophone: vi.fn(),
  startRecording: vi.fn(),
}));

function fakeMicrophone() {
  return { stream: {} as MediaStream, level: () => 0.5, close: vi.fn<() => void>() };
}

/** A microphone the test hands over when it wants, like a permission prompt the user answers later. */
function askLater() {
  let grant: (mic: Microphone) => void = () => {};
  vi.mocked(openMicrophone).mockReturnValueOnce(new Promise((resolve) => (grant = resolve)));
  return (mic: Microphone) => grant(mic);
}

describe('useVoiceRecorder', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'],
    });
    vi.mocked(startRecording).mockImplementation(() => {
      const startedAt = performance.now();
      const elapsed = () => (performance.now() - startedAt) / 1000;
      return {
        elapsed,
        stop: () => Promise.resolve({ audio: new Blob(['voice']), seconds: elapsed() }),
      };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('records, then hands over the recording when the user stops', async () => {
    const mic = fakeMicrophone();
    vi.mocked(openMicrophone).mockResolvedValue(mic);
    const onRecorded = vi.fn();
    const { result } = renderHook(() => useVoiceRecorder(onRecorded));

    await act(() => result.current.start());
    await act(() => vi.advanceTimersByTimeAsync(2_000));
    expect(result.current).toMatchObject({ recording: true, seconds: 2 });

    await act(async () => {
      result.current.stop();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(onRecorded).toHaveBeenCalledWith(expect.objectContaining({ seconds: 2 }));
    expect(mic.close).toHaveBeenCalled();
    expect(result.current.recording).toBe(false);
  });

  it('throws the audio away on cancel', async () => {
    vi.mocked(openMicrophone).mockResolvedValue(fakeMicrophone());
    const onRecorded = vi.fn();
    const { result } = renderHook(() => useVoiceRecorder(onRecorded));

    await act(() => result.current.start());
    await act(async () => {
      result.current.cancel();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(onRecorded).not.toHaveBeenCalled();
  });

  it('stops by itself at the limit', async () => {
    vi.mocked(openMicrophone).mockResolvedValue(fakeMicrophone());
    const onRecorded = vi.fn();
    const { result } = renderHook(() => useVoiceRecorder(onRecorded));

    await act(() => result.current.start());
    await act(() => vi.advanceTimersByTimeAsync(VOICE_MAX_SECONDS * 1000 + 100));

    expect(onRecorded).toHaveBeenCalledTimes(1);
    expect(result.current.recording).toBe(false);
  });

  it('lets go of a microphone that arrives after the chat closed', async () => {
    const grant = askLater();
    const { result, unmount } = renderHook(() => useVoiceRecorder(vi.fn()));

    let started: Promise<boolean> = Promise.resolve(true);
    act(() => {
      started = result.current.start();
    });
    unmount();
    const mic = fakeMicrophone();
    grant(mic);
    await started;

    expect(mic.close).toHaveBeenCalled();
    expect(startRecording).not.toHaveBeenCalled();
  });

  it('keeps one microphone when the user taps twice while the browser is asking', async () => {
    const grantFirst = askLater();
    const grantSecond = askLater();
    const { result } = renderHook(() => useVoiceRecorder(vi.fn()));

    const first = fakeMicrophone();
    const second = fakeMicrophone();
    await act(async () => {
      const tapped = [result.current.start(), result.current.start()];
      grantFirst(first);
      grantSecond(second);
      expect(await Promise.all(tapped)).toEqual([true, true]);
    });

    expect(first.close).toHaveBeenCalled();
    expect(second.close).not.toHaveBeenCalled();
    expect(startRecording).toHaveBeenCalledTimes(1);
    expect(result.current.recording).toBe(true);
  });

  it('says no when the microphone is refused', async () => {
    vi.mocked(openMicrophone).mockRejectedValue(new Error('NotAllowedError'));
    const { result } = renderHook(() => useVoiceRecorder(vi.fn()));

    let allowed = true;
    await act(async () => {
      allowed = await result.current.start();
    });

    expect(allowed).toBe(false);
  });
});
