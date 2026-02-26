import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{js,jsx,css}'],
  theme: {
    extend: {
      screens: {
        '3xl': '1600px',
        '4xl': '1800px',
      },
    },
  },
  plugins: [typography],
};
