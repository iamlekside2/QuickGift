// QuickGift redesign theme — mirrors tailwind.config.js tokens for JS-side use
// (icon color props, inline styles, shadows). See docs handoff.

export const COLORS = {
  primary: '#1F4A45',        // deep teal (old #35615D retired)
  primaryDark: '#163530',
  secondary: '#E8632F',      // terracotta (old #FD8950 retired)
  secondaryDark: '#C94F1F',
  accent: '#E8632F',

  success: '#3E8E63',
  successBg: '#E4F0E9',
  info: '#4C7CB0',
  infoBg: '#E7EEF6',
  danger: '#D24B4B',
  dangerBg: '#FBE6E6',
  warning: '#B8862E',
  purple: '#7A5FA8',
  purpleBg: '#EFE9F6',
  gold: '#B8862E',
  goldLight: '#E8B65A',
  error: '#D24B4B',

  background: '#F6F1E8',      // app screens (warm cream)
  backgroundWarm: '#FAF3E9',  // splash / auth / onboarding sheet
  backgroundLight: '#F5F0E7',
  backgroundGray: '#F0ECE3',

  tealTint: '#E7EFEC',
  terracottaTint: '#FBE4D7',
  sand: '#EDE3D8',

  text: '#211F1C',           // ink
  textSecondary: '#6E6A63',  // inkSoft
  textLight: '#9A948A',      // caption
  textPlaceholder: '#B5AFA2',
  textWhite: '#FFFFFF',

  border: '#EAE3D8',
  borderLight: '#F5F0E7',
  divider: '#F5F0E7',

  card: '#FFFFFF',
  darkSurface: '#211F1C',
  shadow: '#000000',
  overlay: 'rgba(33,31,28,0.5)',
};

export const FONTS = {
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
  sizes: {
    caption: 10.5,
    xs: 11.5,
    sm: 12.5,
    body: 13.5,
    md: 15,
    button: 15,
    section: 16,
    greeting: 19,
    title: 26,        // screen title (serif)
    onboarding: 32,   // onboarding headline (serif)
    hero: 34,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,        // label → field
  md: 12,       // between related items
  lg: 16,
  gutter: 20,   // horizontal page gutters
  section: 24,  // between sections
  xxxl: 32,
};

export const RADIUS = {
  tile: 13,     // small tiles
  control: 16,  // buttons + inputs
  card: 22,
  sheet: 28,    // screen-header bottom corners & hero sheets
  full: 100,
};

export const SHADOWS = {
  // neutral cards: 0 8px 20px rgba(33,31,28,0.06)
  card: {
    shadowColor: '#211F1C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  // floating card: 0 14px 30px rgba(31,74,69,0.10)
  floating: {
    shadowColor: '#1F4A45',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 8,
  },
  // teal-tinted (for teal elements): 0 14px 28px rgba(31,74,69,0.28)
  teal: {
    shadowColor: '#1F4A45',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 10,
  },
};
