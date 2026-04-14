// ─────────────────────────────────────────────
//  THEME  —  Design tokens for FileIQ
// ─────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg:        '#0A0A0F',
  surface:   '#141419',
  surface2:  '#1C1C24',
  surface3:  '#24242F',

  // Text
  text:      '#F0F0F5',
  subtext:   '#8888A0',
  hint:      '#55556A',

  // Brand
  accent:    '#4F8EF7',
  accentDim: '#4F8EF720',

  // Semantic
  success:   '#22C55E',
  danger:    '#EF4444',
  warning:   '#F59E0B',
  purple:    '#A855F7',

  // Borders
  border:    '#2A2A38',
  borderFaint: '#1E1E2A',
};

export const radii = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
};

export const typography = {
  // Headings
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, color: colors.text },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  h4: { fontSize: 16, fontWeight: '600', color: colors.text },

  // Body
  body:   { fontSize: 15, fontWeight: '400', color: colors.text },
  bodyS:  { fontSize: 13, fontWeight: '400', color: colors.text },
  label:  { fontSize: 12, fontWeight: '600', color: colors.subtext, letterSpacing: 0.6 },
  caption:{ fontSize: 11, fontWeight: '400', color: colors.subtext },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};
