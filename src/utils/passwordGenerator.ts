import { GeneratorOptions, ValidationError } from '../types';
import { CHARACTER_SETS, SIMILAR_CHARACTERS, PASSWORD_CONSTRAINTS } from '../constants';

export class PasswordGenerator {
  /**
   * Generate a cryptographically secure password based on the provided options
   */
  public static generate(options: GeneratorOptions): string {
    this.validateOptions(options);

    const charset = this.buildCharacterSet(options);
    if (charset.length === 0) {
      throw new ValidationError('At least one character type must be selected');
    }

    let password = '';
    let attempts = 0;
    const maxAttempts = 1000;

    do {
      password = this.generatePassword(charset, options);
      attempts++;
      
      if (attempts > maxAttempts) {
        throw new ValidationError('Unable to generate password meeting requirements');
      }
    } while (!this.meetsRequirements(password, options));

    return password;
  }

  /**
   * Validate generator options
   */
  private static validateOptions(options: GeneratorOptions): void {
    if (options.length < PASSWORD_CONSTRAINTS.MIN_LENGTH || 
        options.length > PASSWORD_CONSTRAINTS.MAX_LENGTH) {
      throw new ValidationError(
        `Password length must be between ${PASSWORD_CONSTRAINTS.MIN_LENGTH} and ${PASSWORD_CONSTRAINTS.MAX_LENGTH}`
      );
    }

    if (!options.includeUppercase && !options.includeLowercase && 
        !options.includeNumbers && !options.includeSymbols) {
      throw new ValidationError('At least one character type must be selected');
    }
  }

  /**
   * Build the character set based on options
   */
  private static buildCharacterSet(options: GeneratorOptions): string {
    let charset = '';

    if (options.includeUppercase) {
      charset += CHARACTER_SETS.UPPERCASE;
    }
    if (options.includeLowercase) {
      charset += CHARACTER_SETS.LOWERCASE;
    }
    if (options.includeNumbers) {
      charset += CHARACTER_SETS.NUMBERS;
    }
    if (options.includeSymbols) {
      charset += CHARACTER_SETS.SYMBOLS;
    }

    // Remove similar characters if requested
    if (options.excludeSimilar) {
      charset = this.removeSimilarCharacters(charset);
    }

    return charset;
  }

  /**
   * Remove similar/ambiguous characters from charset
   */
  private static removeSimilarCharacters(charset: string): string {
    let filtered = '';
    for (let i = 0; i < charset.length; i++) {
      if (!SIMILAR_CHARACTERS.includes(charset[i])) {
        filtered += charset[i];
      }
    }
    return filtered;
  }

  /**
   * Generate password using cryptographically secure random number generation
   */
  private static generatePassword(charset: string, options: GeneratorOptions): string {
    let password = '';
    const array = new Uint32Array(options.length);
    
    // Use crypto.getRandomValues for cryptographically secure random numbers
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto.getRandomValues
      for (let i = 0; i < options.length; i++) {
        array[i] = Math.floor(Math.random() * 4294967296);
      }
    }

    for (let i = 0; i < options.length; i++) {
      const randomIndex = array[i] % charset.length;
      const char = charset[randomIndex];

      // Check for consecutive character prevention
      if (options.preventRepeating && i > 0 && char === password[i - 1]) {
        // Try next character in charset to avoid repetition
        const nextIndex = (randomIndex + 1) % charset.length;
        password += charset[nextIndex];
      } else {
        password += char;
      }
    }

    return password;
  }

  /**
   * Check if password meets all requirements (includes at least one character from each selected type)
   */
  private static meetsRequirements(password: string, options: GeneratorOptions): boolean {
    const checks = [];

    if (options.includeUppercase) {
      checks.push(/[A-Z]/.test(password));
    }
    if (options.includeLowercase) {
      checks.push(/[a-z]/.test(password));
    }
    if (options.includeNumbers) {
      checks.push(/[0-9]/.test(password));
    }
    if (options.includeSymbols) {
      const symbolRegex = new RegExp(`[${CHARACTER_SETS.SYMBOLS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
      checks.push(symbolRegex.test(password));
    }

    return checks.every(check => check);
  }

  /**
   * Generate readable password format (grouped by 4 characters)
   */
  public static formatReadable(password: string): string {
    return password.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * Generate multiple passwords at once
   */
  public static generateMultiple(options: GeneratorOptions, count: number): string[] {
    if (count <= 0 || count > 100) {
      throw new ValidationError('Count must be between 1 and 100');
    }

    const passwords: string[] = [];
    for (let i = 0; i < count; i++) {
      passwords.push(this.generate(options));
    }

    return passwords;
  }
}