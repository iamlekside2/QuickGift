/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#35615D',
          light: '#E8F0EF',
          dark: '#2A4E4B',
        },
        orange: {
          DEFAULT: '#FD8950',
          light: '#FEF0E8',
          dark: '#E5743F',
        },
        cream: '#FBF7F1',
      },
    },
  },
  plugins: [],
};
