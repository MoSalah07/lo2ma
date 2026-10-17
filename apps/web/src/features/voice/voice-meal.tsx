import { formatMoney, type Suggestion } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { SignedInButton } from '@/features/auth/signed-in-button';
import { useRouter } from '@/i18n/navigation';
import { mealName } from '@/lib/meal';

/** The meal the reply offered. Picking it goes to checkout, where paying is the user's own button. */
export function VoiceMeal({ suggestion }: { suggestion: Suggestion }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const checkout = `/checkout/${suggestion.id}`;

  return (
    <Card className="flex w-full items-center gap-3 rounded-card p-3 ps-4 text-start">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body-md font-bold">
          <bdi>{mealName(suggestion, locale)}</bdi>
        </span>
        <span className="text-caption text-muted">
          {t('voiceMode.mealMeta', {
            restaurant: suggestion.restaurant.name[locale],
            price: formatMoney(suggestion.bill.total, locale),
          })}
        </span>
      </div>
      <SignedInButton size="sm" next={checkout} onSignedIn={() => router.push(checkout)}>
        {t('chat.pick')}
      </SignedInButton>
    </Card>
  );
}
