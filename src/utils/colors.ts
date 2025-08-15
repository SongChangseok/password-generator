/**
 * Color palette for the password generator app
 */

export const Colors = {
  // Primary Colors
  primary: '#1E3A8A', // Dark blue
  primaryLight: '#3B82F6',
  primaryDark: '#1E40AF',

  // Status Colors
  success: '#059669', // Green
  successLight: '#10B981',
  successDark: '#047857',

  warning: '#DC2626', // Red
  warningLight: '#EF4444',
  warningDark: '#B91C1C',

  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Background Colors
  background: '#F9FAFB',
  backgroundSecondary: '#FFFFFF',
  backgroundDark: '#1F2937',
  backgroundSecondaryDark: '#374151',

  // Text Colors
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textDark: '#FFFFFF',
  textSecondaryDark: '#D1D5DB',

  // Strength Colors
  strengthVeryWeak: '#DC2626',
  strengthWeak: '#F59E0B',
  strengthFair: '#EAB308',
  strengthGood: '#22C55E',
  strengthStrong: '#059669',

  // Border Colors
  border: '#E5E7EB',
  borderFocus: '#3B82F6',
  borderDark: '#4B5563',

  // Shadow Colors
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.15)',
  shadowDark: 'rgba(0, 0, 0, 0.25)',
} as const;

/**
 * Dark mode color overrides
 */
export const DarkColors = {
  ...Colors,
  background: '#111827',
  backgroundSecondary: '#1F2937',
  text: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textLight: '#9CA3AF',
  border: '#4B5563',
  shadowLight: 'rgba(255, 255, 255, 0.1)',
  shadowMedium: 'rgba(255, 255, 255, 0.15)',
  shadowDark: 'rgba(255, 255, 255, 0.25)',
} as const;

/**
 * Get strength color based on strength level
 */
export const getStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
      return Colors.strengthVeryWeak;
    case 1:
      return Colors.strengthWeak;
    case 2:
      return Colors.strengthFair;
    case 3:
      return Colors.strengthGood;
    case 4:
      return Colors.strengthStrong;
    default:
      return Colors.gray400;
  }
};
