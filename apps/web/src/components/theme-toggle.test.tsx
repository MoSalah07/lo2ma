import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from './theme-provider';
import { ThemeToggle } from './theme-toggle';

const labels = { dark: 'الوضع الغامق', light: 'الوضع الفاتح' };

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle labels={labels} />
    </ThemeProvider>,
  );
}

describe('ThemeToggle', () => {
  it('offers dark mode while the page is light', () => {
    renderToggle();
    expect(screen.getByRole('button', { name: labels.dark })).toBeInTheDocument();
  });

  it('switches the page to dark, then offers light mode', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('button', { name: labels.dark }));

    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: labels.light })).toBeInTheDocument();
  });
});
