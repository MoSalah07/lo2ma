import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Next 16 calls this file proxy.ts (it was middleware.ts). It redirects / to /ar and keeps every URL under a locale.
export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next internals and files with an extension (images, fonts, favicon).
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
