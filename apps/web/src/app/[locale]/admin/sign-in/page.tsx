import { ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/button';
import { AdminBrand } from '@/features/admin/brand';
import { AdminSignInForm } from '@/features/admin/sign-in/admin-sign-in-form';
import { Link } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.signIn');
  return { title: t('title') };
}

/** After signing in, go back to the dashboard page that sent you here, and never outside /admin. */
function adminNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  return next && /^\/admin(\/|$)/.test(next) && next !== '/admin/sign-in' ? next : '/admin';
}

export default async function AdminSignInPage({
  searchParams,
}: PageProps<'/[locale]/admin/sign-in'>) {
  const { next } = await searchParams;
  const t = await getTranslations();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-gutter py-section">
      <main className="flex w-full max-w-form flex-col gap-6 rounded-panel bg-surface p-6 shadow-card sm:p-8">
        <AdminBrand name={t('common.brand')} badge={t('admin.signIn.badge')} size="lg" />
        <AdminSignInForm next={adminNext(next)} />
      </main>
      <Link
        href="/"
        className={buttonVariants({ variant: 'link', size: 'sm', className: 'text-muted' })}
      >
        <ChevronLeft aria-hidden className="size-4 rtl:rotate-180" />
        {t('admin.signIn.back')}
      </Link>
    </div>
  );
}
