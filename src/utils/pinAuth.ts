import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

export interface PinValidationResult {
  isValid: boolean;
  error?: string;
  attemptsRemaining?: number;
}

export interface PinSettings {
  isEnabled: boolean;
  hasPin: boolean;
  attemptsRemaining: number;
  lastFailedAttempt?: number;
}

const PIN_KEY = 'user_pin_hash';
const PIN_SALT_KEY = 'pin_salt';
const PIN_ENABLED_KEY = 'pin_enabled';
const PIN_ATTEMPTS_KEY = 'pin_attempts';
const PIN_LAST_ATTEMPT_KEY = 'pin_last_attempt';

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Generate a random salt for PIN hashing
 * @returns Promise<string> Base64 encoded salt
 */
const generateSalt = async (): Promise<string> => {
  const saltBytes = await Crypto.getRandomBytesAsync(32);
  return btoa(String.fromCharCode(...saltBytes));
};

/**
 * Hash PIN with salt using SHA-256
 * @param pin PIN code to hash
 * @param salt Salt for hashing
 * @returns Promise<string> Hashed PIN
 */
const hashPin = async (pin: string, salt: string): Promise<string> => {
  const pinWithSalt = pin + salt;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pinWithSalt,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  return hash;
};

/**
 * Validate PIN format (4-6 digits)
 * @param pin PIN to validate
 * @returns boolean Whether PIN format is valid
 */
export const isValidPinFormat = (pin: string): boolean => {
  return /^\d{4,6}$/.test(pin);
};

/**
 * Set up a new PIN code
 * @param pin New PIN code
 * @returns Promise<void>
 */
export const setupPin = async (pin: string): Promise<void> => {
  if (!isValidPinFormat(pin)) {
    throw new Error('PIN must be 4-6 digits');
  }

  try {
    // Generate new salt for this PIN
    const salt = await generateSalt();
    const hashedPin = await hashPin(pin, salt);

    // Store hashed PIN and salt
    await SecureStore.setItemAsync(PIN_KEY, hashedPin);
    await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
    await SecureStore.setItemAsync(PIN_ENABLED_KEY, 'true');

    // Reset attempts counter
    await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
    await SecureStore.deleteItemAsync(PIN_LAST_ATTEMPT_KEY);
  } catch (error) {
    console.error('Error setting up PIN:', error);
    throw new Error('Failed to set up PIN');
  }
};

/**
 * Verify PIN code
 * @param pin PIN to verify
 * @returns Promise<PinValidationResult> Validation result
 */
export const verifyPin = async (pin: string): Promise<PinValidationResult> => {
  if (!isValidPinFormat(pin)) {
    return {
      isValid: false,
      error: 'Invalid PIN format',
    };
  }

  try {
    // Check if PIN is enabled
    const isEnabled = await isPinEnabled();
    if (!isEnabled) {
      return {
        isValid: false,
        error: 'PIN authentication is disabled',
      };
    }

    // Check lockout status
    const lockoutStatus = await checkLockoutStatus();
    if (lockoutStatus.isLockedOut) {
      return {
        isValid: false,
        error: `Too many failed attempts. Try again in ${Math.ceil(lockoutStatus.timeRemaining! / 60000)} minutes.`,
      };
    }

    // Get stored PIN hash and salt
    const storedHash = await SecureStore.getItemAsync(PIN_KEY);
    const salt = await SecureStore.getItemAsync(PIN_SALT_KEY);

    if (!storedHash || !salt) {
      return {
        isValid: false,
        error: 'PIN not configured',
      };
    }

    // Hash provided PIN and compare
    const hashedPin = await hashPin(pin, salt);
    const isValid = hashedPin === storedHash;

    if (isValid) {
      // Reset attempts on successful verification
      await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
      await SecureStore.deleteItemAsync(PIN_LAST_ATTEMPT_KEY);

      return { isValid: true };
    } else {
      // Increment failed attempts
      const updatedAttempts = await incrementFailedAttempts();

      return {
        isValid: false,
        error: 'Incorrect PIN',
        attemptsRemaining: MAX_PIN_ATTEMPTS - updatedAttempts,
      };
    }
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return {
      isValid: false,
      error: 'PIN verification failed',
    };
  }
};

/**
 * Change existing PIN
 * @param currentPin Current PIN
 * @param newPin New PIN
 * @returns Promise<void>
 */
export const changePin = async (
  currentPin: string,
  newPin: string
): Promise<void> => {
  // First verify current PIN
  const verification = await verifyPin(currentPin);
  if (!verification.isValid) {
    throw new Error('Current PIN is incorrect');
  }

  // Set up new PIN
  await setupPin(newPin);
};

/**
 * Remove PIN authentication
 * @param currentPin Current PIN for verification
 * @returns Promise<void>
 */
export const removePin = async (currentPin: string): Promise<void> => {
  // Verify current PIN first
  const verification = await verifyPin(currentPin);
  if (!verification.isValid) {
    throw new Error('Current PIN is incorrect');
  }

  try {
    // Remove all PIN-related data
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(PIN_SALT_KEY);
    await SecureStore.setItemAsync(PIN_ENABLED_KEY, 'false');
    await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
    await SecureStore.deleteItemAsync(PIN_LAST_ATTEMPT_KEY);
  } catch (error) {
    console.error('Error removing PIN:', error);
    throw new Error('Failed to remove PIN');
  }
};

/**
 * Check if PIN is enabled
 * @returns Promise<boolean> Whether PIN is enabled
 */
export const isPinEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await SecureStore.getItemAsync(PIN_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking PIN status:', error);
    return false;
  }
};

/**
 * Check if PIN is set up
 * @returns Promise<boolean> Whether PIN is configured
 */
export const isPinConfigured = async (): Promise<boolean> => {
  try {
    const hash = await SecureStore.getItemAsync(PIN_KEY);
    const salt = await SecureStore.getItemAsync(PIN_SALT_KEY);
    return !!(hash && salt);
  } catch (error) {
    console.error('Error checking PIN configuration:', error);
    return false;
  }
};

/**
 * Get PIN settings status
 * @returns Promise<PinSettings> Current PIN settings
 */
export const getPinSettings = async (): Promise<PinSettings> => {
  try {
    const isEnabled = await isPinEnabled();
    const hasPin = await isPinConfigured();
    const attemptsRemaining = await getRemainingAttempts();

    return {
      isEnabled,
      hasPin,
      attemptsRemaining,
    };
  } catch (error) {
    console.error('Error getting PIN settings:', error);
    return {
      isEnabled: false,
      hasPin: false,
      attemptsRemaining: MAX_PIN_ATTEMPTS,
    };
  }
};

/**
 * Increment failed PIN attempts
 * @returns Promise<number> Total failed attempts
 */
const incrementFailedAttempts = async (): Promise<number> => {
  try {
    const currentAttempts = await SecureStore.getItemAsync(PIN_ATTEMPTS_KEY);
    const attempts = currentAttempts ? parseInt(currentAttempts, 10) + 1 : 1;

    await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, attempts.toString());
    await SecureStore.setItemAsync(PIN_LAST_ATTEMPT_KEY, Date.now().toString());

    return attempts;
  } catch (error) {
    console.error('Error incrementing failed attempts:', error);
    return 1;
  }
};

/**
 * Get remaining PIN attempts
 * @returns Promise<number> Attempts remaining
 */
const getRemainingAttempts = async (): Promise<number> => {
  try {
    const currentAttempts = await SecureStore.getItemAsync(PIN_ATTEMPTS_KEY);
    const attempts = currentAttempts ? parseInt(currentAttempts, 10) : 0;
    return Math.max(0, MAX_PIN_ATTEMPTS - attempts);
  } catch (error) {
    console.error('Error getting remaining attempts:', error);
    return MAX_PIN_ATTEMPTS;
  }
};

/**
 * Check lockout status
 * @returns Promise<{isLockedOut: boolean, timeRemaining?: number}> Lockout status
 */
const checkLockoutStatus = async (): Promise<{
  isLockedOut: boolean;
  timeRemaining?: number;
}> => {
  try {
    const attempts = await SecureStore.getItemAsync(PIN_ATTEMPTS_KEY);
    const lastAttempt = await SecureStore.getItemAsync(PIN_LAST_ATTEMPT_KEY);

    if (!attempts || !lastAttempt) {
      return { isLockedOut: false };
    }

    const attemptsCount = parseInt(attempts, 10);
    const lastAttemptTime = parseInt(lastAttempt, 10);

    if (attemptsCount >= MAX_PIN_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - lastAttemptTime;

      if (timeSinceLastAttempt < LOCKOUT_DURATION) {
        return {
          isLockedOut: true,
          timeRemaining: LOCKOUT_DURATION - timeSinceLastAttempt,
        };
      } else {
        // Lockout period expired, reset attempts
        await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
        await SecureStore.deleteItemAsync(PIN_LAST_ATTEMPT_KEY);
        return { isLockedOut: false };
      }
    }

    return { isLockedOut: false };
  } catch (error) {
    console.error('Error checking lockout status:', error);
    return { isLockedOut: false };
  }
};
