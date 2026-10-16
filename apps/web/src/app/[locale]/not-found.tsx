import { useTranslations } from 'next-intl';
import { NotFoundArt } from '@/components/three/not-found-art';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

/** Any page that doesn't exist: a bitten «لقمة», one line, and the way home. */
export default function NotFound() {
  const t = useTranslations('common');
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-app flex-col items-center justify-center gap-7 px-gutter text-center">
      <NotFoundArt />
      <div className="flex flex-col items-center gap-2.5">
        <h1 className="text-26 leading-heading font-extrabold">{t('notFound')}</h1>
        <p className="text-15 leading-body text-ink-2">{t('notFoundBody')}</p>
      </div>
      <Link href="/" className={buttonVariants()}>
        {t('backHome')}
      </Link>
    </main>
  );
}
