import type { z } from 'zod';
import { ensureMocks } from './mocking';

/** A failed API call. `code` comes from the server (e.g. "auth_required") so the UI can react to it. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(`${status} ${code}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function errorCode(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  return typeof body === 'object' &&
    body !== null &&
    'code' in body &&
    typeof body.code === 'string'
    ? body.code
    : 'unknown';
}

/** Sends a request to /api and returns the raw response, throwing ApiError on a non-2xx status. */
export async function request(path: string, init?: RequestInit): Promise<Response> {
  await ensureMocks();
  // A file upload (FormData) needs the browser to set its own multipart Content-Type with the boundary.
  const isForm = init?.body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: isForm ? init?.headers : { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new ApiError(response.status, await errorCode(response));
  return response;
}

/** Calls /api and validates the JSON with a zod schema, so bad data fails here and not deep in the UI. */
export async function api<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await request(path, init);
  return schema.parse(await response.json());
}

export const jsonBody = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

/**
 * Turns expected "empty" answers into null: 401 means signed out, 404 means not created yet.
 * Anything else is still an error.
 */
export async function orNull<T>(promise: Promise<T>, statuses: number[] = [401, 404]) {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && statuses.includes(error.status)) return null;
    throw error;
  }
}
