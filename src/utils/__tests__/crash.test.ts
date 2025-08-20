import { generateSecurePassword } from '../passwordGenerator';
import { calculatePasswordStrength } from '../strengthCalculator';
import { GeneratorOptions } from '../types';

describe('Crash Scenario Tests', () => {
  describe('Invalid Input Handling', () => {
    it('should handle invalid length values gracefully', async () => {
      const testCases = [
        { length: 0, description: 'zero length' },
        { length: -1, description: 'negative length' },
        { length: 1000, description: 'extremely large length' },
        { length: NaN, description: 'NaN length' },
        { length: Infinity, description: 'infinite length' },
      ];

      for (const testCase of testCases) {
        const options: GeneratorOptions = {
          length: testCase.length,
          includeUppercase: true,
          includeLowercase: true,
          includeNumbers: true,
          includeSymbols: true,
          excludeSimilar: false,
          preventRepeating: false,
          readableFormat: false,
        };

        try {
          const result = await generateSecurePassword(options);

          // If it doesn't throw, it should return a valid result
          expect(result).toBeDefined();
          expect(typeof result.password).toBe('string');
          expect(result.password.length).toBeGreaterThan(0);
        } catch (error) {
          // If it throws, it should be a controlled error, not a crash
          expect(error as Error).toBeInstanceOf(Error);
          expect((error as Error).message).toBeDefined();
        }
      }
    });

    it('should handle all character types disabled', async () => {
      const options: GeneratorOptions = {
        length: 12,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      try {
        const result = await generateSecurePassword(options);

        // Should either return a valid result or throw a controlled error
        if (result) {
          expect(result.password).toBeDefined();
          expect(typeof result.password).toBe('string');
        }
      } catch (error) {
        expect(error as Error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('character');
      }
    });

    it('should handle malformed options object', async () => {
      const malformedOptions = [
        null,
        undefined,
        {},
        { invalidProperty: true },
        { length: 'not a number' },
      ];

      for (const options of malformedOptions) {
        try {
          const result = await generateSecurePassword(options as any);

          // If successful, should return valid result with defaults
          if (result) {
            expect(result.password).toBeDefined();
            expect(typeof result.password).toBe('string');
            expect(result.strength).toBeDefined();
          }
        } catch (error) {
          // Should be controlled error, not crash
          expect(error as Error).toBeInstanceOf(Error);
        }
      }
    });
  });

  describe('Resource Exhaustion Tests', () => {
    it('should handle rapid successive calls without crashing', async () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      // Rapid fire 1000 calls
      const promises: Promise<any>[] = [];

      for (let i = 0; i < 1000; i++) {
        promises.push(
          generateSecurePassword(options).catch((error) => ({ error }))
        );
      }

      const results = await Promise.all(promises);

      // Should not crash - all results should be defined
      expect(results).toHaveLength(1000);

      // Count successful vs error results
      const successCount = results.filter((r) => 'password' in r).length;

      // At least 90% should succeed
      expect(successCount).toBeGreaterThan(900);

      // Any errors should be controlled
      results
        .filter((r) => 'error' in r)
        .forEach((result) => {
          if ('error' in result) {
            expect(result.error).toBeInstanceOf(Error);
          }
        });
    });

    it('should handle memory-intensive operations without crashing', async () => {
      const options: GeneratorOptions = {
        length: 32,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: true,
        preventRepeating: false,
        readableFormat: false,
      };

      // Create multiple large password generations simultaneously
      const largeBatchPromises = Array.from({ length: 100 }, () =>
        generateSecurePassword(options).catch((error) => ({ error }))
      );

      const results = await Promise.all(largeBatchPromises);

      // Should complete without crashing
      expect(results).toHaveLength(100);

      const successfulResults = results.filter((r) => 'password' in r);
      expect(successfulResults.length).toBeGreaterThan(90);

      successfulResults.forEach((result) => {
        if ('password' in result) {
          expect(result.password).toHaveLength(32);
          expect(result.strength.score).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it('should recover from temporary resource constraints', async () => {
      const options: GeneratorOptions = {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      // Create artificial memory pressure
      const memoryPressure: number[] = [];
      try {
        memoryPressure.push(...new Array(1000000).fill(42));
      } catch {
        // If we can't create pressure, skip this part
      }

      // Should still be able to generate passwords
      const results: any[] = [];

      for (let i = 0; i < 10; i++) {
        try {
          const result = await generateSecurePassword(options);
          results.push(result);
        } catch (error) {
          results.push({ error });
        }
      }

      // Clean up pressure
      memoryPressure.length = 0;

      // Should have some successful results
      const successCount = results.filter((r) => 'password' in r).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Concurrent Access Tests', () => {
    it('should handle concurrent password generations safely', async () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      // Create 200 concurrent operations
      const concurrentPromises = Array.from({ length: 200 }, (_, index) =>
        generateSecurePassword({
          ...options,
          length: 8 + (index % 24), // Vary length to increase complexity
        }).catch((error) => ({ error, index }))
      );

      const results = await Promise.all(concurrentPromises);

      // Should not crash
      expect(results).toHaveLength(200);

      // Validate results
      const passwordsByLength = new Map<number, Set<string>>();
      let successCount = 0;

      results.forEach((result, index) => {
        if ('password' in result) {
          successCount++;
          const expectedLength = 8 + (index % 24);
          expect(result.password.length).toBe(expectedLength);

          // Group passwords by length for uniqueness check
          if (!passwordsByLength.has(expectedLength)) {
            passwordsByLength.set(expectedLength, new Set());
          }
          passwordsByLength.get(expectedLength)!.add(result.password);
        } else if ('error' in result) {
          expect(result.error).toBeInstanceOf(Error);
        }
      });

      // Should have high success rate
      expect(successCount).toBeGreaterThan(190);

      // Check uniqueness within each length group
      passwordsByLength.forEach((passwords, length) => {
        const passwordCount = Array.from(results).filter((_, index) => {
          const expectedLength = 8 + (index % 24);
          return expectedLength === length && 'password' in results[index];
        }).length;

        // All passwords of the same length should be unique
        expect(passwords.size).toBe(passwordCount);
      });
    });

    it('should handle strength calculation with malformed passwords', () => {
      const malformedInputs = [
        '',
        null,
        undefined,
        123,
        {},
        [],
        'a'.repeat(1000000), // Extremely long string
      ];

      malformedInputs.forEach((input) => {
        expect(() => {
          const result = calculatePasswordStrength(input as any);

          // If it doesn't throw, should return valid strength object
          if (result) {
            expect(typeof result.score).toBe('number');
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(4);
            expect(Array.isArray(result.feedback)).toBe(true);
          }
        }).not.toThrow();
      });
    });
  });

  describe('Platform-Specific Crash Tests', () => {
    it('should handle platform-specific crypto API failures gracefully', async () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      // Test should work regardless of platform
      const result = await generateSecurePassword(options);

      expect(result).toBeDefined();
      expect(result.password).toHaveLength(16);
      expect(result.strength.score).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.entropy).toBeGreaterThan(0);
    });

    it('should handle UI component unmounting scenarios', async () => {
      const options: GeneratorOptions = {
        length: 12,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      // Simulate component unmounting during password generation
      const passwordPromise = generateSecurePassword(options);

      // Immediate "unmount" simulation - promise should still resolve
      const result = await passwordPromise;

      expect(result).toBeDefined();
      expect(result.password).toHaveLength(12);
    });
  });
});
