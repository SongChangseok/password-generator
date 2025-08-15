import {
  measurePerformance,
  benchmarkPasswordGeneration,
  buildOptimizedCharSet,
} from '../performance';

describe('performance', () => {
  describe('measurePerformance', () => {
    it('should measure function execution time', async () => {
      const mockFn = jest.fn().mockResolvedValue('test result');

      const { result, metrics } = await measurePerformance(mockFn);

      expect(result).toBe('test result');
      expect(typeof metrics.generationTime).toBe('number');
      expect(metrics.generationTime).toBeGreaterThanOrEqual(0);
      expect(metrics.timestamp).toBeInstanceOf(Date);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle async functions', async () => {
      const delayedFn = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'delayed result';
      });

      const { result, metrics } = await measurePerformance(delayedFn);

      expect(result).toBe('delayed result');
      expect(metrics.generationTime).toBeGreaterThan(5); // Should take at least a few ms
    });
  });

  describe('benchmarkPasswordGeneration', () => {
    it('should run multiple iterations and calculate statistics', async () => {
      const mockGenerateFn = jest.fn().mockResolvedValue('password123');

      const results = await benchmarkPasswordGeneration(mockGenerateFn, 5);

      expect(results.iterations).toBe(5);
      expect(typeof results.averageTime).toBe('number');
      expect(typeof results.minTime).toBe('number');
      expect(typeof results.maxTime).toBe('number');
      expect(typeof results.totalTime).toBe('number');
      expect(typeof results.passedTarget).toBe('boolean');
      expect(results.minTime).toBeLessThanOrEqual(results.averageTime);
      expect(results.averageTime).toBeLessThanOrEqual(results.maxTime);
      expect(mockGenerateFn).toHaveBeenCalledTimes(5);
    });

    it('should correctly identify if target is met', async () => {
      // Fast function (should pass)
      const fastFn = jest.fn().mockResolvedValue('fast');
      const fastResults = await benchmarkPasswordGeneration(fastFn, 3);
      expect(fastResults.passedTarget).toBe(true); // Should be under 300ms

      // Slow function (should fail)
      const slowFn = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
        return 'slow';
      });
      const slowResults = await benchmarkPasswordGeneration(slowFn, 2);
      expect(slowResults.passedTarget).toBe(false); // Should be over 300ms
    });

    it('should use default iterations when not specified', async () => {
      const mockFn = jest.fn().mockResolvedValue('test');

      const results = await benchmarkPasswordGeneration(mockFn);

      expect(results.iterations).toBe(100);
      expect(mockFn).toHaveBeenCalledTimes(100);
    });
  });

  describe('buildOptimizedCharSet', () => {
    it('should build character set with all types', () => {
      const options = {
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
      };

      const charset = buildOptimizedCharSet(options);

      expect(charset).toContain('A');
      expect(charset).toContain('a');
      expect(charset).toContain('0');
      expect(charset).toContain('!');
      expect(charset.length).toBeGreaterThan(80); // Should have all character types
    });

    it('should exclude similar characters when requested', () => {
      const options = {
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: true,
      };

      const charset = buildOptimizedCharSet(options);

      // Should not contain confusing characters
      expect(charset).not.toContain('I');
      expect(charset).not.toContain('l');
      expect(charset).not.toContain('1');
      expect(charset).not.toContain('0');
      expect(charset).not.toContain('O');
      expect(charset).not.toContain('|');
    });

    it('should build character set with only selected types', () => {
      const uppercaseOnly = buildOptimizedCharSet({
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
      });

      expect(/^[A-Z]+$/.test(uppercaseOnly)).toBe(true);

      const numbersOnly = buildOptimizedCharSet({
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: false,
      });

      expect(/^[0-9]+$/.test(numbersOnly)).toBe(true);
    });

    it('should return empty string when no types selected', () => {
      const charset = buildOptimizedCharSet({
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
      });

      expect(charset).toBe('');
    });

    it('should be consistent for same options', () => {
      const options = {
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: true,
      };

      const charset1 = buildOptimizedCharSet(options);
      const charset2 = buildOptimizedCharSet(options);

      expect(charset1).toBe(charset2);
    });
  });
});
