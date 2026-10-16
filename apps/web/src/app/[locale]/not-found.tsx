import { getLocale } from 'next-intl/server';
import { NotFoundScreen } from '@/components/not-found-screen';

/** A notFound() inside a page: the same 404 as for unknown URLs, inside the app's layout. */
export default async function NotFound() {
  return <NotFoundScreen locale={await getLocale()} />;
}
