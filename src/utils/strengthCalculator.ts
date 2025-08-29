import { PasswordStrength } from './types';

// Common weak passwords patterns
const COMMON_PATTERNS = [
  /^(.)\1+$/, // All same character
  /^(..)\1+$/, // Repeated pairs
  /^(...)\1+$/, // Repeated triplets
  /123456|654321|abcdef|qwerty|asdfgh|zxcvbn/i, // Common sequences
  /password|admin|user|guest|test/i, // Common words
  /^[0-9]+$/, // Only numbers
  /^[a-z]+$/i, // Only letters
];

// Common weak passwords list (top 100 most common)
const COMMON_PASSWORDS = [
  'password',
  '123456',
  '123456789',
  'qwerty',
  'abc123',
  'password123',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  '1234567890',
  'dragon',
  'master',
  'hello',
  'freedom',
  'whatever',
  'qazwsx',
  'trustno1',
];

/**
 * Calculate character set size based on password content
 * @param password Password to analyze
 * @returns number Character set size
 */
const calculateCharsetSize = (password: string): number => {
  let charsetSize = 0;

  if (/[a-z]/.test(password)) charsetSize += 26; // lowercase
  if (/[A-Z]/.test(password)) charsetSize += 26; // uppercase
  if (/[0-9]/.test(password)) charsetSize += 10; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32; // symbols (approximate)

  return charsetSize;
};

/**
 * Calculate entropy of password
 * @param password Password to analyze
 * @returns number Entropy in bits
 */
const calculateEntropy = (password: string): number => {
  const charsetSize = calculateCharsetSize(password);
  const length = password.length;
  return Math.log2(Math.pow(charsetSize, length));
};

/**
 * Check for common patterns in password
 * @param password Password to check
 * @returns boolean True if common pattern found
 */
const hasCommonPatterns = (password: string): boolean => {
  return COMMON_PATTERNS.some((pattern) => pattern.test(password));
};

/**
 * Check if password is in common passwords list
 * @param password Password to check
 * @returns boolean True if in common list
 */
const isCommonPassword = (password: string): boolean => {
  return COMMON_PASSWORDS.includes(password.toLowerCase());
};

/**
 * Check for keyboard patterns
 * @param password Password to check
 * @returns boolean True if keyboard pattern found
 */
const hasKeyboardPatterns = (password: string): boolean => {
  const keyboardPatterns = [
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
    'qwertyuiopasdfghjklzxcvbnm',
    '1234567890',
    '0987654321',
  ];

  const lowerPassword = password.toLowerCase();
  return keyboardPatterns.some((pattern) => {
    for (let i = 0; i <= pattern.length - 3; i++) {
      if (lowerPassword.includes(pattern.substring(i, i + 3))) {
        return true;
      }
    }
    return false;
  });
};

/**
 * Check for repeated characters or sequences
 * @param password Password to check
 * @returns boolean True if repetition found
 */
const hasRepetition = (password: string): boolean => {
  // Check for 3+ repeated characters
  for (let i = 0; i < password.length - 2; i++) {
    const char = password.charAt(i);
    if (char === password.charAt(i + 1) && char === password.charAt(i + 2)) {
      return true;
    }
  }

  // Check for repeated sequences of 2+ characters
  for (let len = 2; len <= password.length / 2; len++) {
    for (let i = 0; i <= password.length - len * 2; i++) {
      const sequence = password.substring(i, i + len);
      const nextSequence = password.substring(i + len, i + len * 2);
      if (sequence === nextSequence) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Calculate password strength
 * @param password Password to analyze
 * @returns PasswordStrength Strength analysis result
 */
export const calculatePasswordStrength = (
  password: string
): PasswordStrength => {
  // Input validation
  if (!password || typeof password !== 'string') {
    return {
      score: 0,
      label: 'very-weak',
      feedback: ['Invalid password input'],
      entropy: 0,
    };
  }

  const feedback: string[] = [];
  let score = 0;

  // Length scoring
  if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  // Character variety scoring
  let varietyScore = 0;
  if (/[a-z]/.test(password)) varietyScore++;
  if (/[A-Z]/.test(password)) varietyScore++;
  if (/[0-9]/.test(password)) varietyScore++;
  if (/[^a-zA-Z0-9]/.test(password)) varietyScore++;

  score += varietyScore;

  if (varietyScore < 3) {
    feedback.push('Use a mix of uppercase, lowercase, numbers, and symbols');
  }

  // Entropy scoring
  const entropy = calculateEntropy(password);
  if (entropy >= 60) {
    score += 1;
  } else if (entropy < 28) {
    score -= 1;
    feedback.push('Password is too predictable');
  }

  // Penalty for common patterns
  if (isCommonPassword(password)) {
    score -= 2;
    feedback.push('Avoid common passwords');
  }

  if (hasCommonPatterns(password)) {
    score -= 1;
    feedback.push('Avoid simple patterns');
  }

  if (hasKeyboardPatterns(password)) {
    score -= 1;
    feedback.push('Avoid keyboard patterns');
  }

  if (hasRepetition(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters or sequences');
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(4, score));

  // Determine label
  let label: PasswordStrength['label'];
  if (score === 0) {
    label = 'very-weak';
  } else if (score === 1) {
    label = 'weak';
  } else if (score === 2) {
    label = 'fair';
  } else if (score === 3) {
    label = 'good';
  } else {
    label = 'strong';
  }

  // Add positive feedback for strong passwords
  if (score >= 3 && feedback.length === 0) {
    feedback.push('Strong password!');
  }

  return {
    score,
    label,
    feedback,
  };
};

/**
 * Get strength color for UI display
 * @param strength Password strength
 * @returns string Color code
 */
export const getStrengthColor = (strength: PasswordStrength): string => {
  switch (strength.label) {
    case 'very-weak':
      return '#FF4444';
    case 'weak':
      return '#FF8800';
    case 'fair':
      return '#FFBB00';
    case 'good':
      return '#88CC00';
    case 'strong':
      return '#00AA00';
    default:
      return '#666666';
  }
};

/**
 * Get strength description for UI display
 * @param strength Password strength
 * @returns string Description
 */
export const getStrengthDescription = (strength: PasswordStrength): string => {
  switch (strength.label) {
    case 'very-weak':
      return 'Very Weak';
    case 'weak':
      return 'Weak';
    case 'fair':
      return 'Fair';
    case 'good':
      return 'Good';
    case 'strong':
      return 'Strong';
    default:
      return 'Unknown';
  }
};
