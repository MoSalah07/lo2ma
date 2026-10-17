// Text comes in roles, named after Material 3's type scale (display, headline, title, body, label), so a screen
// says what a piece of text is (text-title-lg) and this file says how big that is. Changing a role here changes it
// everywhere: the web app through Tailwind, and the mobile app later through NativeWind.

/** A role: its size in px, its line height, and the weight it comes in unless a screen says otherwise. */
export interface TextRole {
  size: number;
  lineHeight: number;
  weight?: number;
}

export const textRoles = {
  /** The landing page's main heading, growing with the screen (display-sm, then -md and -lg). */
  'display-lg': { size: 52, lineHeight: 1.15, weight: 800 },
  'display-md': { size: 40, lineHeight: 1.2, weight: 800 },
  'display-sm': { size: 32, lineHeight: 1.25, weight: 800 },
  /** A big number (the arrival time, a KPI) and the landing's section headings on wide screens. */
  'headline-lg': { size: 32, lineHeight: 1.3, weight: 800 },
  'headline-md': { size: 28, lineHeight: 1.3, weight: 800 },
  /** A screen's title. */
  'headline-sm': { size: 24, lineHeight: 1.3, weight: 800 },
  /** A sheet's or a section's title, a price that leads a card. */
  'title-lg': { size: 20, lineHeight: 1.3, weight: 800 },
  /** A card's or a row's title. */
  'title-md': { size: 16, lineHeight: 1.4, weight: 700 },
  /** A small heading inside a card or a table. */
  'title-sm': { size: 14, lineHeight: 1.4, weight: 700 },
  /** The landing's opening paragraph on wide screens. */
  lead: { size: 17, lineHeight: 1.7 },
  /** Large buttons and the landing's paragraphs. */
  'body-lg': { size: 15, lineHeight: 1.6 },
  /** Most text. */
  'body-md': { size: 14, lineHeight: 1.6 },
  /** Secondary text under a title. */
  'body-sm': { size: 13, lineHeight: 1.6 },
  /** A field's label, a tab, a selected option. */
  'label-lg': { size: 14, lineHeight: 1.4, weight: 600 },
  'label-md': { size: 13, lineHeight: 1.4, weight: 600 },
  /** A badge or a tab bar label. */
  'label-sm': { size: 11, lineHeight: 1.4, weight: 600 },
  /** Hints, meta lines, small print. */
  caption: { size: 12, lineHeight: 1.5 },
  'caption-sm': { size: 11, lineHeight: 1.5 },
} as const satisfies Record<string, TextRole>;

export type TextRoleName = keyof typeof textRoles;

/** Line heights for text that sets its own, apart from its role (a long title, a tight number). */
export const lineHeights = { heading: 1.3, body: 1.6, loose: 1.7 } as const;

/** The CSS variable next/font sets for Alexandria in the web app. */
export const fontVariable = '--font-alexandria';

export const fontFallback = '"Segoe UI", Tahoma, sans-serif';
