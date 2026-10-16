import { durations, easings, travel } from '@lo2ma/tokens';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Appear, Reveal, ScreenEntrance, Sequence, SequenceItem } from './entrance';
import { rise } from './presets';

describe('motion entrances', () => {
  it('never hide what comes with the page: the server HTML is fully visible', () => {
    const html = renderToString(
      <>
        <Appear>first</Appear>
        <Reveal>below</Reveal>
        <ScreenEntrance>screen</ScreenEntrance>
        <Sequence as="ul">
          <li>
            <SequenceItem>item</SequenceItem>
          </li>
        </Sequence>
      </>,
    );
    expect(html).toContain('first');
    expect(html).toContain('item');
    expect(html).not.toMatch(/opacity:\s*0/);
    expect(html).not.toContain('translateY');
  });

  it('start hidden when they mount in the browser later, to rise in', () => {
    const { container } = render(<Appear>new message</Appear>);
    expect(screen.getByText('new message')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveStyle({ opacity: '0' });
  });

  it('keep the semantic element they are given', () => {
    render(
      <Sequence as="ol">
        <li>
          <SequenceItem>day</SequenceItem>
        </li>
      </Sequence>,
    );
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(screen.getByRole('listitem')).toHaveTextContent('day');
  });

  it('take every number from the motion tokens', () => {
    expect(rise.hidden).toEqual({ opacity: 0, y: travel });
    expect(rise.shown).toMatchObject({
      transition: { duration: durations.enter / 1000, ease: easings.enter },
    });
  });
});
