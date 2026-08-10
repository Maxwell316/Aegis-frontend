import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/sw.js',
      'public/workbox-*.js',
      'public/swe-worker-*.js',
      'public/worker-*.js',
      'jest.config.js',
      'tailwind.config.ts',
      'next.config.mjs',
      'postcss.config.mjs',
    ],
  },
  {
    rules: {
      // Noisy React 19 compiler rules — downgraded to warn (legacy codebase).
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      // Common in TS payload typing — downgraded to warn.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
