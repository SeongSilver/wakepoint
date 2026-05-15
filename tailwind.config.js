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
        primary:      '#0066cc',  // only accent
        'primary-dk': '#2997ff',  // primary on dark tiles
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
