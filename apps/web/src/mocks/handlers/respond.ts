import { HttpResponse } from 'msw';
import type { z } from 'zod';

/**
 * The handler pattern for an API path. "*" matches any origin, because Node (tests) has no page origin to
 * resolve a bare "/api/…" against.
 */
export const route = (path: string) => `*/api${path}`;

/** A JSON error the client turns into an ApiError with this code. */
export const fail = (status: number, code: string) => HttpResponse.json({ code }, { status });

/** Parses a JSON body with a zod schema; returns null when it doesn't match. */
export async function readBody<T>(request: Request, schema: z.ZodType<T>): Promise<T | null> {
  const result = schema.safeParse(await request.json().catch(() => null));
  return result.success ? result.data : null;
}
