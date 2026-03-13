import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Vyberology brand tokens
        vy: {
          charcoal: "hsl(var(--vy-charcoal))",
          parchment: "hsl(var(--vy-parchment))",
          cream: "hsl(var(--vy-cream))",
          gold: "hsl(var(--vy-gold))",
          "gold-muted": "hsl(var(--vy-gold-muted))",
          sage: "hsl(var(--vy-sage))",
          rose: "hsl(var(--vy-rose))",
          "slate-blue": "hsl(var(--vy-slate-blue))",
          "warm-gray": "hsl(var(--vy-warm-gray))",
          indigo: "hsl(var(--vy-indigo))",
        },
        // Chakra accents
        chakra: {
          root: "hsl(var(--vy-root))",
          sacral: "hsl(var(--vy-sacral))",
          solar: "hsl(var(--vy-solar))",
          heart: "hsl(var(--vy-heart))",
          throat: "hsl(var(--vy-throat))",
          "third-eye": "hsl(var(--vy-third-eye))",
          crown: "hsl(var(--vy-crown))",
        },
        // Legacy backward compat
        lf: {
          ink: "hsl(var(--lf-ink))",
          midnight: "hsl(var(--lf-midnight))",
          indigo: "hsl(var(--lf-indigo))",
          violet: "hsl(var(--lf-violet))",
          aurora: "hsl(var(--lf-aurora))",
          gold: "hsl(var(--lf-gold))",
          slate: "hsl(var(--lf-slate))",
          shell: "hsl(var(--lf-shell))",
          white: "hsl(var(--lf-white))",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "ui-serif", "Georgia", "serif"],
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "vy-soft": "0 2px 20px rgba(20, 18, 17, 0.04)",
        "vy-card": "0 4px 32px rgba(20, 18, 17, 0.06)",
        "vy-glow": "0 0 40px rgba(196, 162, 101, 0.15)",
      },
      backgroundImage: {
        "vy-gradient": "linear-gradient(180deg, hsl(var(--vy-parchment)) 0%, hsl(var(--vy-cream)) 100%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
