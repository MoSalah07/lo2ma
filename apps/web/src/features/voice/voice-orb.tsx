import { focusRing } from '@/components/ui/focus';
import { cn } from '@/lib/cn';

interface VoiceOrbProps {
  /** How loud the user is, 0 to 1: the core grows with it while listening. */
  level: number;
  speaking: boolean;
  /** What a tap does: «خلّصت كلامي» while listening, «وقّف الرد» while speaking. */
  label: string;
  /** Missing while the orb can't be tapped (thinking, muted). It stays a button, so focus never drops. */
  onTap?: () => void;
}

/** The call's picture in brand shapes: lilac, a tint ring, the cobalt core and a pink tile. Tap it to talk. */
export function VoiceOrb({ level, speaking, label, onTap }: VoiceOrbProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={!onTap}
      onClick={onTap}
      className={cn(
        'relative flex size-60 items-center justify-center rounded-full aria-disabled:cursor-default',
        focusRing,
      )}
    >
      <span aria-hidden className="absolute inset-0 rounded-full bg-lilac" />
      <span aria-hidden className="absolute inset-5.5 rounded-full ring-10 ring-tint ring-inset" />
      <span
        aria-hidden
        className={cn(
          'relative rounded-full bg-primary transition-transform duration-100 motion-reduce:transform-none!',
          speaking ? 'size-32 motion-safe:animate-pulse' : 'size-37.5',
        )}
        style={{ transform: `scale(${1 + level * 0.18})` }}
      />
      <span
        aria-hidden
        className="absolute end-7.5 top-8.5 size-14.5 -rotate-14 rounded-22 bg-pink"
      />
    </button>
  );
}
