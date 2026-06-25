/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  // The app toggles dark mode by adding `.dark` to <body>, not the default <html>.
  darkMode: ['selector', 'body.dark'],
  // Preflight (Tailwind's CSS reset) is intentionally OFF so it doesn't clobber
  // the hand-rolled design system in index.css. Tailwind only fills in the
  // missing utility classes (spacing, flex, sizing, palette, variants).
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      // Map the design-system accent/status tokens to their CSS variables so
      // utilities like `bg-accent-primary`, `text-accent-indigo`, `bg-success`
      // resolve. Ambiguous names (primary/secondary/tertiary) are deliberately
      // left to index.css, which keeps its own meaning for `.text-primary` etc.
      colors: {
        'accent-primary': 'var(--accent-primary)',
        'accent-success': 'var(--accent-success)',
        'accent-warning': 'var(--accent-warning)',
        'accent-danger': 'var(--accent-danger)',
        'accent-purple': 'var(--accent-purple)',
        'accent-indigo': 'var(--accent-indigo)',
        success: 'var(--accent-success)',
        warning: 'var(--accent-warning)',
        danger: 'var(--accent-danger)',
      },
      borderColor: {
        // Default any `border*` utility to the design-system border color.
        DEFAULT: 'var(--border-color)',
        color: 'var(--border-color)',
      },
    },
  },
  plugins: [],
};
