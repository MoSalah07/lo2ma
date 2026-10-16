import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { AppDocument } from '@/components/app-document';
import { NotFoundScreen } from '@/components/not-found-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  return { title: `${t('notFound')} · ${t('brand')}` };
}

/**
 * Every URL that matches no page, rendered on the server with a real 404 status. The locale comes from the URL
 * through the proxy; URLs it skips (with a dot, like /en/old.html) get the default one.
 */
export default async function GlobalNotFound() {
  const locale = await getLocale();
  return (
    <AppDocument locale={locale}>
      <NotFoundScreen locale={locale} />
    </AppDocument>
  );
}
