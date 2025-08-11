export const CHARACTER_SETS = {
  UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
  NUMBERS: '0123456789',
  SPECIAL: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  SIMILAR: '0O1lI',
};

export const PASSWORD_SETTINGS = {
  MIN_LENGTH: 4,
  MAX_LENGTH: 128,
  DEFAULT_LENGTH: 12,
  MAX_SAVED_PASSWORDS: 10,
};

export const COLORS = {
  PRIMARY: '#1E3A8A',
  SECONDARY: '#1E40AF',
  SUCCESS: '#059669',
  WARNING: '#DC2626',
  LIGHT_BACKGROUND: '#F8FAFC',
  DARK_BACKGROUND: '#0F172A',
  MUTED: '#64748B',
};

export const PRESETS = {
  WEBSITE: {
    name: '웹사이트용',
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSpecialChars: true,
    excludeSimilar: false,
    excludeConsecutive: false,
  },
  HIGH_SECURITY: {
    name: '고보안용',
    length: 20,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSpecialChars: true,
    excludeSimilar: true,
    excludeConsecutive: true,
  },
  PIN: {
    name: 'PIN 번호',
    length: 6,
    includeUppercase: false,
    includeLowercase: false,
    includeNumbers: true,
    includeSpecialChars: false,
    excludeSimilar: false,
    excludeConsecutive: false,
  },
};