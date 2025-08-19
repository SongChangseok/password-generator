import { generateSecurePassword } from '../passwordGenerator';
import { calculatePasswordStrength } from '../strengthCalculator';
import { GeneratorOptions } from '../types';

describe('Usability Tests (UX Perspective)', () => {
  describe('User Input Validation and Feedback', () => {
    it('should provide meaningful error messages for invalid inputs', async () => {
      // Test invalid length values
      const invalidLengthCases = [
        {
          length: 7,
          expected: 'Password length must be between 8 and 32 characters',
        },
        {
          length: 33,
          expected: 'Password length must be between 8 and 32 characters',
        },
      ];

      for (const testCase of invalidLengthCases) {
        const options: GeneratorOptions = {
          length: testCase.length,
          includeUppercase: true,
          includeLowercase: true,
          includeNumbers: true,
          includeSymbols: true,
          excludeSimilar: false,
          includeAmbiguous: true,
        };

        await expect(generateSecurePassword(options)).rejects.toThrow(
          testCase.expected
        );
      }
    });

    it('should guide users when no character types are selected', async () => {
      const options: GeneratorOptions = {
        length: 12,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
        includeAmbiguous: false,
      };

      await expect(generateSecurePassword(options)).rejects.toThrow(
        'At least one character type must be selected'
      );
    });

    it('should provide helpful strength feedback', () => {
      const testCases = [
        {
          password: '123456',
          expectedFeedback: [
            'Use at least 8 characters',
            'Add uppercase letters',
            'Add symbols',
          ],
        },
        {
          password: 'password',
          expectedFeedback: [
            'Add uppercase letters',
            'Add numbers',
            'Add symbols',
            'Avoid common passwords',
          ],
        },
        {
          password: 'weakpass',
          expectedFeedback: [
            'Add uppercase letters',
            'Add numbers',
            'Add symbols',
          ],
        },
      ];

      testCases.forEach((testCase) => {
        const strength = calculatePasswordStrength(testCase.password);

        expect(strength.feedback).toBeDefined();
        expect(strength.feedback.length).toBeGreaterThan(0);

        // Check that expected feedback items are present
        testCase.expectedFeedback.forEach((expectedItem) => {
          const hasExpectedFeedback = strength.feedback.some(
            (feedback) =>
              feedback
                .toLowerCase()
                .includes(expectedItem.toLowerCase().split(' ')[1]) ||
              feedback
                .toLowerCase()
                .includes(expectedItem.toLowerCase().split(' ')[0])
          );
          expect(hasExpectedFeedback).toBe(true);
        });
      });
    });
  });

  describe('Password Generation UX', () => {
    it('should generate passwords that feel random to users', async () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        includeAmbiguous: true,
      };

      const passwords: string[] = [];

      // Generate multiple passwords
      for (let i = 0; i < 20; i++) {
        const result = await generateSecurePassword(options);
        passwords.push(result.password);
      }

      // Check for patterns that might make passwords feel predictable
      passwords.forEach((password) => {
        // Should not start with same character pattern
        expect(password).not.toMatch(/^(.)\1{2,}/); // No 3+ same chars at start

        // Should not end with predictable patterns
        expect(password).not.toMatch(/123+$|abc+$/i); // No simple sequences at end

        // Should have good character distribution (at least 3 of 4 types)
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasDigit = /[0-9]/.test(password);
        const hasSymbol = /[^A-Za-z0-9]/.test(password);

        const typeCount = [hasUpper, hasLower, hasDigit, hasSymbol].filter(
          Boolean
        ).length;
        expect(typeCount).toBeGreaterThanOrEqual(3);
      });

      // Passwords should be sufficiently different from each other
      const uniquePasswords = new Set(passwords);
      expect(uniquePasswords.size).toBe(passwords.length); // All unique
    });

    it('should generate strong passwords by default', async () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        includeAmbiguous: true,
      };

      const results = [];
      for (let i = 0; i < 10; i++) {
        const result = await generateSecurePassword(options);
        results.push(result);
      }

      // Most passwords should be "Good" or "Strong" (score 3-4)
      const strongPasswords = results.filter((r) => r.strength.score >= 3);
      expect(strongPasswords.length).toBeGreaterThanOrEqual(8);

      // All should be at least "Fair" (score 2+)
      results.forEach((result) => {
        expect(result.strength.score).toBeGreaterThanOrEqual(2);
      });
    });

    it('should handle common user preferences correctly', async () => {
      // Test case: User wants symbols excluded (common preference)
      const noSymbolsOptions: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: false,
        includeAmbiguous: true,
      };

      const result1 = await generateSecurePassword(noSymbolsOptions);
      expect(result1.password).toMatch(/^[A-Za-z0-9]+$/);
      expect(result1.password).toHaveLength(16);

      // Test case: User wants similar characters excluded (accessibility)
      const noSimilarOptions: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: true,
        includeAmbiguous: true,
      };

      const result2 = await generateSecurePassword(noSimilarOptions);
      expect(result2.password).not.toMatch(/[IL01]/); // Should exclude similar chars
      expect(result2.password).toHaveLength(16);
    });
  });

  describe('Response Time and User Experience', () => {
    it('should provide instant feedback (< 100ms for UI responsiveness)', async () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        includeAmbiguous: true,
      };

      const times: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        const result = await generateSecurePassword(options);
        const endTime = performance.now();

        const duration = endTime - startTime;
        times.push(duration);

        expect(result.password).toHaveLength(16);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxTime = Math.max(...times);

      console.log(
        `UI Responsiveness: avg=${avgTime.toFixed(1)}ms, max=${maxTime.toFixed(1)}ms`
      );

      // For good UX, response should be under 100ms
      expect(avgTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(100);
    });

    it('should handle user interactions without blocking', async () => {
      const options: GeneratorOptions = {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        includeAmbiguous: true,
      };

      // Simulate rapid user interactions (clicking generate button quickly)
      const rapidClicks = Array(5)
        .fill(null)
        .map(() => generateSecurePassword(options));

      const results = await Promise.all(rapidClicks);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.password).toHaveLength(20);
        expect(result.strength.score).toBeGreaterThanOrEqual(0);
      });

      // All results should be unique (no race conditions)
      const uniquePasswords = new Set(results.map((r) => r.password));
      expect(uniquePasswords.size).toBe(5);
    });
  });

  describe('Accessibility and Error Handling', () => {
    it('should provide accessible error messages', async () => {
      // Test error messages are descriptive enough for screen readers
      const testCases = [
        {
          options: {
            length: 5,
            includeUppercase: true,
            includeLowercase: false,
            includeNumbers: false,
            includeSymbols: false,
            excludeSimilar: false,
            includeAmbiguous: true,
          },
          expectedErrorPattern: /length must be between/i,
        },
        {
          options: {
            length: 50,
            includeUppercase: true,
            includeLowercase: false,
            includeNumbers: false,
            includeSymbols: false,
            excludeSimilar: false,
            includeAmbiguous: true,
          },
          expectedErrorPattern: /length must be between/i,
        },
      ];

      for (const testCase of testCases) {
        try {
          await generateSecurePassword(testCase.options as GeneratorOptions);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error.message).toMatch(testCase.expectedErrorPattern);
          expect(error.message.length).toBeGreaterThan(10); // Descriptive enough
        }
      }
    });

    it('should handle edge cases gracefully', async () => {
      // Test minimum viable configuration
      const minimalOptions: GeneratorOptions = {
        length: 8,
        includeUppercase: false,
        includeLowercase: true,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
        includeAmbiguous: true,
      };

      const result = await generateSecurePassword(minimalOptions);
      expect(result.password).toHaveLength(8);
      expect(result.password).toMatch(/^[a-z]+$/);
    });

    it('should provide consistent strength scoring', () => {
      const testPasswords = [
        'a', // Very weak
        'abcdefgh', // Weak
        'Abcdefgh', // Fair
        'Abcdefg1', // Good
        'Abcdefg1!', // Strong
      ];

      const scores: number[] = [];
      testPasswords.forEach((password) => {
        const strength = calculatePasswordStrength(password);
        scores.push(strength.score);

        // Strength should increase with complexity
        expect(strength.score).toBeGreaterThanOrEqual(0);
        expect(strength.score).toBeLessThanOrEqual(4);
        expect(strength.feedback).toBeDefined();
      });

      // Scores should generally increase with password complexity
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
      }
    });
  });
});
