'use client';

import { OTP_LENGTH } from '@lo2ma/core';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { IconButton } from '@/components/ui/icon-button';
import { OtpInput } from '@/components/ui/otp-input';
import { useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api';
import { useAdminSignIn, useAdminVerify } from '../api';

const failedWith = (error: unknown, code: string) =>
  error instanceof ApiError && error.code === code;

/** Step one: email and password. Step two: the code from the authenticator app. */
export function AdminSignInForm({ next }: { next: string }) {
  const t = useTranslations('admin.signIn');
  const router = useRouter();
  const signIn = useAdminSignIn();
  const verify = useAdminVerify();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');

  const challenge = signIn.data?.challenge;
  const wrongPassword = failedWith(signIn.error, 'invalid_credentials');
  const wrongCode = failedWith(verify.error, 'invalid_code');

  function submitPassword(event: FormEvent) {
    event.preventDefault();
    signIn.mutate({ email: email.trim(), password });
  }

  function submitCode(value = code) {
    if (!challenge || value.length !== OTP_LENGTH) return;
    verify.mutate(
      { challenge, code: value },
      {
        onSuccess: () => router.replace(next),
        // A fresh, empty code box is easier to retype into than six wrong digits.
        onError: () => setCode(''),
      },
    );
  }

  function startOver() {
    signIn.reset();
    verify.reset();
    setCode('');
  }

  if (challenge) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitCode();
        }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-26 leading-heading font-extrabold">{t('codeTitle')}</h1>
          <p className="text-14 leading-body text-muted">{t('codeHint')}</p>
        </div>
        <div className="flex flex-col gap-2">
          <OtpInput
            value={code}
            onChange={(value) => {
              setCode(value);
              if (verify.isError) verify.reset();
            }}
            onComplete={submitCode}
            length={OTP_LENGTH}
            label={t('codeLabel')}
            invalid={wrongCode}
          />
          {wrongCode && (
            <p role="alert" className="text-12 text-on-danger">
              {t('invalidCode')}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            size="md"
            block
            disabled={code.length !== OTP_LENGTH || verify.isPending}
          >
            {t('verify')}
          </Button>
          <Button variant="link" size="sm" onClick={startOver}>
            {t('otherAccount')}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-26 leading-heading font-extrabold">{t('title')}</h1>
        <p className="text-14 leading-body text-muted">{t('subtitle')}</p>
      </div>

      <form onSubmit={submitPassword} noValidate className="flex flex-col gap-4">
        <Field label={t('email')}>
          {(control) => (
            <Input
              {...control}
              type="email"
              dir="ltr"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-13 text-start"
            />
          )}
        </Field>
        <Field label={t('password')} error={wrongPassword ? t('invalid') : undefined}>
          {(control) => (
            <div className="flex h-13 items-center gap-1 rounded-16 bg-surface-2 pe-1">
              <Input
                {...control}
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 min-w-0 flex-1 bg-transparent"
              />
              <IconButton
                label={showPassword ? t('hidePassword') : t('showPassword')}
                icon={showPassword ? EyeOff : Eye}
                variant="ghost"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((shown) => !shown)}
              />
            </div>
          )}
        </Field>
        <Button type="submit" size="md" block disabled={signIn.isPending} className="mt-1 h-13">
          {t('submit')}
        </Button>
      </form>

      <p className="flex items-start gap-2.5 rounded-16 bg-surface-2 px-3.5 py-3 text-12 leading-body text-ink-2">
        <ShieldCheck aria-hidden className="mt-0.5 size-4.5 shrink-0" />
        {t('twofa')}
      </p>
    </>
  );
}
