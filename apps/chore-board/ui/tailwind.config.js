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
      backgroundImage: {
        checkered:
          'repeating-conic-gradient(black 0% 25%, transparent 0% 50%) 50% / 40px 40px',
      },
      gridTemplateAreas: {
        scramble: ['nav  main  finnish', 'footer footer footer'],
      },
      gridTemplateColumns: {
        scramble: 'auto 2fr auto',
      },
      gridTemplateRows: {
        scramble: ` 1fr
                    auto`,
      },
    },
  },
  plugins: [require('@savvywombat/tailwindcss-grid-areas')],
};
