/**
 * Vybe Design System Colors
 * Single source of truth for brand colors across all apps
 */

export const VYBE_COLORS = {
  // Primary brand colors
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7", // Primary purple
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
    950: "#3b0764",
  },
  pink: {
    50: "#fdf2f8",
    100: "#fce7f3",
    200: "#fbcfe8",
    300: "#f9a8d4",
    400: "#f472b6",
    500: "#ec4899", // Primary pink
    600: "#db2777",
    700: "#be185d",
    800: "#9d174d",
    900: "#831843",
    950: "#500724",
  },
  cyan: {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4", // Primary cyan
    600: "#0891b2",
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
    950: "#083344",
  },
} as const;

// Semantic aliases
export const BRAND_COLORS = {
  primary: VYBE_COLORS.purple[500],
  secondary: VYBE_COLORS.pink[500],
  accent: VYBE_COLORS.cyan[500],

  // Gradient definitions
  gradients: {
    vybe: `linear-gradient(135deg, ${VYBE_COLORS.purple[500]}, ${VYBE_COLORS.pink[500]}, ${VYBE_COLORS.cyan[500]})`,
    purple: `linear-gradient(135deg, ${VYBE_COLORS.purple[500]}, ${VYBE_COLORS.pink[500]})`,
    ocean: `linear-gradient(135deg, ${VYBE_COLORS.cyan[500]}, ${VYBE_COLORS.purple[500]})`,
  },
} as const;

// Tailwind class mappings
export const TAILWIND_GRADIENTS = {
  vybe: "bg-gradient-to-br from-vyber-purple via-vyber-pink to-vyber-cyan",
  purple: "bg-gradient-to-br from-purple-500 to-pink-500",
  blue: "bg-gradient-to-br from-blue-600 to-cyan-500",
  amber: "bg-gradient-to-br from-amber-500 to-yellow-500",
  emerald: "bg-gradient-to-br from-emerald-500 to-teal-500",
  sky: "bg-gradient-to-br from-sky-500 to-blue-600",
  indigo: "bg-gradient-to-br from-indigo-500 to-purple-500",
  pink: "bg-gradient-to-br from-pink-500 to-rose-500",
  orange: "bg-gradient-to-br from-orange-500 to-red-500",
  violet: "bg-gradient-to-br from-violet-500 to-purple-500",
  green: "bg-gradient-to-br from-green-500 to-emerald-500",
} as const;

export type GradientName = keyof typeof TAILWIND_GRADIENTS;
