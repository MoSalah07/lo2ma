import Image from 'next/image';
import { ChatPreview } from './chat-preview';
import { HeroSceneLazy } from './hero-scene-lazy';
import koshariHand from './photos/koshari-hand.jpg';

/**
 * The hero's picture: a real bowl of koshari fading into the page in either theme, real ingredients floating around it in
 * 3D where the device allows, and the chat example in plain HTML. The photo is the first thing to load.
 */
export function HeroVisual() {
  return (
    <div className="relative isolate flex min-h-120 items-end justify-center lg:min-h-150">
      <Image
        src={koshariHand}
        alt=""
        // The page's largest paint: announced in the head (preload) and fetched first (high priority).
        preload
        fetchPriority="high"
        fill
        sizes="(min-width: 1024px) 45vw, 100vw"
        placeholder="blur"
        className="-z-20 object-cover"
      />
      {/* The photo's edges fade into the page, so it reads as part of the page, not a box. The ellipse reaches the
          corners and crosses the middle of each side at 1/√2 (70.7%) of the way, so ending at 70% leaves no edge. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-radial from-bg/0 from-35% to-bg to-70%"
      />
      <HeroSceneLazy />
      <div className="relative w-full max-w-85 pb-6">
        <ChatPreview />
      </div>
    </div>
  );
}
