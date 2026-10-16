import { notFound } from 'next/navigation';

/** Every path that matches no page lands here, so it gets the localized 404 inside the app's layout. */
export default function CatchAll() {
  notFound();
}
