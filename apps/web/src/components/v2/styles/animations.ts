/**
 * VYBEROLOGY V2.0 - MOTION LANGUAGE
 * Sacred, intentional, calm animations
 * All animations ≤250ms, ease-out
 */

import { animation } from './tokens';

/**
 * FADE-IN
 * Used for: Cards, containers, readings appearing
 * Duration: 200ms
 */
export const fadeIn = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const fadeInStyle = {
  animation: `fadeIn ${animation.fadeIn.duration} ${animation.fadeIn.easing}`,
} as const;

/**
 * SOFT RISE (micro-elevation)
 * Used for: Buttons, tappable elements on hover/tap
 * Duration: 120ms
 * Lift: 4px
 */
export const softRise = `
  @keyframes softRise {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-${animation.softRise.lift});
    }
  }
`;

export const softRiseStyle = {
  transition: `transform ${animation.softRise.duration} ${animation.softRise.easing}`,
  ':hover': {
    transform: `translateY(-${animation.softRise.lift})`,
  },
  ':active': {
    transform: 'translateY(-2px)', // Slightly less on active for tactile feel
  },
} as const;

/**
 * GLOW PULSE (chakra/element emphasis)
 * Used for: Chakra markers, element highlights
 * Duration: 250ms (reduced from 1500ms per Lumen)
 * Single cycle, opacity-based
 */
export const glowPulse = `
  @keyframes glowPulse {
    0% {
      opacity: 0.7;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.7;
    }
  }
`;

export const glowPulseStyle = {
  animation: `glowPulse ${animation.glowPulse.duration} ${animation.glowPulse.easing}`,
} as const;

/**
 * SLIDE-IN (from bottom)
 * Used for: Modal/overlay appearances
 * Duration: 200ms
 */
export const slideIn = `
  @keyframes slideIn {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

export const slideInStyle = {
  animation: `slideIn ${animation.fadeIn.duration} ${animation.fadeIn.easing}`,
} as const;

/**
 * KEYFRAMES CSS (inject into global styles)
 */
export const keyframesCSS = `
  ${fadeIn}
  ${softRise}
  ${glowPulse}
  ${slideIn}
`;

/**
 * USAGE EXAMPLES:
 *
 * // Fade in a container
 * <div style={fadeInStyle}>Content</div>
 *
 * // Button with soft rise on hover
 * <button style={softRiseStyle}>Click me</button>
 *
 * // Chakra marker with glow pulse
 * <div style={glowPulseStyle}>●</div>
 */
