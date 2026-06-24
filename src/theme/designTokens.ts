import { spacing, radius } from './spacing';
import { fontFamilies, typography } from './typography';
import { shadows, glows, glass } from './elevation';
import { springs, pageTransitionVariants, hoverLiftVariants, staggerContainerVariants } from './motionTokens';

export const tokens = {
  colors: {
    bg: '#0A0E14',
    green: '#00FF94',
    red: '#FF3B5C',
    textMuted: '#8A8F98',
    surface: '#10141a',
    surfaceLow: '#181c22',
  },
  spacing,
  radius,
  fontFamilies,
  typography,
  shadows,
  glows,
  glass,
  motion: {
    springs,
    pageTransitionVariants,
    hoverLiftVariants,
    staggerContainerVariants,
  },
} as const;

export default tokens;
export type DesignTokens = typeof tokens;
