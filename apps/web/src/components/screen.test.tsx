import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Screen, ScreenHeader } from './screen';

describe('Screen', () => {
  it('puts every screen on the same gutter and spacing, with room for the tab bar when asked', () => {
    const { container } = render(<Screen clear="nav">content</Screen>);
    expect(container.firstElementChild).toHaveClass('px-gutter', 'gap-stack', 'pb-clear-nav');
  });

  it('keeps a little room at the end by default, and still takes extra classes', () => {
    const { container } = render(<Screen className="pt-1">content</Screen>);
    expect(container.firstElementChild).toHaveClass('pb-clear-end', 'pt-1');
  });
});

describe('ScreenHeader', () => {
  it('shows the title as the page heading, with anything else at the end of its row', () => {
    render(
      <ScreenHeader title="خطة الأسبوع">
        <span>18 – 22 أكتوبر</span>
      </ScreenHeader>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'خطة الأسبوع' })).toBeInTheDocument();
    expect(screen.getByText('18 – 22 أكتوبر')).toBeInTheDocument();
  });
});
