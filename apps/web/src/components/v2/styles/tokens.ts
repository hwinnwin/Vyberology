/**
 * VYBEROLOGY V2.0 - DESIGN TOKENS
 * Mystic Minimal Visual Specification
 */

export const colors = {
  // PRIMARY COLORS
  midnightCharcoal: '#0F0F10',
  softIvory: '#F8F6F1',
  warmQuartz: '#E8E3DA',

  // ACCENT COLORS (Elements)
  fire: '#F5C15C', // Gold Ember
  earth: '#6D8E75', // Moss Jade
  air: '#C8D3DC', // Silver Mist
  water: '#4A5AA8', // Deep Indigo

  // CHAKRA MICRO-ACCENTS (70% opacity usage)
  root: '#A33A3A',
  sacral: '#D88447',
  solarPlexus: '#E8C558',
  heart: '#78A57A',
  throat: '#5FA7C8',
  thirdEye: '#6F69C7',
  crown: '#C2A7D9',

  // UTILITY
  border: '#E0DED8',
} as const;

export const typography = {
  // FONTS
  primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mystical: '"Cormorant Garamond", Georgia, serif',

  // SIZES
  h1: {
    size: '48px',
    family: '"Cormorant Garamond", Georgia, serif',
    weight: '400',
    letterSpacing: '0.02em',
  },
  h2: {
    size: '30px',
    family: '"Inter", sans-serif',
    weight: '700',
  },
  h3: {
    size: '22px',
    family: '"Inter", sans-serif',
    weight: '500',
  },
  body: {
    size: '16px',
    family: '"Inter", sans-serif',
    weight: '400',
    lineHeight: '1.6',
  },
  subtext: {
    size: '14px',
    family: '"Inter", sans-serif',
    weight: '300',
  },
  label: {
    size: '12px',
    family: '"Inter", sans-serif',
    weight: '600',
    transform: 'uppercase',
    letterSpacing: '0.05em',
  },
} as const;

export const spacing = {
  xs: '8px',
  sm: '12px',
  md: '24px',
  lg: '32px',
  xl: '48px',
} as const;

export const layout = {
  maxWidth: '720px',
  borderRadius: '20px',
  borderWidth: '1px',
} as const;

export const gradients = {
  // PRIMARY (background surfaces)
  airQuartzMist: `linear-gradient(135deg, ${colors.softIvory} 0%, ${colors.warmQuartz} 100%)`,

  // SECONDARY (subtle depth) - Lumen refinement: ≤10% opacity
  cosmicWhisper: `linear-gradient(180deg, transparent 0%, rgba(15, 15, 16, 0.03) 100%)`,
} as const;

export const animation = {
  // Lumen refinement: All animations ≤250ms, ease-out
  fadeIn: {
    duration: '200ms',
    easing: 'ease-out',
  },
  softRise: {
    duration: '120ms',
    lift: '4px',
    easing: 'ease-out',
  },
  glowPulse: {
    duration: '250ms', // Reduced from 1500ms
    easing: 'ease-out', // Changed from ease-in-out
  },
} as const;

export const elements = {
  // Lumen refinement: 1.5px stroke for glyphs
  fire: { glyph: '🜂', label: 'FIRE', color: colors.fire, strokeWidth: '1.5px' },
  earth: { glyph: '🜃', label: 'EARTH', color: colors.earth, strokeWidth: '1.5px' },
  air: { glyph: '🜁', label: 'AIR', color: colors.air, strokeWidth: '1.5px' },
  water: { glyph: '🜄', label: 'WATER', color: colors.water, strokeWidth: '1.5px' },
} as const;

export const intentionBox = {
  // Lumen refinement: Specific intention box styling
  borderRadius: '20px',
  borderWidth: '1px',
  borderColor: colors.border,
  padding: '12px',
  background: colors.warmQuartz, // Quartz background
} as const;

export const chakras = {
  root: { label: 'ROOT', color: colors.root, opacity: 0.7 },
  sacral: { label: 'SACRAL', color: colors.sacral, opacity: 0.7 },
  'solar-plexus': { label: 'SOLAR PLEXUS', color: colors.solarPlexus, opacity: 0.7 },
  heart: { label: 'HEART', color: colors.heart, opacity: 0.7 },
  throat: { label: 'THROAT', color: colors.throat, opacity: 0.7 },
  'third-eye': { label: 'THIRD EYE', color: colors.thirdEye, opacity: 0.7 },
  crown: { label: 'CROWN', color: colors.crown, opacity: 0.7 },
} as const;
