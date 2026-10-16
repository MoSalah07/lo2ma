/**
 * Feedback for anything pressable: it shrinks a touch under the finger and eases back, in CSS only. Colors still
 * change with motion turned off; the movement doesn't.
 */
export const pressable =
  'transition active:scale-97 motion-reduce:transition-colors motion-reduce:active:scale-100';
