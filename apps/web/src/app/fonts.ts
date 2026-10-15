import { Alexandria } from 'next/font/google';

// next/font needs literal options, so the variable name is written here. It must match `fontVariable` in @lo2ma/tokens.
export const alexandria = Alexandria({
  subsets: ['arabic', 'latin'],
  variable: '--font-alexandria',
  display: 'swap',
});
