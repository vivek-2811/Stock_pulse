export const springs = {
  default: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  gentle: {
    type: 'spring',
    stiffness: 120,
    damping: 14,
  },
  snappy: {
    type: 'spring',
    stiffness: 400,
    damping: 28,
  },
} as const;

export const pageTransitionVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.18,
      ease: 'easeIn',
    },
  },
} as const;

export const hoverLiftTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
} as const;

export const hoverLiftVariants = {
  hover: {
    y: -3,
    transition: hoverLiftTransition,
  },
} as const;

export const staggerContainerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const;
