export const shadows = {
  none: 'none',
  card: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
} as const;

export const glows = {
  green: '0 0 24px rgba(0, 255, 148, 0.10)',
  red: '0 0 24px rgba(255, 59, 92, 0.10)',
  greenSm: '0 0 12px rgba(0, 255, 148, 0.18)',
  redSm: '0 0 12px rgba(255, 59, 92, 0.18)',
  dotGreen: '0 0 8px 2px rgba(0, 255, 148, 0.6)',
  dotRed: '0 0 8px 2px rgba(255, 59, 92, 0.6)',
} as const;

export const glass = {
  blur: '24px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  className: 'glass-card',
} as const;
