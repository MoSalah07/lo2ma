'use client';

import {
  EGYPT_DIAL_CODE,
  formatCountdown,
  formatEgyptMobile,
  OTP_LENGTH,
  type OtpChannel,
} from '@lo2ma/core';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { BottomAction } from '@/components/bottom-action';
import { Button, buttonVariants } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api';
import { useRequestOtp, useVerifyOtp } from './api';

/** How long before «ابعت تاني» is allowed. */
const RESEND_AFTER_SECONDS = 60;
const CODE_VALID_MINUTES = 5;

interface VerifyFormProps {
  channel: OtpChannel;
  destination: string;
  next: string;
}

export function VerifyForm({ channel, destination, next }: VerifyFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const verify = useVerifyOtp();
  const resend = useRequestOtp();
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_AFTER_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((left) => Math.max(0, left - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const wrongCode = verify.error instanceof ApiError && verify.error.code === 'invalid_code';
  const shown =
    channel === 'phone' ? `${EGYPT_DIAL_CODE} ${formatEgyptMobile(destination)}` : destination;

  function submit(value = code) {
    if (value.length !== OTP_LENGTH) return;
    verify.mutate({ channel, destination, code: value }, { onSuccess: () => router.replace(next) });
  }

  function sendAgain() {
    resend.mutate(
      { channel, destination },
      { onSuccess: () => setSecondsLeft(RESEND_AFTER_SECONDS) },
    );
    setCode('');
    verify.reset();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-7 px-gutter pt-gutter"
    >
      <div className="flex flex-col gap-2.5">
        <h1 className="text-28 leading-heading font-extrabold">{t('auth.otp.title')}</h1>
        <p className="text-15 leading-loose text-muted">
          {t.rich('auth.otp.sentTo', {
            destination: shown,
            number: (chunks) => (
              <bdi dir="ltr" className="font-semibold text-ink">
                {chunks}
              </bdi>
            ),
          })}
        </p>
        <Link
          href={`/sign-in?channel=${channel}&next=${encodeURIComponent(next)}`}
          className={buttonVariants({ variant: 'link', size: 'sm', className: 'self-start px-0' })}
        >
          {t('auth.otp.changeNumber')}
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <OtpInput
          value={code}
          onChange={(value) => {
            setCode(value);
            if (verify.isError) verify.reset();
          }}
          onComplete={submit}
          length={OTP_LENGTH}
          label={t('auth.otp.label')}
          invalid={wrongCode}
        />
        <p
          role={wrongCode ? 'alert' : undefined}
          className={wrongCode ? 'text-12 text-on-danger' : 'text-12 text-muted'}
        >
          {wrongCode
            ? t('auth.otp.invalidCode')
            : t('auth.otp.validFor', {
                duration: t('common.minutes', { count: CODE_VALID_MINUTES }),
              })}
        </p>
      </div>

      <div className="flex items-center gap-1.5 text-14">
        <span className="text-muted">{t('auth.otp.noCode')}</span>
        <Button
          variant="link"
          size="sm"
          className="px-1"
          disabled={secondsLeft > 0 || resend.isPending}
          onClick={sendAgain}
        >
          {secondsLeft > 0
            ? t('auth.otp.resendIn', { time: formatCountdown(secondsLeft) })
            : t('auth.otp.resend')}
        </Button>
      </div>

      <BottomAction>
        <Button type="submit" block disabled={code.length !== OTP_LENGTH || verify.isPending}>
          {t('auth.otp.verify')}
        </Button>
      </BottomAction>
    </form>
  );
}
