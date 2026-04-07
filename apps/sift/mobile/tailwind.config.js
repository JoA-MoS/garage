/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Sift brand palette
        sift: {
          bg: '#0f172a',      // slate-900
          surface: '#1e293b', // slate-800
          border: '#334155',  // slate-700
          accent: '#6366f1',  // indigo-500
          high: '#ef4444',    // red-500 (high importance)
          medium: '#f59e0b',  // amber-500 (medium)
          low: '#22c55e',     // green-500 (low)
        },
      },
    },
  },
  plugins: [],
};
