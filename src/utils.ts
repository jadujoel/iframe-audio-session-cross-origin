export type AudioSessionType
/**
 * Default behavior, the UA will determine the appropriate behavior based on the context of the audio.
 */
= "auto"
/**
 * Background FX, Games.
 * Mixes with other audio sessions.
 */
| "ambient"
/**
 * Music, Video, Podcasts
 * Pauses other audio sessions.
 * */
| "playback"
/**
 * UI sounds, Notifications
 * Ducks other audio sessions (Lowers their volume).
 */
| "transient"
/**
 * Voice commands, GPS
 * Pauses other audio sessions.
 */
| "transient-solo"
/**
 * Video calls, Recording
 * Interrups other audio sessions with priority,
 */
| "play-and-record";

export interface AudioSession extends EventTarget {
  /** @default "auto" */
  type: AudioSessionType;
}

/**
 * Poll `navigator.audioSession.type` and invoke `onChange` whenever it differs
 * from the previous value. Returns a stop function.
 *
 * There is no spec event for type changes — `statechange` is for `state`
 * (inactive/active/interrupted), not type. Safari can mutate `type` on its own
 * (e.g. resolving "auto" once audio actually starts), so polling is the only
 * way to observe that.
 */
export function watchAudioSessionType(
  onChange: (next: AudioSessionType, prev: AudioSessionType) => void,
  intervalMs = 250,
): () => void {
  const session = getAudioSession();
  if (!session) return () => {};
  let prev = session.type;
  const id = setInterval(() => {
    const next = session.type;
    if (next !== prev) {
      const old = prev;
      prev = next;
      onChange(next, old);
    }
  }, intervalMs);
  return () => clearInterval(id);
}

export interface AudioSessionAble {
  audioSession: AudioSession;
}

export type NavigatorWithAudioSession = Navigator & AudioSessionAble;

export const AudioSessionTypes = {
  /** */
  Auto: "auto",
  /**
   * Background FX, Games.
   * Mixes with other audio sessions.
   */
  Ambient: "ambient",
  /**
   * Music, Video, Podcasts
   * Pauses other audio sessions.
   */
  Playback: "playback",
  /**
   * UI sounds, Notifications
   * Ducks other audio sessions (Lowers their volume).
   * */
  Transient: "transient",
  /**
   * Voice commands, GPS
   * Pauses other audio sessions.
   */
  TransientSolo: "transient-solo",
  /**
   * Video calls, Recording
   * Interrups other audio sessions with priority,
   */
  PlayAndRecord: "play-and-record"
} as const

export function isAudioSessionAble(thing: unknown): thing is AudioSessionAble {
  return (thing as any)?.audioSession?.type !== undefined;
}

export function isNavigatorWithAudioSession(navigator: Navigator): navigator is NavigatorWithAudioSession {
  return "audioSession" in navigator;
}

export function isWindowWithAudioSession(thing: unknown): thing is Window & { navigator: NavigatorWithAudioSession } {
  return typeof thing !== "undefined"
    && isNavigatorWithAudioSession(window.navigator);
}

export function setAudioSessionType(type: AudioSessionType) {
  if (isWindowWithAudioSession(window)) {
    window.navigator.audioSession.type = type;
  }
}

export function getAudioSessionType(): AudioSessionType | undefined {
  if (isWindowWithAudioSession(window)) {
    return window.navigator.audioSession.type;
  }
}

export function getAudioSession(): AudioSession | undefined {
  if (isWindowWithAudioSession(window)) {
    return window.navigator.audioSession;
  }
}

/**
 * A simple play/stop WebAudio tone for manually exercising the audio session.
 * Each `start()` creates a fresh oscillator so calls are idempotent.
 */
export function createTone(opts: { frequency?: number; gain?: number } = {}) {
  const frequency = opts.frequency ?? 440;
  const gain = opts.gain ?? 0.1;
  const ctx: AudioContext = new AudioContext({ sampleRate: 48000, latencyHint: "playback" })
  let osc: OscillatorNode | undefined;
  let gainNode: GainNode | undefined;

  const start = async () => {
    if (osc) return;
    if (ctx.state === "suspended") await ctx.resume();
    gainNode = ctx.createGain();
    gainNode.gain.value = gain;
    gainNode.connect(ctx.destination);
    osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = frequency;
    osc.connect(gainNode);
    osc.start();
  };

  const stop = () => {
    osc?.stop();
    osc?.disconnect();
    gainNode?.disconnect();
    osc = undefined;
    gainNode = undefined;
  };

  const isPlaying = () => osc !== undefined;
  const getContextState = () => ctx?.state;

  return { start, stop, isPlaying, getContextState };
}
