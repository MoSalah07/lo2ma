import { VOICE_MAX_SECONDS } from '@lo2ma/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openMicrophone, startRecording, type Microphone } from '@/lib/audio';
import { createVoiceSession, type VoiceSessionDeps, type VoiceSessionState } from './session';

// The microphone is faked: each test sets how loud the user is and moves the clock.
vi.mock('@/lib/audio', () => ({
  SAMPLE_MS: 100,
  canRecord: () => true,
  openMicrophone: vi.fn(),
  startRecording: vi.fn(),
}));

let level = 0;
/** Every turn's recorder, to check which were thrown away. */
const stops: ReturnType<typeof vi.fn>[] = [];

function fakeMicrophone() {
  const ended: (() => void)[] = [];
  const track = {
    enabled: true,
    stop: vi.fn(),
    addEventListener: (_type: string, listener: () => void) => ended.push(listener),
  };
  const stream = { getAudioTracks: () => [track], getTracks: () => [track] };
  const mic = { stream: stream as unknown as MediaStream, level: () => level, close: vi.fn() };
  return { mic, track, unplug: () => ended.forEach((listener) => listener()) };
}

function startCall(overrides: Partial<VoiceSessionDeps> = {}) {
  const deps: VoiceSessionDeps = {
    locale: 'ar',
    transcribe: vi.fn(() => Promise.resolve('معايا 150')),
    reply: vi.fn(() => Promise.resolve('لقيتلك كشري')),
    ...overrides,
  };
  let state: VoiceSessionState | undefined;
  const session = createVoiceSession(
    () => deps,
    (next) => (state = next),
  );
  return { session, deps, state: () => state };
}

/** Talks for a moment, then goes quiet long enough to end the turn. */
async function sayAndPause() {
  level = 1;
  await vi.advanceTimersByTimeAsync(300);
  level = 0;
  await vi.advanceTimersByTimeAsync(1_500);
}

describe('createVoiceSession', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'],
    });
    level = 0;
    stops.length = 0;
    vi.mocked(startRecording).mockImplementation(() => {
      const startedAt = performance.now();
      const elapsed = () => (performance.now() - startedAt) / 1000;
      const stop = vi.fn(() => Promise.resolve({ audio: new Blob(['voice']), seconds: elapsed() }));
      stops.push(stop);
      return { elapsed, stop };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('ends the turn on a pause, sends what was heard and reads the reply out', async () => {
    const { mic } = fakeMicrophone();
    vi.mocked(openMicrophone).mockResolvedValue(mic);
    const { session, deps, state } = startCall();

    await session.connect();
    expect(state()?.phase).toBe('listening');
    await sayAndPause();

    expect(deps.transcribe).toHaveBeenCalledTimes(1);
    expect(deps.reply).toHaveBeenCalledWith('معايا 150');
    expect(state()?.phase).toBe('speaking');
  });

  it('records nothing when muted while the microphone is still being asked for', async () => {
    let grant: (mic: Microphone) => void = () => {};
    vi.mocked(openMicrophone).mockReturnValue(new Promise((resolve) => (grant = resolve)));
    const { session, state } = startCall();

    const connecting = session.connect();
    session.toggleMute();
    const { mic, track } = fakeMicrophone();
    grant(mic);
    await connecting;

    expect(track.enabled).toBe(false);
    expect(startRecording).not.toHaveBeenCalled();
    expect(state()).toMatchObject({ phase: 'listening', muted: true });

    session.toggleMute();
    expect(track.enabled).toBe(true);
    expect(startRecording).toHaveBeenCalledTimes(1);
  });

  it('throws the turn away on mute, so half a sentence is never sent', async () => {
    const { mic } = fakeMicrophone();
    vi.mocked(openMicrophone).mockResolvedValue(mic);
    const { session, deps } = startCall();

    await session.connect();
    level = 1;
    await vi.advanceTimersByTimeAsync(300);
    session.toggleMute();
    level = 0;
    await vi.advanceTimersByTimeAsync(3_000);

    expect(deps.transcribe).not.toHaveBeenCalled();
    expect(stops[0]).toHaveBeenCalled();
  });

  it('never sends the words when the user hangs up while they are written down', async () => {
    const { mic } = fakeMicrophone();
    vi.mocked(openMicrophone).mockResolvedValue(mic);
    let heard: (text: string) => void = () => {};
    const { session, deps } = startCall({
      transcribe: vi.fn(() => new Promise<string>((resolve) => (heard = resolve))),
    });

    await session.connect();
    await sayAndPause();
    session.hangUp();
    heard('معايا 150');
    await vi.advanceTimersByTimeAsync(100);

    expect(deps.reply).not.toHaveBeenCalled();
    expect(mic.close).toHaveBeenCalled();
  });

  it('says so when a turn fails, and keeps listening', async () => {
    const { mic } = fakeMicrophone();
    vi.mocked(openMicrophone).mockResolvedValue(mic);
    const { session, state } = startCall({
      reply: vi.fn(() => Promise.reject(new Error('no_reply'))),
    });

    await session.connect();
    await sayAndPause();

    expect(state()).toMatchObject({ phase: 'listening', failed: true });
  });

  it('just keeps listening when nothing was said', async () => {
    const { mic } = fakeMicrophone();
    vi.mocked(openMicrophone).mockResolvedValue(mic);
    const { session, deps, state } = startCall({ transcribe: vi.fn(() => Promise.resolve('')) });

    await session.connect();
    await sayAndPause();

    expect(deps.reply).not.toHaveBeenCalled();
    expect(state()).toMatchObject({ phase: 'listening', failed: false });
  });

  it('cuts the reply short on a tap and listens again', async () => {
    const { mic } = fakeMicrophone();
    vi.mocked(openMicrophone).mockResolvedValue(mic);
    const { session, state } = startCall();

    await session.connect();
    await sayAndPause();
    expect(state()?.phase).toBe('speaking');
    session.tap();

    expect(state()?.phase).toBe('listening');
  });

  it('ends a turn that never pauses at the voice message limit', async () => {
    const { mic } = fakeMicrophone();
    vi.mocked(openMicrophone).mockResolvedValue(mic);
    const { session, deps } = startCall();

    await session.connect();
    level = 1;
    await vi.advanceTimersByTimeAsync(VOICE_MAX_SECONDS * 1000 + 200);

    expect(deps.transcribe).toHaveBeenCalledTimes(1);
  });

  it('stops the call when the microphone goes away', async () => {
    const { mic, unplug } = fakeMicrophone();
    vi.mocked(openMicrophone).mockResolvedValue(mic);
    const { session, state } = startCall();

    await session.connect();
    unplug();

    expect(state()?.phase).toBe('blocked');
    expect(mic.close).toHaveBeenCalled();
  });

  it('shows the blocked state when the microphone is refused', async () => {
    vi.mocked(openMicrophone).mockRejectedValue(new Error('NotAllowedError'));
    const { session, state } = startCall();

    await session.connect();

    expect(state()?.phase).toBe('blocked');
  });
});
