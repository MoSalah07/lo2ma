import { VOICE_MAX_SECONDS, VOICE_MIN_SECONDS } from '@lo2ma/core';
import type { Locale } from '@lo2ma/i18n/locales';
import {
  canRecord,
  openMicrophone,
  SAMPLE_MS,
  startRecording,
  type Microphone,
  type Recorder,
} from '@/lib/audio';

export type VoicePhase =
  'connecting' | 'listening' | 'thinking' | 'speaking' | 'blocked' | 'unsupported';

export interface VoiceSessionState {
  phase: VoicePhase;
  muted: boolean;
  /** How loud the user is right now, 0 to 1, for the orb. */
  level: number;
  /** The last turn failed (the network, the server or the agent), so the screen says so. */
  failed: boolean;
}

export interface VoiceSessionDeps {
  locale: Locale;
  /** Writes down a recording. Resolves to '' when nothing was said, and rejects when something broke. */
  transcribe: (audio: Blob) => Promise<string>;
  /** Asks the agent and resolves with its whole reply once it has finished. Rejects when it couldn't. */
  reply: (text: string) => Promise<string>;
}

export const initialVoiceState: VoiceSessionState = {
  phase: 'connecting',
  muted: false,
  level: 0,
  failed: false,
};

/** Loudness above this counts as talking; below the second, as a pause. */
const TALKING = 0.12;
const QUIET = 0.06;
/** A pause this long after talking ends the user's turn, like the end of a sentence on a call. */
const END_OF_TURN_MS = 1_200;
/** Without a voice for the language, the reply stays up about as long as it would take to say. */
const MS_PER_WORD = 380;

interface Turn {
  recorder: Recorder;
  talked: boolean;
  quietSince: number | null;
}

/**
 * One voice conversation on the demo's mocks: listen, notice the pause that ends a turn, write the words down,
 * ask the agent, and read the reply aloud with the browser's own voice. Phase 3.5 replaces it with LiveKit
 * (real speech-to-text, our agent, an Egyptian voice). The screen only sees the state, so it stays the same.
 *
 * Muting turns the microphone's tracks off and throws the turn away, so nothing said while muted is ever
 * recorded or sent.
 */
export function createVoiceSession(
  deps: () => VoiceSessionDeps | null,
  onChange: (state: VoiceSessionState) => void,
) {
  let state = initialVoiceState;
  let mic: Microphone | null = null;
  let turn: Turn | null = null;
  let sampler: number | undefined;
  let speechTimer: number | undefined;
  // Bumped on every connect and hang-up, so a microphone or an answer that arrives after a hang-up is let go.
  let generation = 0;

  function set(change: Partial<VoiceSessionState>) {
    state = { ...state, ...change };
    onChange(state);
  }

  function dropTurn() {
    if (turn) void turn.recorder.stop();
    turn = null;
  }

  /** Waits for the user to talk. While muted it records nothing, and unmuting starts the turn. */
  function listen() {
    if (!mic) return;
    turn = state.muted
      ? null
      : { recorder: startRecording(mic.stream), talked: false, quietSince: null };
    set({ phase: 'listening' });
  }

  function stopSpeaking() {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    window.clearTimeout(speechTimer);
  }

  function speak(text: string, locale: Locale) {
    if (!text) {
      listen();
      return;
    }
    set({ phase: 'speaking' });
    const done = () => {
      if (state.phase === 'speaking') listen();
    };
    const voice =
      typeof speechSynthesis === 'undefined'
        ? undefined
        : speechSynthesis
            .getVoices()
            .find((option) => option.lang.toLowerCase().startsWith(locale));
    if (voice) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.onend = done;
      utterance.onerror = done;
      speechSynthesis.speak(utterance);
    } else {
      const words = text.split(/\s+/).length;
      speechTimer = window.setTimeout(done, Math.min(12_000, Math.max(1_500, words * MS_PER_WORD)));
    }
  }

  async function endTurn() {
    const current = turn;
    if (!current || state.phase !== 'listening') return;
    const mine = generation;
    turn = null;
    set({ phase: 'thinking', level: 0, failed: false });

    const { audio, seconds } = await current.recorder.stop();
    const services = deps();
    if (mine !== generation) return;
    if (!services || seconds < VOICE_MIN_SECONDS) {
      listen();
      return;
    }
    try {
      const heard = await services.transcribe(audio);
      if (mine !== generation) return;
      // Nothing usable was heard: just keep listening, like a person would.
      if (!heard.trim()) {
        listen();
        return;
      }
      // The latest helpers, not the ones from before the user talked: the chat may have moved on.
      const answer = await (deps() ?? services).reply(heard);
      if (mine !== generation) return;
      speak(answer, services.locale);
    } catch {
      if (mine !== generation) return;
      set({ failed: true });
      listen();
    }
  }

  function sample() {
    if (!mic) return;
    if (state.phase !== 'listening' || !turn) {
      if (state.level !== 0) set({ level: 0 });
      return;
    }
    const level = mic.level();
    set({ level });
    if (level > TALKING) {
      turn.talked = true;
      turn.quietSince = null;
    } else if (turn.talked && level < QUIET) {
      turn.quietSince ??= performance.now();
      if (performance.now() - turn.quietSince > END_OF_TURN_MS) {
        void endTurn();
        return;
      }
    }
    // A turn that never pauses (an office's noise, say) still ends, like a voice message does.
    if (turn.recorder.elapsed() >= VOICE_MAX_SECONDS) {
      if (turn.talked) void endTurn();
      else {
        dropTurn();
        listen();
      }
    }
  }

  function hangUp() {
    generation += 1;
    window.clearInterval(sampler);
    stopSpeaking();
    dropTurn();
    mic?.close();
    mic = null;
  }

  return {
    async connect() {
      const mine = ++generation;
      if (!canRecord()) {
        set({ phase: 'unsupported' });
        return;
      }
      // Chrome loads its voices in the background; asking now means they are there for the first reply.
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.getVoices();
      let opened: Microphone;
      try {
        opened = await openMicrophone();
      } catch {
        if (mine === generation) set({ phase: 'blocked' });
        return;
      }
      if (mine !== generation) {
        opened.close();
        return;
      }
      mic = opened;
      // The user may have pressed mute while the browser was still asking.
      for (const track of opened.stream.getAudioTracks()) {
        track.enabled = !state.muted;
        // The microphone was unplugged or its permission taken back: the call can't go on.
        track.addEventListener('ended', () => {
          if (mine !== generation) return;
          hangUp();
          set({ phase: 'blocked' });
        });
      }
      sampler = window.setInterval(sample, SAMPLE_MS);
      listen();
    },

    /** The orb: ends the user's turn while listening, and cuts the reply short while speaking. */
    tap() {
      if (state.phase === 'listening' && turn) void endTurn();
      else if (state.phase === 'speaking') {
        stopSpeaking();
        listen();
      }
    },

    toggleMute() {
      const muted = !state.muted;
      for (const track of mic?.stream.getAudioTracks() ?? []) track.enabled = !muted;
      set({ muted });
      if (state.phase !== 'listening') return;
      if (muted) {
        dropTurn();
        set({ level: 0 });
      } else listen();
    },

    hangUp() {
      hangUp();
      state = initialVoiceState;
    },
  };
}
