export const CHARACTER_SETS = {
  UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
  NUMBERS: '0123456789',
  SYMBOLS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export const SIMILAR_CHARACTERS = '0O1lI';

export const PASSWORD_CONSTRAINTS = {
  MIN_LENGTH: 4,
  MAX_LENGTH: 128,
  DEFAULT_LENGTH: 16,
  MAX_SAVED_PASSWORDS: 10,
};

export const STRENGTH_COLORS = {
  VERY_WEAK: '#dc2626',
  WEAK: '#ea580c',
  FAIR: '#ca8a04',
  STRONG: '#16a34a',
  VERY_STRONG: '#059669',
};

export const STRENGTH_LABELS = {
  0: 'Very Weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
  4: 'Very Strong',
} as const;

export const COLORS = {
  PRIMARY: '#1E3A8A',
  SECONDARY: '#1E40AF',
  SUCCESS: '#059669',
  WARNING: '#DC2626',
  LIGHT_BACKGROUND: '#F8FAFC',
  DARK_BACKGROUND: '#0F172A',
  MUTED: '#64748B',
};

export const DEFAULT_GENERATOR_OPTIONS = {
  length: PASSWORD_CONSTRAINTS.DEFAULT_LENGTH,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeSimilar: false,
  preventRepeating: false,
};

export const PRESET_CONFIGS = {
  WEB_SAFE: {
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: true,
    preventRepeating: false,
  },
  HIGH_SECURITY: {
    length: 32,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
    preventRepeating: true,
  },
  PIN_CODE: {
    length: 6,
    includeUppercase: false,
    includeLowercase: false,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: false,
    preventRepeating: false,
  },
};