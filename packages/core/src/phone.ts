import { toLatinDigits } from './number.ts';

/** Egypt's international dialing code, shown before the phone field. */
export const EGYPT_DIAL_CODE = '+20';

/** The example number the designs use as a placeholder. */
export const EGYPT_MOBILE_EXAMPLE = '10 1234 5678';
const EGYPT_MOBILE = /^1[0125]\d{8}$/;

/**
 * Turns what a user typed into a national Egyptian mobile number (10 digits, no leading 0), or null.
 * Accepts "010 1234 5678", "+20 10 1234 5678", "1012345678" and Arabic-Indic digits.
 */
export function normalizeEgyptMobile(input: string): string | null {
  const digits = toLatinDigits(input).replace(/\D/g, '');
  const national = digits.replace(/^(0020|20)/, '').replace(/^0/, '');
  return EGYPT_MOBILE.test(national) ? national : null;
}

/** "1012345678" → "10 1234 5678", the grouping used in the designs. */
export function formatEgyptMobile(national: string): string {
  return `${national.slice(0, 2)} ${national.slice(2, 6)} ${national.slice(6)}`;
}

/** "1012345678" → "+20 10 •••• 5678", for showing a number without exposing it. */
export function maskEgyptMobile(national: string): string {
  return `+20 ${national.slice(0, 2)} •••• ${national.slice(6)}`;
}
