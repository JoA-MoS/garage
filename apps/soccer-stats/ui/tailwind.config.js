const { join } = require('path');

const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      // Touch target accessibility - minimum 44px per Apple HIG / WCAG 2.1
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      // Optional: spacing value for touch-friendly padding
      spacing: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
