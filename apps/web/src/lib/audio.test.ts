import { afterEach, describe, expect, it, vi } from 'vitest';
import { loudness, startRecording } from './audio';

/** jsdom has no MediaRecorder: this one hands over one chunk when it stops, like a short recording. */
class FakeRecorder {
  /** Every recorder made, newest last, so a test can act as the browser. */
  static made: FakeRecorder[] = [];
  state: RecordingState = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor() {
    FakeRecorder.made.push(this);
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['voice']) });
    this.onstop?.();
  }
}

describe('loudness', () => {
  it('is 0 for silence and never more than 1', () => {
    expect(loudness(new Uint8Array(8).fill(128))).toBe(0);
    expect(loudness(new Uint8Array(8).fill(255))).toBe(1);
  });

  it('grows with the signal', () => {
    expect(loudness(new Uint8Array(8).fill(140))).toBeGreaterThan(
      loudness(new Uint8Array(8).fill(132)),
    );
  });
});

describe('startRecording', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeRecorder.made = [];
  });

  it('resolves with what was recorded', async () => {
    vi.stubGlobal('MediaRecorder', FakeRecorder);
    const recorder = startRecording({} as MediaStream);

    const { audio } = await recorder.stop();

    expect(audio.size).toBeGreaterThan(0);
    expect(audio.type).toBe('audio/webm');
  });

  it('still resolves when the browser already stopped it', async () => {
    vi.stubGlobal('MediaRecorder', FakeRecorder);
    const recorder = startRecording({} as MediaStream);
    FakeRecorder.made.at(-1)?.stop();

    const { audio } = await recorder.stop();
    expect(audio.size).toBeGreaterThan(0);
  });
});
