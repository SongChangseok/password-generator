/**
 * Performance measurement utilities for password generation
 */

export interface PerformanceMetrics {
  generationTime: number; // in milliseconds
  entropy: number;
  passwordLength: number;
  characterSetSize: number;
  timestamp: Date;
}

/**
 * Measure the performance of a password generation function
 * @param fn Function to measure
 * @returns Promise with result and performance metrics
 */
export const measurePerformance = async <T>(
  fn: () => Promise<T>
): Promise<{ result: T; metrics: Partial<PerformanceMetrics> }> => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();

  return {
    result,
    metrics: {
      generationTime: endTime - startTime,
      timestamp: new Date(),
    },
  };
};

/**
 * Benchmark password generation performance
 * @param generateFn Password generation function
 * @param iterations Number of iterations to run
 * @returns Promise with benchmark results
 */
export const benchmarkPasswordGeneration = async (
  generateFn: () => Promise<any>,
  iterations: number = 100
): Promise<{
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
  iterations: number;
  passedTarget: boolean; // true if average < 300ms
}> => {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const { metrics } = await measurePerformance(generateFn);
    times.push(metrics.generationTime || 0);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const passedTarget = averageTime < 300; // Target: under 300ms

  return {
    averageTime,
    minTime,
    maxTime,
    totalTime,
    iterations,
    passedTarget,
  };
};

/**
 * Log performance metrics to console (development only)
 * @param metrics Performance metrics to log
 */
export const logPerformanceMetrics = (metrics: PerformanceMetrics): void => {
  if (__DEV__) {
    console.log('🔐 Password Generation Performance:', {
      'Generation Time': `${metrics.generationTime.toFixed(2)}ms`,
      'Target Met (< 300ms)': metrics.generationTime < 300 ? '✅' : '❌',
      Entropy: `${metrics.entropy.toFixed(1)} bits`,
      'Password Length': `${metrics.passwordLength} chars`,
      'Character Set Size': metrics.characterSetSize,
      Timestamp: metrics.timestamp.toISOString(),
    });
  }
};

/**
 * Performance-optimized character set building
 * @param options Generator options
 * @returns Optimized character set string
 */
export const buildOptimizedCharSet = (options: {
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
}): string => {
  // Pre-built character sets for better performance
  const charSets = {
    uppercase: options.excludeSimilar
      ? 'ABCDEFGHJKMNPQRSTUVWXYZ'
      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: options.excludeSimilar
      ? 'abcdefghijkmnpqrstuvwxyz'
      : 'abcdefghijklmnopqrstuvwxyz',
    numbers: options.excludeSimilar ? '23456789' : '0123456789',
    symbols: options.excludeSimilar
      ? '!@#$%^&*()_+-=[]{}:,.<>?'
      : '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };

  let charset = '';
  if (options.includeUppercase) charset += charSets.uppercase;
  if (options.includeLowercase) charset += charSets.lowercase;
  if (options.includeNumbers) charset += charSets.numbers;
  if (options.includeSymbols) charset += charSets.symbols;

  return charset;
};
