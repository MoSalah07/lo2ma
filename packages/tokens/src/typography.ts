/** Font sizes in px, exactly as used in the designs. The CSS uses rem so text follows the browser's font size. */
export const fontSizes = [
  11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 26, 28, 30, 32, 34, 44, 56,
] as const;

export const lineHeights = { heading: 1.3, body: 1.6, loose: 1.7 } as const;

/** The CSS variable next/font sets for Alexandria in the web app. */
export const fontVariable = '--font-alexandria';

export const fontFallback = '"Segoe UI", Tahoma, sans-serif';
