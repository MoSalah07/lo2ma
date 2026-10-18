/**
 * The contract, checked by the compiler: each zod schema in packages/core and the FastAPI model of the same name
 * must describe the same JSON. A field missing on one side, optional on one side only, or of another type fails
 * `npm run typecheck`. Numbers' limits (min, max) are types neither side can see; the backend's contract tests
 * cover those.
 *
 * A new endpoint adds a line per schema it sends or receives.
 */
import type {
  otpRequestSchema,
  otpVerifySchema,
  placeSchema,
  pointLookupSchema,
  sessionUserSchema,
  userPrefsSchema,
  workplaceSchema,
} from '@lo2ma/core';
import type { z } from 'zod';
import type { components } from './schema';

type Api = components['schemas'];

/** True only when A and B are the same type, not just assignable one way. */
type Same<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type Contract = [
  Expect<Same<z.infer<typeof placeSchema>, Api['Place']>>,
  Expect<Same<z.infer<typeof pointLookupSchema>, Api['PointLookup']>>,
  Expect<Same<z.infer<typeof workplaceSchema>, Api['Workplace']>>,
  Expect<Same<z.infer<typeof userPrefsSchema>, Api['UserPrefs']>>,
  Expect<Same<z.infer<typeof otpRequestSchema>, Api['OtpRequest']>>,
  Expect<Same<z.infer<typeof otpVerifySchema>, Api['OtpVerify']>>,
  Expect<Same<z.infer<typeof sessionUserSchema>, Api['SessionUser']>>,
];
