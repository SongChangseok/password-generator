import { ValidationUtils } from '../utils/validation';
import { GeneratorOptions, ValidationError } from '../types';
import { PASSWORD_CONSTRAINTS } from '../constants';

describe('ValidationUtils', () => {
  const validOptions: GeneratorOptions = {
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    preventRepeating: false,
  };

  describe('validateGeneratorOptions', () => {
    test('accepts valid options', () => {
      expect(() => ValidationUtils.validateGeneratorOptions(validOptions)).not.toThrow();
    });

    test('throws error for non-integer length', () => {
      const options = { ...validOptions, length: 12.5 };
      expect(() => ValidationUtils.validateGeneratorOptions(options)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateGeneratorOptions(options)).toThrow('must be an integer');
    });

    test('throws error for length too short', () => {
      const options = { ...validOptions, length: PASSWORD_CONSTRAINTS.MIN_LENGTH - 1 };
      expect(() => ValidationUtils.validateGeneratorOptions(options)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateGeneratorOptions(options)).toThrow('must be at least');
    });

    test('throws error for length too long', () => {
      const options = { ...validOptions, length: PASSWORD_CONSTRAINTS.MAX_LENGTH + 1 };
      expect(() => ValidationUtils.validateGeneratorOptions(options)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateGeneratorOptions(options)).toThrow('cannot exceed');
    });

    test('throws error when no character types selected', () => {
      const options = {
        ...validOptions,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      };
      expect(() => ValidationUtils.validateGeneratorOptions(options)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateGeneratorOptions(options)).toThrow('At least one character type');
    });

    test('throws error for non-boolean character type flags', () => {
      const options = { ...validOptions, includeUppercase: 'true' as any };
      expect(() => ValidationUtils.validateGeneratorOptions(options)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateGeneratorOptions(options)).toThrow('must be a boolean');
    });

    test('accepts minimum valid length', () => {
      const options = { ...validOptions, length: PASSWORD_CONSTRAINTS.MIN_LENGTH };
      expect(() => ValidationUtils.validateGeneratorOptions(options)).not.toThrow();
    });

    test('accepts maximum valid length', () => {
      const options = { ...validOptions, length: PASSWORD_CONSTRAINTS.MAX_LENGTH };
      expect(() => ValidationUtils.validateGeneratorOptions(options)).not.toThrow();
    });
  });

  describe('sanitizeString', () => {
    test('removes HTML special characters', () => {
      const input = 'test<script>alert("xss")</script>';
      const result = ValidationUtils.sanitizeString(input);
      expect(result).toBe('test'); // Script tags are completely removed
    });

    test('removes javascript protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = ValidationUtils.sanitizeString(input);
      expect(result).toBe('alert(xss)');
    });

    test('removes event handlers', () => {
      const input = 'test onclick=alert("xss")';
      const result = ValidationUtils.sanitizeString(input);
      expect(result).toBe('test alert(xss)');
    });

    test('trims whitespace', () => {
      const input = '  test  ';
      const result = ValidationUtils.sanitizeString(input);
      expect(result).toBe('test');
    });

    test('throws error for non-string input', () => {
      expect(() => ValidationUtils.sanitizeString(123 as any)).toThrow(ValidationError);
      expect(() => ValidationUtils.sanitizeString(null as any)).toThrow(ValidationError);
      expect(() => ValidationUtils.sanitizeString(undefined as any)).toThrow(ValidationError);
    });

    test('handles empty string', () => {
      const result = ValidationUtils.sanitizeString('');
      expect(result).toBe('');
    });
  });

  describe('validateSiteName', () => {
    test('accepts valid site name', () => {
      const result = ValidationUtils.validateSiteName('Google.com');
      expect(result).toBe('Google.com');
    });

    test('sanitizes site name', () => {
      const result = ValidationUtils.validateSiteName('Google<script>');
      expect(result).toBe('Googlescript');
    });

    test('throws error for empty site name after sanitization', () => {
      expect(() => ValidationUtils.validateSiteName('')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateSiteName('   ')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateSiteName('<>')).toThrow(ValidationError);
    });

    test('throws error for site name too long', () => {
      const longName = 'a'.repeat(101);
      expect(() => ValidationUtils.validateSiteName(longName)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateSiteName(longName)).toThrow('cannot exceed 100 characters');
    });

    test('accepts maximum length site name', () => {
      const maxName = 'a'.repeat(100);
      const result = ValidationUtils.validateSiteName(maxName);
      expect(result).toBe(maxName);
    });
  });

  describe('validateAccountName', () => {
    test('accepts valid account name', () => {
      const result = ValidationUtils.validateAccountName('user@example.com');
      expect(result).toBe('user@example.com');
    });

    test('returns undefined for empty input', () => {
      const result = ValidationUtils.validateAccountName('');
      expect(result).toBeUndefined();
    });

    test('returns undefined for undefined input', () => {
      const result = ValidationUtils.validateAccountName(undefined);
      expect(result).toBeUndefined();
    });

    test('sanitizes account name', () => {
      const result = ValidationUtils.validateAccountName('user<script>@example.com');
      expect(result).toBe('userscript@example.com');
    });

    test('throws error for account name too long', () => {
      const longName = 'a'.repeat(101);
      expect(() => ValidationUtils.validateAccountName(longName)).toThrow(ValidationError);
    });

    test('returns undefined for input that becomes empty after sanitization', () => {
      const result = ValidationUtils.validateAccountName('<>');
      expect(result).toBeUndefined();
    });
  });

  describe('validateMemo', () => {
    test('accepts valid memo', () => {
      const result = ValidationUtils.validateMemo('This is a test memo');
      expect(result).toBe('This is a test memo');
    });

    test('returns undefined for empty input', () => {
      const result = ValidationUtils.validateMemo('');
      expect(result).toBeUndefined();
    });

    test('returns undefined for undefined input', () => {
      const result = ValidationUtils.validateMemo(undefined);
      expect(result).toBeUndefined();
    });

    test('sanitizes memo', () => {
      const result = ValidationUtils.validateMemo('Memo<script>alert("xss")</script>');
      expect(result).toBe('Memo'); // Script tags are completely removed
    });

    test('throws error for memo too long', () => {
      const longMemo = 'a'.repeat(501);
      expect(() => ValidationUtils.validateMemo(longMemo)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateMemo(longMemo)).toThrow('cannot exceed 500 characters');
    });

    test('accepts maximum length memo', () => {
      const maxMemo = 'a'.repeat(500);
      const result = ValidationUtils.validateMemo(maxMemo);
      expect(result).toBe(maxMemo);
    });
  });

  describe('validatePasswordId', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    test('accepts valid UUID', () => {
      expect(() => ValidationUtils.validatePasswordId(validUuid)).not.toThrow();
    });

    test('throws error for non-string input', () => {
      expect(() => ValidationUtils.validatePasswordId(123 as any)).toThrow(ValidationError);
      expect(() => ValidationUtils.validatePasswordId(null as any)).toThrow(ValidationError);
    });

    test('throws error for empty string', () => {
      expect(() => ValidationUtils.validatePasswordId('')).toThrow(ValidationError);
      expect(() => ValidationUtils.validatePasswordId('')).toThrow('cannot be empty');
    });

    test('throws error for invalid UUID format', () => {
      expect(() => ValidationUtils.validatePasswordId('invalid-uuid')).toThrow(ValidationError);
      expect(() => ValidationUtils.validatePasswordId('123-456-789')).toThrow(ValidationError);
      expect(() => ValidationUtils.validatePasswordId('123e4567-e89b-12d3-a456-42661417400')).toThrow(ValidationError);
    });

    test('accepts various valid UUID versions', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-22d3-a456-426614174000',
        '123e4567-e89b-32d3-a456-426614174000',
        '123e4567-e89b-42d3-a456-426614174000',
        '123e4567-e89b-52d3-a456-426614174000',
      ];

      validUuids.forEach(uuid => {
        expect(() => ValidationUtils.validatePasswordId(uuid)).not.toThrow();
      });
    });
  });

  describe('validateEmail', () => {
    test('accepts valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(ValidationUtils.validateEmail(email)).toBe(true);
      });
    });

    test('rejects invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user.domain.com',
        '',
      ];

      invalidEmails.forEach(email => {
        expect(ValidationUtils.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('isValidFilename', () => {
    test('accepts valid filenames', () => {
      const validFilenames = [
        'test.txt',
        'password-backup.json',
        'backup_2023.csv',
        'file123.dat',
      ];

      validFilenames.forEach(filename => {
        expect(ValidationUtils.isValidFilename(filename)).toBe(true);
      });
    });

    test('rejects invalid filenames', () => {
      const invalidFilenames = [
        '',
        'file/with/slashes.txt',
        'file with spaces.txt',
        'file*with*asterisk.txt',
        'file<with>brackets.txt',
        'a'.repeat(256), // Too long
      ];

      invalidFilenames.forEach(filename => {
        expect(ValidationUtils.isValidFilename(filename)).toBe(false);
      });
    });
  });

  describe('validateJSON', () => {
    test('parses valid JSON', () => {
      const validJson = '{"test": "value", "number": 123}';
      const result = ValidationUtils.validateJSON(validJson);
      expect(result).toEqual({ test: 'value', number: 123 });
    });

    test('throws error for invalid JSON', () => {
      const invalidJson = '{"test": invalid}';
      expect(() => ValidationUtils.validateJSON(invalidJson)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateJSON(invalidJson)).toThrow('Invalid JSON format');
    });

    test('handles empty object', () => {
      const result = ValidationUtils.validateJSON('{}');
      expect(result).toEqual({});
    });

    test('handles arrays', () => {
      const result = ValidationUtils.validateJSON('[1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('checkRateLimit', () => {
    test('allows action when no previous action', () => {
      expect(() => ValidationUtils.checkRateLimit(null, 1000)).not.toThrow();
    });

    test('allows action when enough time has passed', () => {
      const pastDate = new Date(Date.now() - 2000);
      expect(() => ValidationUtils.checkRateLimit(pastDate, 1000)).not.toThrow();
    });

    test('throws error when rate limit exceeded', () => {
      const recentDate = new Date(Date.now() - 500);
      expect(() => ValidationUtils.checkRateLimit(recentDate, 1000)).toThrow(ValidationError);
      expect(() => ValidationUtils.checkRateLimit(recentDate, 1000)).toThrow('Please wait');
    });
  });

  describe('validateSearchQuery', () => {
    test('accepts valid search query', () => {
      const result = ValidationUtils.validateSearchQuery('test search');
      expect(result).toBe('test search');
    });

    test('trims whitespace', () => {
      const result = ValidationUtils.validateSearchQuery('  test  ');
      expect(result).toBe('test');
    });

    test('removes dangerous characters', () => {
      const result = ValidationUtils.validateSearchQuery('test<script>search');
      expect(result).toBe('testscriptsearch');
    });

    test('throws error for non-string input', () => {
      expect(() => ValidationUtils.validateSearchQuery(123 as any)).toThrow(ValidationError);
    });

    test('throws error for query too long', () => {
      const longQuery = 'a'.repeat(101);
      expect(() => ValidationUtils.validateSearchQuery(longQuery)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateSearchQuery(longQuery)).toThrow('cannot exceed 100 characters');
    });

    test('handles empty query', () => {
      const result = ValidationUtils.validateSearchQuery('');
      expect(result).toBe('');
    });
  });
});