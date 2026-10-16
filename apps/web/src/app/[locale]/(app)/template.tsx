import type { ReactNode } from 'react';
import { ScreenEntrance } from '@/components/motion/entrance';

/** Every app screen fades in after navigating. A template remounts on each navigation, a layout doesn't. */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <ScreenEntrance className="flex flex-1 flex-col">{children}</ScreenEntrance>;
}
