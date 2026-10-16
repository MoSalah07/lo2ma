/** How often the voice features read the microphone's loudness. */
export const SAMPLE_MS = 100;

/** Loudness of the latest microphone samples, from 0 (silence) to 1 (loud). */
export function loudness(samples: Uint8Array): number {
  let sum = 0;
  for (const sample of samples) {
    const value = (sample - 128) / 128;
    sum += value * value;
  }
  return Math.min(1, Math.sqrt(sum / samples.length) * 4);
}

/** Whether this browser can record the microphone at all. */
export function canRecord(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  );
}

export interface Microphone {
  stream: MediaStream;
  /** How loud it is right now, 0 to 1. */
  level: () => number;
  /** Turns the microphone off. Safe to call more than once. */
  close: () => void;
}

/** Asks for the microphone and starts measuring how loud it is. Rejects when the user or the browser says no. */
export async function openMicrophone(): Promise<Microphone> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const context = new AudioContext();
  // iOS Safari can create it suspended, and a suspended context always reads silence.
  void context.resume().catch(() => undefined);
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  context.createMediaStreamSource(stream).connect(analyser);
  const samples = new Uint8Array(analyser.fftSize);
  let closed = false;

  return {
    stream,
    level() {
      analyser.getByteTimeDomainData(samples);
      return loudness(samples);
    },
    close() {
      if (closed) return;
      closed = true;
      for (const track of stream.getTracks()) track.stop();
      void context.close().catch(() => undefined);
    },
  };
}

export interface Recording {
  audio: Blob;
  seconds: number;
}

export interface Recorder {
  /** Seconds since the recording started. */
  elapsed: () => number;
  /** Stops and resolves with what was recorded. Also works when the browser already stopped it. */
  stop: () => Promise<Recording>;
}

/** Records an open microphone until `stop()`. */
export function startRecording(stream: MediaStream): Recorder {
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  const startedAt = performance.now();
  const elapsed = () => (performance.now() - startedAt) / 1000;
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  // The browser stops it by itself when the microphone goes away, so the end is awaited, not assumed.
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });
  recorder.start();

  return {
    elapsed,
    async stop() {
      const seconds = elapsed();
      if (recorder.state !== 'inactive') recorder.stop();
      await stopped;
      return { audio: new Blob(chunks, { type: recorder.mimeType }), seconds };
    },
  };
}
