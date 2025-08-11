import { PasswordGenerator } from '../../utils/passwordGenerator';
import { GeneratorOptions } from '../../types/password';

// Mock crypto.getRandomValues for consistent testing
const mockGetRandomValues = jest.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues
  }
});

describe('PasswordGenerator', () => {
  beforeEach(() => {
    mockGetRandomValues.mockClear();
    // Default mock returns array with value 0
    mockGetRandomValues.mockImplementation((arr: Uint32Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = 0;
      }
    });
  });

  describe('generate', () => {
    it('should generate password with correct length', () => {
      const options: GeneratorOptions = {
        length: 12,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecialChars: true,
        excludeSimilarChars: false,
        preventConsecutiveChars: false,
        readableFormat: false
      };

      const password = PasswordGenerator.generate(options);
      expect(password.length).toBe(12);
    });

    it('should generate password with only selected character types', () => {
      const options: GeneratorOptions = {
        length: 8,
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: false,
        includeSpecialChars: false,
        excludeSimilarChars: false,
        preventConsecutiveChars: false,
        readableFormat: false
      };

      const password = PasswordGenerator.generate(options);
      expect(password).toMatch(/^[A-Z]+$/);
    });

    it('should include at least one character from each selected type', () => {
      // Mock random values to ensure predictable character selection
      let callCount = 0;
      mockGetRandomValues.mockImplementation((arr: Uint32Array) => {
        arr[0] = callCount % 26; // Rotate through character positions
        callCount++;
      });

      const options: GeneratorOptions = {
        length: 8,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecialChars: true,
        excludeSimilarChars: false,
        preventConsecutiveChars: false,
        readableFormat: false
      };

      const password = PasswordGenerator.generate(options);
      
      expect(password).toMatch(/[A-Z]/); // At least one uppercase
      expect(password).toMatch(/[a-z]/); // At least one lowercase
      expect(password).toMatch(/[0-9]/); // At least one number
      expect(password).toMatch(/[^a-zA-Z0-9]/); // At least one special char
    });

    it('should exclude similar characters when option is enabled', () => {
      const options: GeneratorOptions = {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecialChars: false,
        excludeSimilarChars: true,
        preventConsecutiveChars: false,
        readableFormat: false
      };

      // Generate multiple passwords to test
      for (let i = 0; i < 10; i++) {
        const password = PasswordGenerator.generate(options);
        expect(password).not.toMatch(/[0OlI1i]/);
      }
    });

    it('should format password readably when option is enabled', () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecialChars: false,
        excludeSimilarChars: false,
        preventConsecutiveChars: false,
        readableFormat: true
      };

      const password = PasswordGenerator.generate(options);
      // Should be formatted as XXXX-XXXX-XXXX-XXXX
      expect(password).toMatch(/^.{4}-.{4}-.{4}-.{4}$/);
      // Remove dashes and check original length
      expect(password.replace(/-/g, '').length).toBe(16);
    });

    it('should validate options and throw errors for invalid inputs', () => {
      expect(() => {
        PasswordGenerator.generate({
          length: 3, // Too short
          includeUppercase: true,
          includeLowercase: false,
          includeNumbers: false,
          includeSpecialChars: false,
          excludeSimilarChars: false,
          preventConsecutiveChars: false,
          readableFormat: false
        });
      }).toThrow('Password length must be between 4 and 128 characters');

      expect(() => {
        PasswordGenerator.generate({
          length: 129, // Too long
          includeUppercase: true,
          includeLowercase: false,
          includeNumbers: false,
          includeSpecialChars: false,
          excludeSimilarChars: false,
          preventConsecutiveChars: false,
          readableFormat: false
        });
      }).toThrow('Password length must be between 4 and 128 characters');

      expect(() => {
        PasswordGenerator.generate({
          length: 8,
          includeUppercase: false, // No character types selected
          includeLowercase: false,
          includeNumbers: false,
          includeSpecialChars: false,
          excludeSimilarChars: false,
          preventConsecutiveChars: false,
          readableFormat: false
        });
      }).toThrow('At least one character type must be selected');
    });

    it('should generate different passwords on subsequent calls', () => {
      // Mock different random values for each call
      let callIndex = 0;
      mockGetRandomValues.mockImplementation((arr: Uint32Array) => {
        arr[0] = callIndex++ % 100;
      });

      const options: GeneratorOptions = {
        length: 10,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecialChars: true,
        excludeSimilarChars: false,
        preventConsecutiveChars: false,
        readableFormat: false
      };

      const password1 = PasswordGenerator.generate(options);
      const password2 = PasswordGenerator.generate(options);
      
      expect(password1).not.toBe(password2);
    });

    it('should handle minimum length password', () => {
      const options: GeneratorOptions = {
        length: 4,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecialChars: true,
        excludeSimilarChars: false,
        preventConsecutiveChars: false,
        readableFormat: false
      };

      const password = PasswordGenerator.generate(options);
      expect(password.length).toBe(4);
    });

    it('should handle maximum length password', () => {
      const options: GeneratorOptions = {
        length: 128,
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: false,
        includeSpecialChars: false,
        excludeSimilarChars: false,
        preventConsecutiveChars: false,
        readableFormat: false
      };

      const password = PasswordGenerator.generate(options);
      expect(password.length).toBe(128);
    });
  });

  describe('getCharacterPoolSize', () => {
    it('should return correct character pool size for various options', () => {
      expect(PasswordGenerator.getCharacterPoolSize({
        length: 8,
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: false,
        includeSpecialChars: false,
        excludeSimilarChars: false,
        preventConsecutiveChars: false,
        readableFormat: false
      })).toBe(26); // Only uppercase

      expect(PasswordGenerator.getCharacterPoolSize({
        length: 8,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: false,
        includeSpecialChars: false,
        excludeSimilarChars: false,
        preventConsecutiveChars: false,
        readableFormat: false
      })).toBe(52); // Uppercase + lowercase

      expect(PasswordGenerator.getCharacterPoolSize({
        length: 8,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecialChars: true,
        excludeSimilarChars: false,
        preventConsecutiveChars: false,
        readableFormat: false
      })).toBe(88); // All character types (26+26+10+26 special chars)
    });

    it('should account for excluded similar characters', () => {
      const withSimilar = PasswordGenerator.getCharacterPoolSize({
        length: 8,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecialChars: false,
        excludeSimilarChars: false,
        preventConsecutiveChars: false,
        readableFormat: false
      });

      const withoutSimilar = PasswordGenerator.getCharacterPoolSize({
        length: 8,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecialChars: false,
        excludeSimilarChars: true,
        preventConsecutiveChars: false,
        readableFormat: false
      });

      expect(withoutSimilar).toBeLessThan(withSimilar);
    });
  });

  describe('fallback behavior', () => {
    it('should work when crypto.getRandomValues is not available', () => {
      // Temporarily remove crypto
      const originalCrypto = global.crypto;
      delete (global as any).crypto;

      // Mock Math.random
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.5);

      const options: GeneratorOptions = {
        length: 8,
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: false,
        includeSpecialChars: false,
        excludeSimilarChars: false,
        preventConsecutiveChars: false,
        readableFormat: false
      };

      const password = PasswordGenerator.generate(options);
      expect(password.length).toBe(8);
      expect(password).toMatch(/^[A-Z]+$/);

      // Restore original values
      global.crypto = originalCrypto;
      Math.random = originalRandom;
    });
  });
});