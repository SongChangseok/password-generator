import * as Crypto from 'expo-crypto';

/**
 * Generate cryptographically secure random bytes
 * @param length Number of bytes to generate
 * @returns Promise<Uint8Array> Secure random bytes
 */
export const getSecureRandomBytes = async (
  length: number
): Promise<Uint8Array> => {
  const randomBytes = await Crypto.getRandomBytesAsync(length);
  return new Uint8Array(randomBytes);
};

/**
 * Generate a secure random integer between min and max (inclusive)
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @returns Promise<number> Secure random integer
 */
export const getSecureRandomInt = async (
  min: number,
  max: number
): Promise<number> => {
  if (min > max) {
    throw new Error('min must be less than or equal to max');
  }

  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValidValue = Math.floor(256 ** bytesNeeded / range) * range - 1;

  let randomValue: number;
  do {
    const randomBytes = await getSecureRandomBytes(bytesNeeded);
    randomValue = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = randomValue * 256 + randomBytes[i];
    }
  } while (randomValue > maxValidValue);

  return min + (randomValue % range);
};

/**
 * Shuffle an array using Fisher-Yates algorithm with secure random
 * @param array Array to shuffle
 * @returns Promise<T[]> Shuffled array
 */
export const secureShuffleArray = async <T>(array: T[]): Promise<T[]> => {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = await getSecureRandomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};
