import { durations, easings, staggerGap, travel, type Easing } from '@lo2ma/tokens';
import type { Transition, Variants } from 'motion/react';

const seconds = (ms: number) => ms / 1000;

/** A transition from the motion tokens: one of the durations on one of the curves. */
export const transition = (duration: keyof typeof durations, easing: Easing): Transition => ({
  duration: seconds(durations[duration]),
  ease: easings[easing],
});

/** The one entrance: a short rise and fade. Everything that appears uses it, so the app moves in one way. */
export const rise: Variants = {
  hidden: { opacity: 0, y: travel },
  shown: { opacity: 1, y: 0, transition: transition('enter', 'enter') },
};

/** A list whose items rise one after another. */
export const sequence: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: seconds(staggerGap) } },
};

/** A screen after navigating: opacity only, because a moving ancestor would drag the fixed bars along. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: transition('enter', 'standard') },
};

/** A bottom sheet: slides up to arrive, back down to leave, over a fading scrim. */
export const sheet: Variants = {
  hidden: { y: '100%', transition: transition('exit', 'exit') },
  shown: { y: 0, transition: transition('enter', 'enter') },
};

export const scrim: Variants = {
  hidden: { opacity: 0, transition: transition('exit', 'exit') },
  shown: { opacity: 1, transition: transition('enter', 'standard') },
};
