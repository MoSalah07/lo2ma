import Image from 'next/image';
import { ChatPreview } from './chat-preview';
import { HeroSceneLazy } from './hero-scene-lazy';
import koshariHand from './photos/koshari-hand.jpg';

/**
 * The hero's picture: a real bowl of koshari fading into the page, real ingredients floating around it in 3D where
 * the device allows, and the chat example in plain HTML. The photo is the first thing to load.
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
        // The photo itself fades out before its edges (a mask, not a page-colored layer on top), so it melts into
        // the page in either theme and no edge of the box can show, not even a hairline between two layers.
        className="-z-10 object-cover mask-radial-closest-side mask-radial-from-50% mask-radial-to-100%"
      />
      <HeroSceneLazy />
      <div className="relative w-full max-w-85 pb-6">
        <ChatPreview />
      </div>
    </div>
  );
}
