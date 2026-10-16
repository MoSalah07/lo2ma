import { ChatPreview } from './chat-preview';

/**
 * The hero's picture: brand shapes behind a chat example. The shapes mark where the 3D scene goes
 * (tasks 25–27), and this still version stays as its fallback for weak devices and reduced motion.
 */
export function HeroVisual() {
  return (
    <div className="relative isolate flex min-h-120 items-center justify-center overflow-hidden rounded-32 bg-tint px-5 py-10">
      <div aria-hidden className="absolute -end-12 -top-14 size-52.5 rounded-full bg-primary" />
      <div
        aria-hidden
        className="absolute -start-8.5 bottom-9 size-33 -rotate-14 rounded-32 bg-pink"
      />
      <div
        aria-hidden
        className="absolute end-14 -bottom-4.5 h-16 w-42 rotate-9 rounded-full bg-lilac"
      />
      <div
        aria-hidden
        className="absolute start-10 top-11 size-7 rounded-full ring-6 ring-primary ring-inset"
      />
      <ChatPreview />
    </div>
  );
}
