import {
  normalizeEgyptMobile,
  otpRequestSchema,
  otpVerifySchema,
  type OtpRequest,
  type SessionUser,
} from '@lo2ma/core';
import { http, HttpResponse } from 'msw';
import { readDb, writeDb } from '../store';
import { fail, readBody, route } from './respond';

/** In the demo any 6-digit code works, except 000000, which shows the "wrong code" state. */
const WRONG_CODE = '000000';
const CODE_LIFETIME_SECONDS = 300;

function validDestination({ channel, destination }: OtpRequest): boolean {
  return channel === 'phone'
    ? normalizeEgyptMobile(destination) !== null
    : /^\S+@\S+\.\S+$/.test(destination);
}

export const authHandlers = [
  http.post(route('/auth/otp'), async ({ request }) => {
    const body = await readBody(request, otpRequestSchema);
    if (!body || !validDestination(body)) return fail(400, 'invalid_destination');
    return HttpResponse.json({ expiresIn: CODE_LIFETIME_SECONDS });
  }),

  http.post(route('/auth/verify'), async ({ request }) => {
    const body = await readBody(request, otpVerifySchema);
    if (!body || !validDestination(body)) return fail(400, 'invalid_request');
    if (body.code === WRONG_CODE) return fail(400, 'invalid_code');

    const user: SessionUser = {
      id: `u-${body.destination}`,
      name: '',
      ...(body.channel === 'phone'
        ? { phone: normalizeEgyptMobile(body.destination) ?? body.destination }
        : { email: body.destination.toLowerCase() }),
    };
    writeDb((state) => ({ ...state, session: user }));
    return HttpResponse.json(user);
  }),

  http.get(route('/auth/session'), () => {
    const { session } = readDb();
    return session ? HttpResponse.json(session) : fail(401, 'signed_out');
  }),

  http.post(route('/auth/sign-out'), () => {
    writeDb((state) => ({ ...state, session: null }));
    return new HttpResponse(null, { status: 204 });
  }),
];
