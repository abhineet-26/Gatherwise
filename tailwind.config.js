/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gw: {
          paper: 'var(--gw-paper, #F7F7FB)',
          surface: 'var(--gw-surface, #FFFFFF)',
          sunken: 'var(--gw-sunken, #EEEFF6)',
          'ink-900': 'var(--gw-ink-900, #1C1B3A)',
          'ink-700': 'var(--gw-ink-700, #44456A)',
          'ink-600': 'var(--gw-ink-600, #555779)',
          line: 'var(--gw-line, #DDDFEB)',
          'line-strong': 'var(--gw-line-strong, #767A9B)',
          'indigo-700': 'var(--gw-indigo-700, #3730A3)',
          'indigo-600': 'var(--gw-indigo-600, #4338CA)',
          'indigo-100': 'var(--gw-indigo-100, #E4E5FB)',
          'indigo-50': 'var(--gw-indigo-50, #F0F0FD)',
          'marigold-800': 'var(--gw-marigold-800, #7A4A00)',
          'marigold-400': 'var(--gw-marigold-400, #FFB938)',
          'marigold-100': 'var(--gw-marigold-100, #FFF0CC)',
          'peacock-700': 'var(--gw-peacock-700, #0B6B64)',
          'peacock-600': 'var(--gw-peacock-600, #0F766E)',
          'peacock-50': 'var(--gw-peacock-50, #E4F4F2)',
          'vermilion-700': 'var(--gw-vermilion-700, #A82A14)',
          'vermilion-600': 'var(--gw-vermilion-600, #B8321B)',
          'vermilion-50': 'var(--gw-vermilion-50, #FDECE8)',
        },
        primary: {
          DEFAULT: '#3730A3',
          dark: '#2E2788',
          light: '#E4E5FB',
        },
        secondary: {
          DEFAULT: '#0F766E',
          dark: '#0B6B64',
          light: '#E4F4F2',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'subtle': '8px',
        'pill': '9999px',
      },
    },
  },
  plugins: [],
}
