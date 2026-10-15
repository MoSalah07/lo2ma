'use client';

import { useState, type ReactNode } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useSession } from './api';
import { SignInSheet } from './sign-in-sheet';

type SignedInButtonProps = Omit<ButtonProps, 'onClick'> & {
  /** Runs when the user is signed in. */
  onSignedIn: () => void;
  /** Where a guest returns to after signing in. */
  next: string;
  /** Shown in the sign-in sheet, e.g. the meal they picked. */
  summary?: ReactNode;
};

/** A button for actions that need an account (paying, confirming a plan). Guests get the sign-in sheet. */
export function SignedInButton({ onSignedIn, next, summary, ...props }: SignedInButtonProps) {
  const session = useSession();
  const [asking, setAsking] = useState(false);

  return (
    <>
      <Button
        {...props}
        disabled={props.disabled || session.isPending}
        onClick={() => (session.data ? onSignedIn() : setAsking(true))}
      />
      <SignInSheet open={asking} onOpenChange={setAsking} next={next} summary={summary} />
    </>
  );
}
