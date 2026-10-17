import type { Locale } from '@lo2ma/i18n/locales';
import { getTranslations } from 'next-intl/server';
import { NotFoundArt } from '@/components/three/not-found-art';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

/**
 * The 404 screen: a bitten «لقمة», one line, and the way home. It takes the locale explicitly because the 404
 * for unknown URLs renders outside the [locale] segment.
 */
export async function NotFoundScreen({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'common' });
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-app flex-col items-center justify-center gap-7 px-gutter text-center">
      <NotFoundArt />
      <div className="flex flex-col items-center gap-2.5">
        <h1 className="text-headline-sm">{t('notFound')}</h1>
        <p className="text-body-md text-ink-2">{t('notFoundBody')}</p>
      </div>
      <Link href="/" locale={locale} className={buttonVariants()}>
        {t('backHome')}
      </Link>
    </main>
  );
}
