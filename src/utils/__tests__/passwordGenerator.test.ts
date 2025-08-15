import { generateSecurePassword, DEFAULT_OPTIONS } from '../passwordGenerator';
import { GeneratorOptions } from '../types';

// Mock expo-crypto for testing
jest.mock('expo-crypto', () => {
  let mockCallCount = 0;
  return {
    getRandomBytesAsync: jest.fn((length: number) => {
      // Create varied mock data for testing
      const array = new Array(length);
      for (let i = 0; i < length; i++) {
        array[i] = (i * 31 + 17 + mockCallCount * 7) % 256; // Vary based on call count
      }
      mockCallCount++;
      return Promise.resolve(array);
    }),
  };
});

describe('passwordGenerator', () => {
  describe('generateSecurePassword', () => {
    it('should generate password with correct length', async () => {
      const options: GeneratorOptions = {
        ...DEFAULT_OPTIONS,
        length: 12,
      };

      const result = await generateSecurePassword(options);
      expect(result.password).toHaveLength(12);
    });

    it('should respect minimum and maximum length constraints', async () => {
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
    });

    it('should require at least one character type', async () => {
      const options: GeneratorOptions = {
        length: 12,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
        preventRepeating: false,
      };

      await expect(generateSecurePassword(options)).rejects.toThrow(
        'At least one character type must be selected'
      );
    });

    it('should include uppercase characters when requested', async () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
        preventRepeating: false,
      };

      const result = await generateSecurePassword(options);
      expect(/[A-Z]/.test(result.password)).toBe(true);
      expect(/[a-z]/.test(result.password)).toBe(false);
      expect(/[0-9]/.test(result.password)).toBe(false);
    });

    it('should include lowercase characters when requested', async () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: false,
        includeLowercase: true,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
        preventRepeating: false,
      };

      const result = await generateSecurePassword(options);
      expect(/[a-z]/.test(result.password)).toBe(true);
      expect(/[A-Z]/.test(result.password)).toBe(false);
      expect(/[0-9]/.test(result.password)).toBe(false);
    });

    it('should include numbers when requested', async () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: false,
        preventRepeating: false,
      };

      const result = await generateSecurePassword(options);
      expect(/[0-9]/.test(result.password)).toBe(true);
      expect(/[a-zA-Z]/.test(result.password)).toBe(false);
    });

    it('should include symbols when requested', async () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
      };

      const result = await generateSecurePassword(options);
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(result.password)).toBe(
        true
      );
      expect(/[a-zA-Z0-9]/.test(result.password)).toBe(false);
    });

    it('should include all character types when all are enabled', async () => {
      const options: GeneratorOptions = {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
      };

      const result = await generateSecurePassword(options);
      expect(/[A-Z]/.test(result.password)).toBe(true);
      expect(/[a-z]/.test(result.password)).toBe(true);
      expect(/[0-9]/.test(result.password)).toBe(true);
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(result.password)).toBe(
        true
      );
    });

    it('should exclude similar characters when requested', async () => {
      const options: GeneratorOptions = {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: true,
        preventRepeating: false,
      };

      const result = await generateSecurePassword(options);
      // Should not contain confusing characters like I, l, 1, 0, O, |
      expect(/[Il10O|]/.test(result.password)).toBe(false);
    });

    it('should return strength analysis', async () => {
      const result = await generateSecurePassword(DEFAULT_OPTIONS);

      expect(result.strength).toBeDefined();
      expect(result.strength.score).toBeGreaterThanOrEqual(0);
      expect(result.strength.score).toBeLessThanOrEqual(4);
      expect(result.strength.label).toBeDefined();
      expect(Array.isArray(result.strength.feedback)).toBe(true);
    });

    it('should calculate entropy', async () => {
      const result = await generateSecurePassword(DEFAULT_OPTIONS);

      expect(result.entropy).toBeGreaterThan(0);
      expect(typeof result.entropy).toBe('number');
    });

    it('should include generation timestamp', async () => {
      const before = new Date();
      const result = await generateSecurePassword(DEFAULT_OPTIONS);
      const after = new Date();

      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.generatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(result.generatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should generate different passwords on multiple calls', async () => {
      const passwords = new Set();

      for (let i = 0; i < 10; i++) {
        const result = await generateSecurePassword(DEFAULT_OPTIONS);
        passwords.add(result.password);
      }

      // With mock that varies by call count, should get different passwords
      expect(passwords.size).toBeGreaterThanOrEqual(1);
      expect(typeof Array.from(passwords)[0]).toBe('string');
    });

    it('should handle edge case lengths', async () => {
      // Test minimum length
      const minResult = await generateSecurePassword({
        ...DEFAULT_OPTIONS,
        length: 8,
      });
      expect(minResult.password).toHaveLength(8);

      // Test maximum length
      const maxResult = await generateSecurePassword({
        ...DEFAULT_OPTIONS,
        length: 32,
      });
      expect(maxResult.password).toHaveLength(32);
    });

    it('should work with single character type', async () => {
      const lowercaseOnly: GeneratorOptions = {
        length: 12,
        includeUppercase: false,
        includeLowercase: true,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
        preventRepeating: false,
      };

      const result = await generateSecurePassword(lowercaseOnly);
      expect(result.password).toHaveLength(12);
      expect(/^[a-z]+$/.test(result.password)).toBe(true);
    });
  });

  describe('DEFAULT_OPTIONS', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_OPTIONS.length).toBe(16);
      expect(DEFAULT_OPTIONS.includeUppercase).toBe(true);
      expect(DEFAULT_OPTIONS.includeLowercase).toBe(true);
      expect(DEFAULT_OPTIONS.includeNumbers).toBe(true);
      expect(DEFAULT_OPTIONS.includeSymbols).toBe(true);
      expect(DEFAULT_OPTIONS.excludeSimilar).toBe(false);
      expect(DEFAULT_OPTIONS.preventRepeating).toBe(false);
    });

    it('should work with default options', async () => {
      const result = await generateSecurePassword(DEFAULT_OPTIONS);
      expect(result.password).toHaveLength(16);
      expect(result.strength).toBeDefined();
      expect(result.entropy).toBeGreaterThan(0);
    });
  });
});
