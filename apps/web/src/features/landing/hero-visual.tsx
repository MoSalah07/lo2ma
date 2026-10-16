import { ChatPreview } from './chat-preview';
import { HeroSceneLazy } from './hero-scene-lazy';

/** The hero's picture: brand shapes (in 3D where the device allows) behind a chat example in plain HTML. */
export function HeroVisual() {
  return (
    <div className="relative isolate flex min-h-120 items-center justify-center overflow-hidden rounded-32 bg-tint px-5 py-10">
      <HeroSceneLazy />
      <ChatPreview />
    </div>
  );
}
