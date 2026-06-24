export const fontFamilies = {
  geist: 'Geist, sans-serif',
  inter: 'Inter, sans-serif',
  mono: 'JetBrains Mono, monospace',
} as const;

export const typography = {
  display: {
    fontSize: '40px',
    lineHeight: '48px',
    letterSpacing: '-0.02em',
    fontWeight: '700',
    className: 'text-[40px] leading-[48px] tracking-[-0.02em] font-bold font-inter',
  },
  headlineLg: {
    fontSize: '32px',
    lineHeight: '40px',
    fontWeight: '600',
    className: 'text-2xl lg:text-3xl leading-[40px] font-semibold font-inter',
  },
  headlineMd: {
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: '600',
    className: 'text-xl lg:text-2xl leading-[32px] font-semibold font-inter',
  },
  bodyLg: {
    fontSize: '18px',
    lineHeight: '28px',
    fontWeight: '400',
    className: 'text-lg leading-[28px] font-normal font-inter',
  },
  bodyMd: {
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: '400',
    className: 'text-base leading-[24px] font-normal font-inter',
  },
  labelData: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '500',
    className: 'text-sm leading-[20px] font-medium font-inter',
  },
  labelSm: {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: '600',
    letterSpacing: '0.05em',
    className: 'text-xs leading-[16px] font-semibold tracking-[0.05em] font-inter',
  },
} as const;
