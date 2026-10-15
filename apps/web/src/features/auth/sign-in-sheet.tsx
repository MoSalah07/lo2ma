'use client';

import { normalizeEgyptMobile } from '@lo2ma/core';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Link, useRouter } from '@/i18n/navigation';
import { useRequestOtp } from './api';
import { PhoneField } from './phone-field';
import { verifyUrl } from './verify-url';

interface SignInSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where to come back to after signing in. */
  next: string;
  /** Shown above the form, e.g. the meal the guest picked, so they know it's kept. */
  summary?: ReactNode;
}

/** The sign-in that slides up when a guest tries to pay. Their pick stays; they return right after. */
export function SignInSheet({ open, onOpenChange, next, summary }: SignInSheetProps) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const requestOtp = useRequestOtp();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();

  function submit(event: FormEvent) {
    event.preventDefault();
    const national = normalizeEgyptMobile(phone);
    if (!national) return setError(t('invalidPhone'));
    setError(undefined);
    requestOtp.mutate(
      { channel: 'phone', destination: national },
      { onSuccess: () => router.push(verifyUrl('phone', national, next)) },
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('gate.title')}
      description={t('gate.subtitle')}
      closeLabel={tCommon('close')}
    >
      {summary}
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <PhoneField
          label={t('phoneLabel')}
          value={phone}
          onChange={setPhone}
          error={error}
          surface="bg"
        />
        <div className="flex flex-col gap-1">
          <Button type="submit" block disabled={requestOtp.isPending}>
            {t('sendCode')}
          </Button>
          <Link
            href={`/sign-in?channel=email&next=${encodeURIComponent(next)}`}
            className={buttonVariants({ variant: 'link', size: 'sm' })}
          >
            {t('gate.useEmail')}
          </Link>
        </div>
      </form>
    </Sheet>
  );
}
