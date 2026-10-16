import { VOICE_MAX_SECONDS } from '@lo2ma/core';
import { useEffect, useRef, useState } from 'react';
import {
  canRecord,
  openMicrophone,
  SAMPLE_MS,
  startRecording,
  type Microphone,
  type Recorder,
  type Recording,
} from '@/lib/audio';
import { useIsClient } from '@/lib/use-is-client';

/** How many bars the waveform keeps, newest last. */
const WAVE_BARS = 22;

interface Session {
  mic: Microphone;
  recorder: Recorder;
  timer: number;
}

/**
 * Records one voice message with the browser's MediaRecorder. While it records it gives the elapsed seconds
 * and the recent loudness for the waveform, and it stops by itself at VOICE_MAX_SECONDS.
 */
export function useVoiceRecorder(onRecorded: (recording: Recording) => void) {
  const isClient = useIsClient();
  const supported = isClient && canRecord();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const session = useRef<Session | null>(null);
  // Bumped by every start and by leaving the chat, so a microphone that answers late is let go, and a
  // recording that ends after the chat closed is never sent.
  const attempt = useRef(0);

  async function finish(keep: boolean) {
    const current = session.current;
    if (!current) return;
    session.current = null;
    window.clearInterval(current.timer);
    const mine = attempt.current;
    const result = await current.recorder.stop();
    current.mic.close();
    setRecording(false);
    setSeconds(0);
    setLevels([]);
    if (keep && mine === attempt.current) onRecorded(result);
  }

  /** Asks for the microphone and starts recording. Resolves to false when the user or the browser says no. */
  async function start(): Promise<boolean> {
    if (!supported || session.current) return true;
    // A second tap while the browser is still asking wins, and the first microphone is let go.
    const mine = ++attempt.current;
    let mic: Microphone;
    try {
      mic = await openMicrophone();
    } catch {
      return mine !== attempt.current;
    }
    if (mine !== attempt.current) {
      mic.close();
      return true;
    }

    let recorder: Recorder;
    try {
      recorder = startRecording(mic.stream);
    } catch {
      mic.close();
      return false;
    }
    const timer = window.setInterval(() => {
      const level = mic.level();
      setLevels((previous) => [...previous, level].slice(-WAVE_BARS));
      const elapsed = recorder.elapsed();
      setSeconds(Math.floor(elapsed));
      if (elapsed >= VOICE_MAX_SECONDS) void finish(true);
    }, SAMPLE_MS);

    session.current = { mic, recorder, timer };
    setRecording(true);
    return true;
  }

  // Let go of the microphone if the chat closes mid-recording. The cleanup must see the session as it is
  // then, not as it was when the effect ran, so it reads the ref objects themselves.
  useEffect(() => {
    const sessions = session;
    const attempts = attempt;
    return () => {
      attempts.current += 1;
      const current = sessions.current;
      sessions.current = null;
      if (current) {
        window.clearInterval(current.timer);
        current.mic.close();
      }
    };
  }, []);

  return {
    supported,
    recording,
    seconds,
    levels,
    start,
    stop: () => void finish(true),
    cancel: () => void finish(false),
  };
}
