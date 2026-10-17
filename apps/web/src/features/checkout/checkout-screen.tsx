'use client';

import {
  ARRIVAL_BUFFER_MINUTES,
  arrivalTimeFor,
  formatMoney,
  formatNumber,
  formatTime,
  type PaymentMethod,
} from '@lo2ma/core';
import { Clock, Lock, MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { BottomAction } from '@/components/bottom-action';
import { MealIcon } from '@/components/meal-icon';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { Screen } from '@/components/screen';
import { preloadSuccessScene, SuccessMoment } from '@/components/success-moment';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { SignedInButton } from '@/features/auth/signed-in-button';
import { FitLine } from '@/features/fit/fit-match';
import { WorkplaceSummary } from '@/features/location/workplace-summary';
import { useSuggestion } from '@/features/meal/api';
import { PickSummary } from '@/features/meal/pick-summary';
import { useCreateOrder } from '@/features/orders/api';
import { usePrefs } from '@/features/prefs/api';
import { fitTargetOf } from '@/features/prefs/options';
import { useRouter } from '@/i18n/navigation';
import { mealName, pounds } from '@/lib/meal';
import { PaymentPicker } from './payment-picker';

/** When no preferences exist yet (a guest who skipped onboarding). */
const DEFAULT_BREAK = '13:30';

export function CheckoutScreen({ id }: { id: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const suggestion = useSuggestion(id);
  const prefs = usePrefs();
  const createOrder = useCreateOrder();
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [note, setNote] = useState('');
  const [paidOrder, setPaidOrder] = useState<string | null>(null);

  // The celebration's 3D loads while the user reads the bill, so paying never waits for it.
  useEffect(() => preloadSuccessScene(), []);

  if (suggestion.isPending) return <LoadingBlocks count={3} />;
  if (suggestion.isError) return <ErrorMessage onRetry={() => void suggestion.refetch()} />;
  if (!suggestion.data) return <ErrorMessage message={t('meal.notFound')} />;

  const meal = suggestion.data;
  const breakTime = prefs.data?.breakTime ?? DEFAULT_BREAK;
  const goal = fitTargetOf(prefs.data?.calories);
  const arrival = arrivalTimeFor(breakTime);

  function pay() {
    // Paid already: the celebration is on screen and the order is on its way. Never a second order.
    if (paidOrder || createOrder.isPending) return;
    createOrder.mutate(
      { suggestionId: meal.id, paymentMethod: method, note: note.trim() || undefined },
      { onSuccess: (order) => setPaidOrder(order.id) },
    );
  }

  return (
    <>
      {/* Behind the celebration nothing can be reached, by touch, keyboard or screen reader. */}
      <div inert={paidOrder !== null} className="contents">
        <Screen clear="action">
          <Card className="flex flex-col gap-2.5 p-4">
            <div className="flex items-center gap-3">
              <MealIcon />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body-md font-bold">
                  <bdi>{mealName(meal, locale)}</bdi>
                </span>
                <span className="text-caption text-muted">{meal.restaurant.name[locale]}</span>
              </div>
              <span className="shrink-0 text-title-md font-extrabold">
                {formatMoney(meal.bill.total, locale)}
              </span>
            </div>
            <p className="text-caption text-muted">
              {t('bill.breakdown', {
                food: formatNumber(pounds(meal.bill.food), locale),
                delivery: formatNumber(pounds(meal.bill.delivery), locale),
                service: formatNumber(pounds(meal.bill.service), locale),
              })}
            </p>
            {goal && (
              <div className="flex flex-wrap items-center gap-1.5 border-t border-divider pt-2.5">
                <FitLine meal={meal} goal={goal} />
                {meal.kcalSource === 'ai' && <Badge tone="accent">{t('common.aiEstimate')}</Badge>}
              </div>
            )}
          </Card>

          <section className="flex flex-col gap-2">
            <h2 className="text-label-md text-ink-2">{t('checkout.deliveryTitle')}</h2>
            <Card className="flex flex-col gap-3 p-4">
              {prefs.data && (
                <p className="flex items-center gap-2.5">
                  <MapPin aria-hidden className="size-4.5 shrink-0 text-primary-ink" />
                  <WorkplaceSummary workplace={prefs.data.workplace} />
                </p>
              )}
              <p className="flex items-center gap-2.5 text-body-sm text-ink-2">
                <Clock aria-hidden className="size-4.5 shrink-0 text-primary-ink" />
                {t('checkout.eta', {
                  time: formatTime(arrival),
                  beforeBreak: t('common.beforeBreak', { minutes: ARRIVAL_BUFFER_MINUTES }),
                })}
              </p>
              <hr className="border-divider" />
              <Field label={t('checkout.noteLabel')}>
                {(control) => (
                  <Input
                    {...control}
                    value={note}
                    maxLength={200}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={t('checkout.notePlaceholder')}
                  />
                )}
              </Field>
            </Card>
          </section>

          <PaymentPicker value={method} onChange={setMethod} />

          <p className="flex items-center gap-2.5 rounded-card bg-good px-3.5 py-3 text-body-sm font-medium text-on-good">
            <Lock aria-hidden className="size-4.5 shrink-0" />
            {t('checkout.safety', { action: t('checkout.confirm') })}
          </p>

          {createOrder.isError && <ErrorMessage />}
        </Screen>

        <BottomAction>
          <SignedInButton
            block
            next={`/checkout/${meal.id}`}
            onSignedIn={pay}
            disabled={createOrder.isPending || paidOrder !== null}
            summary={<PickSummary suggestion={meal} />}
          >
            {createOrder.isPending
              ? t('checkout.paying')
              : t('checkout.confirmAmount', { amount: formatMoney(meal.bill.total, locale) })}
          </SignedInButton>
          <p className="text-center text-caption-sm text-muted">
            {t.rich('checkout.terms', {
              terms: (chunks) => <span className="underline">{chunks}</span>,
            })}
          </p>
        </BottomAction>
      </div>

      {paidOrder && (
        <SuccessMoment
          title={t('success.order')}
          note={t('success.orderNext')}
          onDone={() => router.push(`/orders/${paidOrder}`)}
        />
      )}
    </>
  );
}
