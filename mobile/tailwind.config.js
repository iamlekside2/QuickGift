/** @type {import('tailwindcss').Config} */
// QuickGift redesign tokens — see docs handoff "Design Tokens (REPLACES the old theme)".
// Existing class names (teal / orange / cream) are kept but remapped to the new palette,
// so all prior `bg-teal` / `text-orange` / `bg-cream` usages re-skin in place.
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary — deep teal (old #35615D retired)
        teal: {
          DEFAULT: '#1F4A45',
          light: '#E7EFEC',   // teal tint
          dark: '#163530',
        },
        // Secondary — terracotta (old #FD8950 retired)
        orange: {
          DEFAULT: '#E8632F',
          light: '#FBE4D7',   // terracotta tint
          dark: '#C94F1F',
        },
        // Terracotta alias for clarity in new code
        terracotta: {
          DEFAULT: '#E8632F',
          light: '#FBE4D7',
          dark: '#C94F1F',
        },
        // Warm cream backgrounds
        cream: {
          DEFAULT: '#F6F1E8',  // app screens
          warm: '#FAF3E9',     // splash / auth / onboarding sheet
        },
        // Ink (text)
        ink: {
          DEFAULT: '#211F1C',  // primary text
          soft: '#6E6A63',     // secondary text
          caption: '#9A948A',  // captions
          placeholder: '#B5AFA2',
        },
        // Sand / surfaces
        sand: {
          DEFAULT: '#EDE3D8',
          light: '#F5F0E7',
          mid: '#F0ECE3',
        },
        line: {
          border: '#EAE3D8',
          divider: '#F5F0E7',
        },
        // Semantic
        success: { DEFAULT: '#3E8E63', bg: '#E4F0E9' },
        info: { DEFAULT: '#4C7CB0', bg: '#E7EEF6' },
        danger: { DEFAULT: '#D24B4B', bg: '#FBE6E6' },
        purple: { DEFAULT: '#7A5FA8', bg: '#EFE9F6' },
        gold: { DEFAULT: '#B8862E', light: '#E8B65A' },
        // Dark surface (landing only, kept for parity)
        darksurface: '#211F1C',

        // --- Override default Tailwind scales to the warm redesign palette ---
        // The app has 700+ className uses of gray/green/red/blue/amber/purple.
        // Remapping the scales re-skins them all to warm neutrals + muted semantics.
        gray: {
          50: '#F5F0E7',
          100: '#F0ECE3',
          200: '#EAE3D8',
          300: '#DED5C7',
          400: '#9A948A',
          500: '#6E6A63',
          600: '#5C584F',
          700: '#3A3733',
          800: '#211F1C',
          900: '#1A1815',
        },
        green: {
          50: '#E4F0E9', 100: '#D6E8DD', 200: '#BFDDCB', 300: '#95C6AA',
          400: '#5FA97E', 500: '#3E8E63', 600: '#357C57', 700: '#2F6E4C', 800: '#245538', 900: '#1C4029',
        },
        emerald: {
          50: '#E4F0E9', 100: '#D6E8DD', 200: '#BFDDCB', 300: '#95C6AA',
          400: '#5FA97E', 500: '#3E8E63', 600: '#357C57', 700: '#2F6E4C', 800: '#245538', 900: '#1C4029',
        },
        red: {
          50: '#FBE6E6', 100: '#F7D4D4', 200: '#F0B4B4', 300: '#E89494',
          400: '#DE6E6E', 500: '#D24B4B', 600: '#C0392F', 700: '#A32E2E', 800: '#8A2626', 900: '#701E1E',
        },
        rose: {
          50: '#FBE6E6', 100: '#F7D4D4', 200: '#F0B4B4', 300: '#E89494',
          400: '#DE6E6E', 500: '#D24B4B', 600: '#C0392F', 700: '#A32E2E', 800: '#8A2626', 900: '#701E1E',
        },
        blue: {
          50: '#E7EEF6', 100: '#D5E2F0', 200: '#B6CDE4', 300: '#8FB1D3',
          400: '#6A95C1', 500: '#4C7CB0', 600: '#3F6A9A', 700: '#345680', 800: '#2A4467', 900: '#21344E',
        },
        indigo: {
          50: '#EFE9F6', 100: '#E2D8F0', 200: '#CDBBE4', 300: '#B197D3',
          400: '#9779C0', 500: '#7A5FA8', 600: '#684F90', 700: '#544075', 800: '#42325C', 900: '#332748',
        },
        purple: {
          50: '#EFE9F6', 100: '#E2D8F0', 200: '#CDBBE4', 300: '#B197D3',
          400: '#9779C0', 500: '#7A5FA8', 600: '#684F90', 700: '#544075', 800: '#42325C', 900: '#332748',
        },
        amber: {
          50: '#F7EFD9', 100: '#F0E4C0', 200: '#E8D49A', 300: '#E0C273',
          400: '#E8B65A', 500: '#C89A3E', 600: '#B8862E', 700: '#977026', 800: '#7A5B20', 900: '#5E461A',
        },
        yellow: {
          50: '#F7EFD9', 100: '#F0E4C0', 200: '#E8D49A', 300: '#E0C273',
          400: '#E8B65A', 500: '#C89A3E', 600: '#B8862E', 700: '#977026', 800: '#7A5B20', 900: '#5E461A',
        },
      },
      // Only family keys here — weight is handled globally (see src/utils/fonts.js),
      // which maps fontWeight -> the matching Plus Jakarta Sans family. Naming a family
      // key `semibold`/`bold` would collide with Tailwind's font-weight utilities.
      fontFamily: {
        serif: ['InstrumentSerif_400Regular'],
        'serif-italic': ['InstrumentSerif_400Regular_Italic'],
        sans: ['PlusJakartaSans_400Regular'],
      },
      borderRadius: {
        pill: '100px',
        card: '22px',
        sheet: '28px',
        control: '16px',
        tile: '13px',
      },
    },
  },
  plugins: [],
};
