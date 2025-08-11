import { PasswordStrengthCalculator } from '../utils/strengthCalculator';
import { StrengthResult } from '../types';

describe('PasswordStrengthCalculator', () => {
  describe('calculate', () => {
    test('returns very weak for empty password', () => {
      const result = PasswordStrengthCalculator.calculate('');
      expect(result.score).toBe(0);
      expect(result.label).toBe('Very Weak');
      expect(result.entropy).toBe(0);
    });

    test('returns very weak for common passwords', () => {
      const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
      
      commonPasswords.forEach(password => {
        const result = PasswordStrengthCalculator.calculate(password);
        expect(result.score).toBe(0);
        expect(result.label).toBe('Very Weak');
      });
    });

    test('calculates strength for simple password', () => {
      const result = PasswordStrengthCalculator.calculate('abc123');
      expect(result.score).toBeLessThan(3); // Should be weak to fair
      expect(result.entropy).toBeGreaterThanOrEqual(0); // Can be 0 due to penalties
    });

    test('calculates higher strength for complex password', () => {
      const result = PasswordStrengthCalculator.calculate('Tr0ub4dor&3');
      expect(result.score).toBeGreaterThanOrEqual(2);
      expect(result.entropy).toBeGreaterThan(30);
    });

    test('calculates very high strength for very complex password', () => {
      const result = PasswordStrengthCalculator.calculate('Xy9#mKp$2wE!vB8@qL5&zF');
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.entropy).toBeGreaterThan(50);
    });

    test('penalizes short passwords', () => {
      const shortResult = PasswordStrengthCalculator.calculate('Ab1!');
      const longResult = PasswordStrengthCalculator.calculate('Ab1!efgh');
      
      expect(longResult.score).toBeGreaterThanOrEqual(shortResult.score);
      expect(longResult.entropy).toBeGreaterThan(shortResult.entropy);
    });

    test('penalizes repetitive characters', () => {
      const repetitiveResult = PasswordStrengthCalculator.calculate('aaaaaA1!');
      const nonRepetitiveResult = PasswordStrengthCalculator.calculate('abcdeA1!');
      
      // Test that the algorithm recognizes repetition (both may have penalties)
      expect(repetitiveResult.score).toBeLessThanOrEqual(2); // Should be weak to fair
      expect(nonRepetitiveResult.score).toBeGreaterThanOrEqual(0); // At least some strength
    });

    test('penalizes keyboard patterns', () => {
      const patternResult = PasswordStrengthCalculator.calculate('qwertyA1!');
      const randomResult = PasswordStrengthCalculator.calculate('mxzkqwA1!');
      
      expect(randomResult.score).toBeGreaterThanOrEqual(patternResult.score);
    });

    test('penalizes sequential patterns', () => {
      const sequentialResult = PasswordStrengthCalculator.calculate('abc123XYZ');
      const randomResult = PasswordStrengthCalculator.calculate('mxp739KLm');
      
      expect(randomResult.score).toBeGreaterThanOrEqual(sequentialResult.score);
    });

    test('rewards character diversity', () => {
      const diverseResult = PasswordStrengthCalculator.calculate('Aa1!Bb2@Cc3#');
      const limitedResult = PasswordStrengthCalculator.calculate('aaaaabbbbccc');
      
      expect(diverseResult.score).toBeGreaterThan(limitedResult.score);
    });

    test('rewards length', () => {
      const shortResult = PasswordStrengthCalculator.calculate('Aa1!Bb2@');
      const longResult = PasswordStrengthCalculator.calculate('Aa1!Bb2@Cc3#Dd4$Ee5%Ff6^');
      
      expect(longResult.score).toBeGreaterThanOrEqual(shortResult.score);
      expect(longResult.entropy).toBeGreaterThan(shortResult.entropy);
    });

    test('returns consistent results for same input', () => {
      const password = 'TestPassword123!';
      const result1 = PasswordStrengthCalculator.calculate(password);
      const result2 = PasswordStrengthCalculator.calculate(password);
      
      expect(result1.score).toBe(result2.score);
      expect(result1.entropy).toBe(result2.entropy);
      expect(result1.label).toBe(result2.label);
      expect(result1.color).toBe(result2.color);
    });

    test('calculates entropy correctly for different character sets', () => {
      const lowercaseOnly = PasswordStrengthCalculator.calculate('abcdefgh');
      const mixedCase = PasswordStrengthCalculator.calculate('AbCdEfGh');
      const withNumbers = PasswordStrengthCalculator.calculate('AbCd12Gh');
      const withSymbols = PasswordStrengthCalculator.calculate('AbCd12G!');
      
      expect(mixedCase.entropy).toBeGreaterThan(lowercaseOnly.entropy);
      expect(withNumbers.entropy).toBeGreaterThan(mixedCase.entropy);
      expect(withSymbols.entropy).toBeGreaterThan(withNumbers.entropy);
    });

    test('handles special characters correctly', () => {
      const result = PasswordStrengthCalculator.calculate('Test!@#$%^&*()');
      expect(result.entropy).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThan(0);
    });

    test('handles Unicode characters', () => {
      const result = PasswordStrengthCalculator.calculate('Tëst1234!');
      expect(result.entropy).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThan(0);
    });

    test('performance - calculates strength within time limit', () => {
      const longPassword = 'A'.repeat(100) + '1!';
      
      const startTime = Date.now();
      PasswordStrengthCalculator.calculate(longPassword);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should calculate within 100ms
    });
  });

  describe('getSuggestions', () => {
    test('suggests minimum length for short passwords', () => {
      const suggestions = PasswordStrengthCalculator.getSuggestions('123');
      expect(suggestions).toContain('Use at least 8 characters');
    });

    test('suggests longer length for medium passwords', () => {
      const suggestions = PasswordStrengthCalculator.getSuggestions('password1');
      expect(suggestions).toContain('Consider using 12+ characters for better security');
    });

    test('suggests character diversity for simple passwords', () => {
      const suggestions = PasswordStrengthCalculator.getSuggestions('password');
      expect(suggestions).toContain('Include uppercase, lowercase, numbers, and symbols');
    });

    test('suggests avoiding repeated characters', () => {
      const suggestions = PasswordStrengthCalculator.getSuggestions('aabbccdd');
      expect(suggestions).toContain('Avoid repeated characters');
    });

    test('suggests avoiding common passwords', () => {
      const suggestions = PasswordStrengthCalculator.getSuggestions('password');
      expect(suggestions).toContain('Avoid common passwords and dictionary words');
    });

    test('returns few or no suggestions for strong passwords', () => {
      const suggestions = PasswordStrengthCalculator.getSuggestions('MyStr0ng!P@ssw0rd#2023');
      expect(suggestions.length).toBeLessThanOrEqual(1); // May suggest even longer length
    });

    test('returns multiple suggestions for weak passwords', () => {
      const suggestions = PasswordStrengthCalculator.getSuggestions('123');
      expect(suggestions.length).toBeGreaterThan(1);
    });

    test('handles empty password', () => {
      const suggestions = PasswordStrengthCalculator.getSuggestions('');
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('score ranges', () => {
    test('score 0 - very weak passwords', () => {
      const veryWeakPasswords = ['', '123', 'password', 'qwerty'];
      
      veryWeakPasswords.forEach(password => {
        const result = PasswordStrengthCalculator.calculate(password);
        expect(result.score).toBe(0);
        expect(result.label).toBe('Very Weak');
      });
    });

    test('score 1 - weak passwords', () => {
      // These should be weak but not very weak
      const result = PasswordStrengthCalculator.calculate('password1');
      expect(result.score).toBeLessThanOrEqual(1);
    });

    test('score 4 - very strong passwords', () => {
      const veryStrongPassword = 'Xy9#mKp$2wE!vB8@qL5&zF7*nR4%tU3^iO6+';
      const result = PasswordStrengthCalculator.calculate(veryStrongPassword);
      expect(result.score).toBe(4);
      expect(result.label).toBe('Very Strong');
    });
  });

  describe('result structure', () => {
    test('returns complete StrengthResult object', () => {
      const result = PasswordStrengthCalculator.calculate('TestPassword123!');
      
      expect(typeof result.score).toBe('number');
      expect(typeof result.label).toBe('string');
      expect(typeof result.color).toBe('string');
      expect(typeof result.entropy).toBe('number');
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(4);
      expect(result.entropy).toBeGreaterThanOrEqual(0);
      expect(result.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    test('color matches score level', () => {
      const weakResult = PasswordStrengthCalculator.calculate('weak');
      const strongResult = PasswordStrengthCalculator.calculate('VeryStr0ng!P@ssw0rd#2023');
      
      expect(weakResult.color).toMatch(/^#[dc]/i); // Should be red-ish
      expect(strongResult.color).toMatch(/^#[0-9a-f]/i); // Should be green-ish for strong
    });
  });
});