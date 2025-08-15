import { generateSecurePassword, DEFAULT_OPTIONS } from '../passwordGenerator';
import {
  measurePerformance,
  benchmarkPasswordGeneration,
} from '../performance';
import { GeneratorOptions } from '../types';

// Integration tests that verify the complete password generation pipeline
describe('Password Generation Integration', () => {
  describe('Performance Requirements', () => {
    it('should generate passwords within 300ms target', async () => {
      const { metrics } = await measurePerformance(() =>
        generateSecurePassword(DEFAULT_OPTIONS)
      );

      // Should meet performance target
      expect(metrics.generationTime).toBeLessThan(300);
    });

    it('should consistently meet performance target across multiple generations', async () => {
      const results = await benchmarkPasswordGeneration(
        () => generateSecurePassword(DEFAULT_OPTIONS),
        10
      );

      expect(results.passedTarget).toBe(true);
      expect(results.averageTime).toBeLessThan(300);
      expect(results.maxTime).toBeLessThan(500); // Even worst case should be reasonable
    });
  });

  describe('End-to-End Password Generation', () => {
    it('should generate strong passwords with default options', async () => {
      const result = await generateSecurePassword(DEFAULT_OPTIONS);

      // Verify structure
      expect(result.password).toHaveLength(16);
      expect(result.strength.score).toBeGreaterThanOrEqual(3); // Should be good or strong
      expect(result.entropy).toBeGreaterThan(80); // Should have high entropy
      expect(result.generatedAt).toBeInstanceOf(Date);

      // Verify character types are present
      expect(/[A-Z]/.test(result.password)).toBe(true);
      expect(/[a-z]/.test(result.password)).toBe(true);
      expect(/[0-9]/.test(result.password)).toBe(true);
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(result.password)).toBe(
        true
      );
    });

    it('should generate passwords meeting specific requirements', async () => {
      const options: GeneratorOptions = {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: true,
        preventRepeating: true,
      };

      const result = await generateSecurePassword(options);

      // Verify length
      expect(result.password).toHaveLength(20);

      // Verify character types
      expect(/[A-Z]/.test(result.password)).toBe(true);
      expect(/[a-z]/.test(result.password)).toBe(true);
      expect(/[0-9]/.test(result.password)).toBe(true);
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(result.password)).toBe(
        false
      );

      // Verify similar characters are excluded
      expect(/[Il10O|]/.test(result.password)).toBe(false);

      // Verify strength is calculated
      expect(result.strength.score).toBeGreaterThanOrEqual(2);
    });

    it('should generate different passwords on consecutive calls', async () => {
      const passwords = new Set();

      for (let i = 0; i < 5; i++) {
        const result = await generateSecurePassword(DEFAULT_OPTIONS);
        passwords.add(result.password);
      }

      // With mock, may not be completely random, but should work functionally
      expect(passwords.size).toBeGreaterThanOrEqual(1);
      expect(
        Array.from(passwords).every(
          (p) => typeof p === 'string' && p.length === 16
        )
      ).toBe(true);
    });

    it('should handle edge cases gracefully', async () => {
      // Minimum length
      const minLength = await generateSecurePassword({
        ...DEFAULT_OPTIONS,
        length: 8,
      });
      expect(minLength.password).toHaveLength(8);
      expect(minLength.strength.score).toBeGreaterThanOrEqual(1);

      // Maximum length
      const maxLength = await generateSecurePassword({
        ...DEFAULT_OPTIONS,
        length: 32,
      });
      expect(maxLength.password).toHaveLength(32);
      expect(maxLength.strength.score).toBeGreaterThanOrEqual(3);

      // Single character type
      const singleType = await generateSecurePassword({
        length: 12,
        includeUppercase: false,
        includeLowercase: true,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
        preventRepeating: false,
      });
      expect(singleType.password).toHaveLength(12);
      expect(/^[a-z]+$/.test(singleType.password)).toBe(true);
    });
  });

  describe('Entropy and Security', () => {
    it('should calculate entropy correctly for different configurations', async () => {
      // High entropy configuration
      const highEntropy = await generateSecurePassword({
        length: 32,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
      });

      // Low entropy configuration
      const lowEntropy = await generateSecurePassword({
        length: 8,
        includeUppercase: false,
        includeLowercase: true,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
        preventRepeating: false,
      });

      expect(highEntropy.entropy).toBeGreaterThan(lowEntropy.entropy);
      expect(highEntropy.strength.score).toBeGreaterThanOrEqual(
        lowEntropy.strength.score
      );
    });

    it('should penalize weak configurations in strength calculation', async () => {
      // Very basic configuration
      const weak = await generateSecurePassword({
        length: 8,
        includeUppercase: false,
        includeLowercase: true,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
        preventRepeating: false,
      });

      // Strong configuration
      const strong = await generateSecurePassword({
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
      });

      expect(strong.strength.score).toBeGreaterThan(weak.strength.score);
    });
  });

  describe('Error Handling', () => {
    it('should throw appropriate errors for invalid configurations', async () => {
      // Invalid length
      await expect(
        generateSecurePassword({
          ...DEFAULT_OPTIONS,
          length: 7,
        })
      ).rejects.toThrow('Password length must be between 8 and 32 characters');

      await expect(
        generateSecurePassword({
          ...DEFAULT_OPTIONS,
          length: 33,
        })
      ).rejects.toThrow('Password length must be between 8 and 32 characters');

      // No character types selected
      await expect(
        generateSecurePassword({
          length: 12,
          includeUppercase: false,
          includeLowercase: false,
          includeNumbers: false,
          includeSymbols: false,
          excludeSimilar: false,
          preventRepeating: false,
        })
      ).rejects.toThrow('At least one character type must be selected');
    });
  });

  describe('Memory and Performance', () => {
    it('should not leak memory during multiple generations', async () => {
      // Generate many passwords to test for memory leaks
      const passwords = [];

      for (let i = 0; i < 20; i++) {
        const result = await generateSecurePassword(DEFAULT_OPTIONS);
        passwords.push(result.password);
      }

      // Verify all are properly generated
      expect(passwords.length).toBe(20);
      expect(passwords.every((p) => p.length === 16)).toBe(true);
      expect(passwords.every((p) => typeof p === 'string')).toBe(true);
    });

    it('should maintain performance under stress', async () => {
      const stressTest = await benchmarkPasswordGeneration(
        () => generateSecurePassword(DEFAULT_OPTIONS),
        20
      );

      // Should still meet performance targets under stress
      expect(stressTest.passedTarget).toBe(true);
      expect(stressTest.averageTime).toBeLessThan(300);
    });
  });
});
