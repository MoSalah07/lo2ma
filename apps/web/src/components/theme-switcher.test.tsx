import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from './theme-provider';
import { ThemeSwitcher } from './theme-switcher';

const labels = { light: 'فاتح', dark: 'غامق', system: 'زي الجهاز' };

function renderSwitcher() {
  return render(
    <ThemeProvider>
      <ThemeSwitcher label="المظهر" labels={labels} />
    </ThemeProvider>,
  );
}

describe('ThemeSwitcher', () => {
  it('is a labelled group with one button per option', () => {
    renderSwitcher();
    const group = screen.getByRole('group', { name: 'المظهر' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('follows the system theme by default', () => {
    renderSwitcher();
    expect(screen.getByRole('button', { name: 'زي الجهاز' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('switches the page to dark and marks the choice as pressed', async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole('button', { name: 'غامق' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'غامق' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'زي الجهاز' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('remembers the choice', async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole('button', { name: 'غامق' }));

    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
