import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Physical direction classes break RTL. Use logical ones: ms- me- ps- pe- start- end- text-start border-s rounded-s.
const physicalClass = [
  String.raw`(^|[\s:!])-?(m[lr]|p[lr]|left|right|scroll-[mp][lr])-`,
  String.raw`(^|[\s:!])(border-[lr]|rounded-[lr]|rounded-[tb][lr]|(text|float|clear)-(left|right))($|[\s-])`,
].join('|');

// Colors come from @lo2ma/tokens only: no hex, rgb() or hsl() in code, and no arbitrary Tailwind color/size values.
const rawColor = String.raw`#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch)\(`;
const arbitraryValue = String.raw`(^|[\s:!])(bg|text|border|ring|fill|stroke|from|via|to|shadow|rounded|outline|decoration|divide|caret|accent)-\[`;

// Page widths come from @lo2ma/tokens. Tailwind's named widths are switched off, so they would silently do nothing.
const namedWidth = String.raw`(^|[\s:!])(max-w|min-w|w)-(3xs|2xs|xs|sm|md|lg|xl|[2-7]xl|prose|screen-\w+)($|\s)`;

const inStrings = (pattern, message) => [
  { selector: `Literal[value=/${pattern}/]`, message },
  { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
];

const RTL =
  'Use logical classes (ms- me- ps- pe- start- end- text-start border-s rounded-s), see Conventions in apps/web/README.md.';
const TOKENS =
  'Use a design token class (bg-surface, text-15, rounded-26…), not a raw value. See Conventions in apps/web/README.md.';
const TEXT = 'User-facing text comes from @lo2ma/i18n (useTranslations / getTranslations).';
const LAYOUT =
  'Page widths are layout tokens (max-w-app, max-w-site, max-w-admin); screens use <Screen> for gutter and spacing. See Conventions in apps/web/README.md.';

export default defineConfig([
  globalIgnores([
    '**/.next/**',
    '**/coverage/**',
    // Playwright's reports and traces: generated, and ignored by git too.
    '**/playwright-report/**',
    '**/test-results/**',
    '**/blob-report/**',
    '**/next-env.d.ts',
    'apps/web/public/mockServiceWorker.js',
  ]),

  ...nextVitals,
  ...nextTypeScript,

  // Type-aware rules (no floating promises, no unsafe any) for every TypeScript file in the repo.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: { parserOptions: { projectService: true } },
  },

  {
    settings: { next: { rootDir: 'apps/web' } },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      // `const { role, ...dish } = item` is how we drop a field; that `role` is intentionally unused.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true, argsIgnorePattern: '^_' },
      ],
      'react/jsx-no-literals': [
        'error',
        { noStrings: false, allowedStrings: ['·', '×', '•', '…', '+', '−', '-', '/', '%', ':'] },
      ],
      'no-restricted-syntax': [
        'error',
        ...inStrings(physicalClass, RTL),
        ...inStrings(rawColor, TOKENS),
        ...inStrings(arbitraryValue, TOKENS),
        ...inStrings(namedWidth, LAYOUT),
        {
          // An empty alt is not text: it marks a decorative image, so screen readers skip it.
          selector: 'JSXAttribute[name.name=/^(aria-label|title|alt)$/] > Literal[value=/.+/]',
          message: TEXT,
        },
        {
          // next/image's placeholder is a loading mode ("blur"), not a prompt.
          selector:
            "JSXOpeningElement[name.name!='Image'] > JSXAttribute[name.name='placeholder'] > Literal",
          message: TEXT,
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['useMemo', 'useCallback', 'memo'],
              message:
                'The React Compiler memoizes for you. Add manual memoization only after profiling, with a comment.',
            },
            {
              name: 'next/link',
              message: 'Use Link from @/i18n/navigation so the locale is kept.',
            },
            {
              name: 'next/navigation',
              importNames: ['useRouter', 'usePathname', 'redirect', 'permanentRedirect'],
              message: 'Use the locale-aware version from @/i18n/navigation.',
            },
          ],
        },
      ],
    },
  },

  // Tokens are the one place raw colors live.
  {
    files: ['packages/tokens/**'],
    rules: { 'no-restricted-syntax': 'off' },
  },

  // Tests render sample text and use test-only shortcuts.
  {
    files: ['**/*.test.{ts,tsx}', '**/vitest.setup.ts', '**/e2e/**'],
    rules: {
      'react/jsx-no-literals': 'off',
      'no-restricted-syntax': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // Playwright fixtures call a function named `use`; it is not a React hook.
  {
    files: ['**/e2e/**'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },

  // Plain JS config files are not part of any tsconfig, so skip type-aware rules there.
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Prettier owns formatting; turn off every rule that would fight it.
  prettier,
]);
