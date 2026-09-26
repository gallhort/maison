/** @type {import('tailwindcss').Config} */
/* Maison Orée — Design tokens
   Moka #1C1917 · Ivoire #F8F9FA · Noir #111111 · Sage #8B9467 · Sable / Terre */
module.exports = {
  content: ['./*.html', './assets/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        moka:   { DEFAULT: '#1C1917', 900: '#141210', 800: '#1C1917', 700: '#292421', 600: '#3A332E', 500: '#574D45' },
        ivoire: { DEFAULT: '#F8F9FA', 50: '#FCFCFB', 100: '#F8F9FA', 200: '#F1F0EC' },
        noir:   '#111111',
        sage:   { DEFAULT: '#8B9467', 50: '#F2F3EC', 100: '#E4E6D6', 200: '#CDD1B6', 400: '#A3AB82', 500: '#8B9467', 600: '#737B53', 700: '#5B6142', 800: '#434830' },
        sable:  { DEFAULT: '#E9E1D4', 50: '#F7F3ED', 100: '#EFE9DF', 200: '#E9E1D4', 300: '#DCCFBC', 400: '#C9B79C' },
        terre:  { DEFAULT: '#A47E5E', 300: '#C8A98C', 500: '#A47E5E', 700: '#7A5A40' },
        bronze: '#8A6A4F',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:  ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        journal: ['"Bebas Neue"', '"Archivo Black"', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(3rem, 1.4rem + 6.2vw, 7.5rem)', { lineHeight: '0.92', letterSpacing: '-0.02em' }],
        'h1':      ['clamp(2.5rem, 1.5rem + 3.8vw, 5rem)', { lineHeight: '0.98', letterSpacing: '-0.015em' }],
        'h2':      ['clamp(2rem, 1.3rem + 2.6vw, 3.75rem)', { lineHeight: '1.02', letterSpacing: '-0.01em' }],
        'h3':      ['clamp(1.5rem, 1.2rem + 1vw, 2.125rem)', { lineHeight: '1.1' }],
        'eyebrow': ['0.6875rem', { lineHeight: '1', letterSpacing: '0.22em' }],
      },
      borderRadius: { '4xl': '2rem', '5xl': '2.75rem' },
      boxShadow: {
        soft:  '0 1px 2px rgba(28,25,23,.04), 0 12px 40px -12px rgba(28,25,23,.18)',
        float: '0 30px 80px -30px rgba(17,17,17,.45)',
        inset: 'inset 0 1px 0 rgba(255,255,255,.25)',
      },
      transitionTimingFunction: { lux: 'cubic-bezier(.22,1,.36,1)', curtain: 'cubic-bezier(.76,0,.24,1)' },
      maxWidth: { shell: '1440px' },
      keyframes: {
        kenburns: { '0%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)' } },
        morph: {
          '0%,100%': { borderRadius: '58% 42% 46% 54% / 48% 56% 44% 52%' },
          '50%':     { borderRadius: '44% 56% 58% 42% / 56% 44% 56% 44%' },
        },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      animation: {
        kenburns: 'kenburns 2.4s cubic-bezier(.22,1,.36,1) both',
        morph: 'morph 18s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
};
