export const colors = {
  primary: '#5B4FE8',
  primaryLight: '#EEF0FF',
  primaryDark: '#4338CA',
  secondary: '#10B981',
  secondaryLight: '#D1FAE5',
  background: '#F8F9FE',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',
  border: '#E5E7EB',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  success: '#10B981',
  successLight: '#D1FAE5',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  owed: '#EF4444',
  owedLight: '#FEE2E2',
  owes: '#10B981',
  owesLight: '#D1FAE5',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.text },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', color: colors.text },
  bodyBold: { fontSize: 15, fontWeight: '600', color: colors.text },
  small: { fontSize: 13, fontWeight: '400', color: colors.textSecondary },
  smallBold: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  caption: { fontSize: 11, fontWeight: '400', color: colors.textDisabled },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#5B4FE8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};
