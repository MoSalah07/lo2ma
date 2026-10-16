'use client';

import { normalizeEgyptMobile, type OtpChannel } from '@lo2ma/core';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { segmentedItem } from '@/components/ui/segmented';
import { Link, useRouter } from '@/i18n/navigation';
import { useRequestOtp } from './api';
import { PhoneField } from './phone-field';
import { verifyUrl } from './verify-url';

const EMAIL = /^\S+@\S+\.\S+$/;

interface SignInFormProps {
  initialChannel: OtpChannel;
  next: string;
}

/** Phone or email, then a one-time code. The same form signs in and signs up. */
export function SignInForm({ initialChannel, next }: SignInFormProps) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const requestOtp = useRequestOtp();
  const [channel, setChannel] = useState<OtpChannel>(initialChannel);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();

  function submit(event: FormEvent) {
    event.preventDefault();
    const destination =
      channel === 'phone'
        ? normalizeEgyptMobile(phone)
        : EMAIL.test(email.trim())
          ? email.trim()
          : null;
    if (!destination) return setError(channel === 'phone' ? t('invalidPhone') : t('invalidEmail'));
    setError(undefined);
    requestOtp.mutate(
      { channel, destination },
      { onSuccess: () => router.push(verifyUrl(channel, destination, next)) },
    );
  }

  function switchTo(next: OtpChannel) {
    setChannel(next);
    setError(undefined);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-5 px-gutter pt-9">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-26 leading-heading font-extrabold">{t('title')}</h1>
          <p className="text-14 leading-body text-muted">{t('subtitle')}</p>
        </div>

        <div role="group" className="grid grid-cols-2 gap-1 rounded-26 bg-divider p-1">
          <button
            type="button"
            aria-pressed={channel === 'phone'}
            onClick={() => switchTo('phone')}
            className={segmentedItem({ active: channel === 'phone', className: 'text-14' })}
          >
            {t('byPhone')}
          </button>
          <button
            type="button"
            aria-pressed={channel === 'email'}
            onClick={() => switchTo('email')}
            className={segmentedItem({ active: channel === 'email', className: 'text-14' })}
          >
            {t('byEmail')}
          </button>
        </div>

        {channel === 'phone' ? (
          <PhoneField
            label={t('phoneLabel')}
            value={phone}
            onChange={setPhone}
            hint={t('phoneHint')}
            error={error}
          />
        ) : (
          <Field label={t('emailLabel')} hint={t('emailHint')} error={error}>
            {(control) => (
              <Input
                {...control}
                type="email"
                dir="ltr"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-14 rounded-20 bg-surface text-start ring-1 ring-line ring-inset"
              />
            )}
          </Field>
        )}
      </div>

      <div className="flex flex-col gap-3 px-gutter pt-3 pb-screen-end">
        <Button type="submit" block disabled={requestOtp.isPending}>
          {t('sendCode')}
        </Button>
        <div aria-hidden className="flex items-center gap-3 text-12 text-muted">
          <span className="h-px flex-1 bg-line" />
          {tCommon('or')}
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Link
            href="/chat"
            className={buttonVariants({ variant: 'outline', size: 'md', block: true })}
          >
            {t('guest')}
          </Link>
          <p className="text-center text-12 text-muted">{t('guestNote')}</p>
        </div>
        <p className="text-center text-12 leading-loose text-muted">
          {t.rich('terms', {
            terms: (chunks) => <strong className="font-semibold text-primary-ink">{chunks}</strong>,
            privacy: (chunks) => (
              <strong className="font-semibold text-primary-ink">{chunks}</strong>
            ),
          })}
        </p>
      </div>
    </form>
  );
}
