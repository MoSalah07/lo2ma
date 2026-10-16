import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SceneProps } from './lazy-scene';

// LazyScene checks the device once per page, so every test loads a fresh copy of the module.
async function renderScene({
  webgl,
  reducedMotion,
  deferred = false,
}: {
  webgl: boolean;
  reducedMotion: boolean;
  deferred?: boolean;
}) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    webgl ? ({ getExtension: () => null } as unknown as RenderingContext) : null,
  );
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: reducedMotion && query.includes('reduce'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
  const { LazyScene } = await import('./lazy-scene');
  let decline = () => {};
  function Scene({ onDecline }: SceneProps) {
    decline = onDecline;
    return <p>scene</p>;
  }
  render(<LazyScene scene={Scene} fallback={<p>still</p>} rtl={false} deferred={deferred} />);
  return { decline: () => act(() => decline()) };
}

describe('LazyScene', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.restoreAllMocks());

  it('shows the still picture where WebGL is missing', async () => {
    await renderScene({ webgl: false, reducedMotion: false });
    expect(screen.getByText('still')).toBeInTheDocument();
    expect(screen.queryByText('scene')).toBeNull();
  });

  it('shows the scene where the device can run it', async () => {
    await renderScene({ webgl: true, reducedMotion: false });
    expect(screen.getByText('scene')).toBeInTheDocument();
  });

  it('keeps the still picture for people who turn motion off', async () => {
    await renderScene({ webgl: true, reducedMotion: true });
    expect(screen.getByText('still')).toBeInTheDocument();
  });

  it('waits for the page to settle when deferred, and starts on the first interaction', async () => {
    await renderScene({ webgl: true, reducedMotion: false, deferred: true });
    expect(screen.getByText('still')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('pointermove'));
    });
    expect(screen.getByText('scene')).toBeInTheDocument();
  });

  it('goes back to the still picture when the frame rate drops', async () => {
    const scene = await renderScene({ webgl: true, reducedMotion: false });
    scene.decline();
    expect(screen.getByText('still')).toBeInTheDocument();
    expect(screen.queryByText('scene')).toBeNull();
  });
});
