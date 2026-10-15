import type { ReactNode } from 'react';

/** The app is designed for phones: on wider screens it stays a phone-width column in the middle. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">{children}</div>;
}
