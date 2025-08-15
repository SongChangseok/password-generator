import { GeneratorOptions, GeneratedPassword } from './types';
import { getSecureRandomInt, secureShuffleArray } from './secureRandom';
import { calculatePasswordStrength } from './strengthCalculator';

// Character sets
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// Similar characters that can be confusing
const SIMILAR_CHARS = {
  uppercase: 'IL',
  lowercase: 'l',
  numbers: '01',
  symbols: '|',
};

/**
 * Get character set based on options
 * @param options Generator options
 * @returns string Character set to use for generation
 */
const getCharacterSet = (options: GeneratorOptions): string => {
  let charset = '';

  if (options.includeUppercase) {
    let upperSet = UPPERCASE;
    if (options.excludeSimilar) {
      upperSet = upperSet.replace(
        new RegExp(`[${SIMILAR_CHARS.uppercase}]`, 'g'),
        ''
      );
    }
    charset += upperSet;
  }

  if (options.includeLowercase) {
    let lowerSet = LOWERCASE;
    if (options.excludeSimilar) {
      lowerSet = lowerSet.replace(
        new RegExp(`[${SIMILAR_CHARS.lowercase}]`, 'g'),
        ''
      );
    }
    charset += lowerSet;
  }

  if (options.includeNumbers) {
    let numberSet = NUMBERS;
    if (options.excludeSimilar) {
      numberSet = numberSet.replace(
        new RegExp(`[${SIMILAR_CHARS.numbers}]`, 'g'),
        ''
      );
    }
    charset += numberSet;
  }

  if (options.includeSymbols) {
    let symbolSet = SYMBOLS;
    if (options.excludeSimilar) {
      symbolSet = symbolSet.replace(
        new RegExp(`[${SIMILAR_CHARS.symbols}]`, 'g'),
        ''
      );
    }
    charset += symbolSet;
  }

  return charset;
};

/**
 * Ensure password contains at least one character from each selected type
 * @param password Generated password
 * @param options Generator options
 * @returns Promise<string> Password with guaranteed character types
 */
const ensureCharacterTypes = async (
  password: string,
  options: GeneratorOptions
): Promise<string> => {
  const chars = password.split('');
  const positions = await secureShuffleArray([
    ...Array(password.length).keys(),
  ]);
  let posIndex = 0;

  // Ensure at least one uppercase
  if (
    options.includeUppercase &&
    !new RegExp(`[${UPPERCASE}]`).test(password)
  ) {
    const upperSet = options.excludeSimilar
      ? UPPERCASE.replace(new RegExp(`[${SIMILAR_CHARS.uppercase}]`, 'g'), '')
      : UPPERCASE;
    const randomChar =
      upperSet[await getSecureRandomInt(0, upperSet.length - 1)];
    chars[positions[posIndex++]] = randomChar;
  }

  // Ensure at least one lowercase
  if (
    options.includeLowercase &&
    !new RegExp(`[${LOWERCASE}]`).test(password)
  ) {
    const lowerSet = options.excludeSimilar
      ? LOWERCASE.replace(new RegExp(`[${SIMILAR_CHARS.lowercase}]`, 'g'), '')
      : LOWERCASE;
    const randomChar =
      lowerSet[await getSecureRandomInt(0, lowerSet.length - 1)];
    chars[positions[posIndex++]] = randomChar;
  }

  // Ensure at least one number
  if (options.includeNumbers && !new RegExp(`[${NUMBERS}]`).test(password)) {
    const numberSet = options.excludeSimilar
      ? NUMBERS.replace(new RegExp(`[${SIMILAR_CHARS.numbers}]`, 'g'), '')
      : NUMBERS;
    const randomChar =
      numberSet[await getSecureRandomInt(0, numberSet.length - 1)];
    chars[positions[posIndex++]] = randomChar;
  }

  // Ensure at least one symbol
  if (options.includeSymbols && !new RegExp(`[${SYMBOLS}]`).test(password)) {
    const symbolSet = options.excludeSimilar
      ? SYMBOLS.replace(new RegExp(`[${SIMILAR_CHARS.symbols}]`, 'g'), '')
      : SYMBOLS;
    const randomChar =
      symbolSet[await getSecureRandomInt(0, symbolSet.length - 1)];
    chars[positions[posIndex++]] = randomChar;
  }

  return chars.join('');
};

/**
 * Check if password has repeating characters
 * @param password Password to check
 * @returns boolean True if has repeating characters
 */
const hasRepeatingChars = (password: string): boolean => {
  for (let i = 0; i < password.length - 1; i++) {
    if (password[i] === password[i + 1]) {
      return true;
    }
  }
  return false;
};

/**
 * Generate a secure password based on options
 * @param options Generator options
 * @returns Promise<GeneratedPassword> Generated password with metadata
 */
export const generateSecurePassword = async (
  options: GeneratorOptions
): Promise<GeneratedPassword> => {
  // Validate options
  if (options.length < 8 || options.length > 32) {
    throw new Error('Password length must be between 8 and 32 characters');
  }

  if (
    !options.includeUppercase &&
    !options.includeLowercase &&
    !options.includeNumbers &&
    !options.includeSymbols
  ) {
    throw new Error('At least one character type must be selected');
  }

  const charset = getCharacterSet(options);

  if (charset.length === 0) {
    throw new Error('No valid characters available with current options');
  }

  let password = '';
  let attempts = 0;
  const maxAttempts = 100;

  do {
    if (attempts >= maxAttempts) {
      // If we can't generate without repeating chars, relax that constraint
      if (options.preventRepeating) {
        const relaxedOptions = { ...options, preventRepeating: false };
        return generateSecurePassword(relaxedOptions);
      }
      throw new Error('Unable to generate password meeting all criteria');
    }

    // Generate random password
    const chars: string[] = [];
    for (let i = 0; i < options.length; i++) {
      const randomIndex = await getSecureRandomInt(0, charset.length - 1);
      chars.push(charset[randomIndex]);
    }

    password = chars.join('');

    // Ensure character types are present
    password = await ensureCharacterTypes(password, options);

    attempts++;
  } while (options.preventRepeating && hasRepeatingChars(password));

  // Calculate strength and entropy
  const strength = calculatePasswordStrength(password);
  const entropy = Math.log2(charset.length) * options.length;

  return {
    password,
    strength,
    entropy,
    generatedAt: new Date(),
  };
};

/**
 * Default generator options
 */
export const DEFAULT_OPTIONS: GeneratorOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeSimilar: false,
  preventRepeating: false,
};
