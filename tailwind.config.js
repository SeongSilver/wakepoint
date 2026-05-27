/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary:      '#4F46E5',  // only accent — indigo
        'primary-dk': '#818cf8',  // primary on dark tiles — indigo light
        success:      '#10B981',  // active alarm, accepted state
        canvas:       '#ffffff',
        parchment:    '#f5f5f7',  // canvas-parchment
        pearl:        '#fafafc',  // surface-pearl
        'tile-dark':  '#272729',  // dark tile
        ink:          '#1d1d1f',  // headlines & body
        'ink-muted':  '#7a7a7a',  // disabled / fine-print
        hairline:     '#e0e0e0',  // card borders
        danger:       '#ef4444',  // destructive actions only
        kakao:        '#FEE500',  // KakaoTalk brand yellow
      },
    },
  },
  plugins: [],
};
