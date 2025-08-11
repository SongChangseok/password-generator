import { StrengthResult } from '../types';
import { STRENGTH_COLORS, STRENGTH_LABELS } from '../constants';

export class PasswordStrengthCalculator {
  private static readonly COMMON_PASSWORDS = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    'letmein', 'welcome', '12345678', 'abc123', 'Password1'
  ];

  private static readonly KEYBOARD_PATTERNS = [
    'qwerty', 'asdf', 'zxcv', '1234', 'abcd'
  ];

  /**
   * Calculate password strength based on NIST guidelines and entropy
   */
  public static calculate(password: string): StrengthResult {
    if (!password || password.length === 0) {
      return this.createResult(0, 0);
    }

    // Check for common passwords
    if (this.isCommonPassword(password)) {
      return this.createResult(0, 0);
    }

    // Calculate base entropy
    const entropy = this.calculateEntropy(password);
    
    // Apply penalties for weak patterns
    const penalties = this.calculatePenalties(password);
    const adjustedEntropy = Math.max(0, entropy - penalties);

    // Apply bonuses for good practices
    const bonuses = this.calculateBonuses(password);
    const finalEntropy = adjustedEntropy + bonuses;

    // Convert entropy to score (0-4)
    const score = this.entropyToScore(finalEntropy);

    return this.createResult(score, finalEntropy);
  }

  /**
   * Calculate base entropy using NIST approach
   */
  private static calculateEntropy(password: string): number {
    if (password.length === 0) return 0;

    const charsetSize = this.getCharsetSize(password);
    
    // NIST SP 800-63B entropy estimation
    // First character: log2(charset)
    // Next 7 characters: log2(charset) * 0.75 each
    // Characters 9-20: log2(charset) * 0.5 each
    // Characters 21+: log2(charset) * 0.25 each
    
    let entropy = 0;
    const baseEntropy = Math.log2(charsetSize);

    for (let i = 0; i < password.length; i++) {
      if (i === 0) {
        entropy += baseEntropy;
      } else if (i < 8) {
        entropy += baseEntropy * 0.75;
      } else if (i < 20) {
        entropy += baseEntropy * 0.5;
      } else {
        entropy += baseEntropy * 0.25;
      }
    }

    return entropy;
  }

  /**
   * Determine character set size for entropy calculation
   */
  private static getCharsetSize(password: string): number {
    let size = 0;
    
    if (/[a-z]/.test(password)) size += 26;
    if (/[A-Z]/.test(password)) size += 26;
    if (/[0-9]/.test(password)) size += 10;
    if (/[^a-zA-Z0-9]/.test(password)) size += 32; // Common special characters

    return size;
  }

  /**
   * Calculate penalties for weak patterns
   */
  private static calculatePenalties(password: string): number {
    let penalties = 0;

    // Penalty for short passwords
    if (password.length < 8) {
      penalties += 10;
    }

    // Penalty for repetitive characters
    const repetitivePenalty = this.calculateRepetitivePenalty(password);
    penalties += repetitivePenalty;

    // Penalty for keyboard patterns
    const keyboardPenalty = this.calculateKeyboardPatternPenalty(password);
    penalties += keyboardPenalty;

    // Penalty for sequential patterns
    const sequentialPenalty = this.calculateSequentialPenalty(password);
    penalties += sequentialPenalty;

    // Penalty for dictionary words
    const dictionaryPenalty = this.calculateDictionaryPenalty(password);
    penalties += dictionaryPenalty;

    return penalties;
  }

  /**
   * Calculate bonuses for good security practices
   */
  private static calculateBonuses(password: string): number {
    let bonuses = 0;

    // Bonus for length
    if (password.length >= 12) bonuses += 2;
    if (password.length >= 16) bonuses += 3;
    if (password.length >= 20) bonuses += 5;

    // Bonus for character diversity
    const charTypes = this.getCharacterTypes(password);
    if (charTypes >= 3) bonuses += 2;
    if (charTypes >= 4) bonuses += 3;

    // Bonus for no repeated characters
    if (!this.hasRepeatedCharacters(password)) {
      bonuses += 2;
    }

    return bonuses;
  }

  /**
   * Calculate penalty for repetitive character patterns
   */
  private static calculateRepetitivePenalty(password: string): number {
    let penalty = 0;
    let consecutiveCount = 1;

    for (let i = 1; i < password.length; i++) {
      if (password[i] === password[i - 1]) {
        consecutiveCount++;
      } else {
        if (consecutiveCount > 1) {
          penalty += consecutiveCount;
        }
        consecutiveCount = 1;
      }
    }

    if (consecutiveCount > 1) {
      penalty += consecutiveCount;
    }

    return penalty;
  }

  /**
   * Calculate penalty for keyboard patterns
   */
  private static calculateKeyboardPatternPenalty(password: string): number {
    let penalty = 0;
    const lowerPassword = password.toLowerCase();

    for (const pattern of this.KEYBOARD_PATTERNS) {
      if (lowerPassword.includes(pattern)) {
        penalty += 5;
      }
    }

    return penalty;
  }

  /**
   * Calculate penalty for sequential patterns (abc, 123, etc.)
   */
  private static calculateSequentialPenalty(password: string): number {
    let penalty = 0;

    for (let i = 0; i < password.length - 2; i++) {
      const char1 = password.charCodeAt(i);
      const char2 = password.charCodeAt(i + 1);
      const char3 = password.charCodeAt(i + 2);

      // Check for ascending sequence
      if (char2 === char1 + 1 && char3 === char2 + 1) {
        penalty += 3;
      }
      
      // Check for descending sequence
      if (char2 === char1 - 1 && char3 === char2 - 1) {
        penalty += 3;
      }
    }

    return penalty;
  }

  /**
   * Calculate penalty for dictionary words
   */
  private static calculateDictionaryPenalty(password: string): number {
    let penalty = 0;
    const lowerPassword = password.toLowerCase();

    for (const word of this.COMMON_PASSWORDS) {
      if (lowerPassword.includes(word.toLowerCase())) {
        penalty += 10; // Reduced penalty to allow some passwords to pass
      }
    }

    return penalty;
  }

  /**
   * Get number of character types used
   */
  private static getCharacterTypes(password: string): number {
    let types = 0;
    
    if (/[a-z]/.test(password)) types++;
    if (/[A-Z]/.test(password)) types++;
    if (/[0-9]/.test(password)) types++;
    if (/[^a-zA-Z0-9]/.test(password)) types++;

    return types;
  }

  /**
   * Check if password has repeated characters
   */
  private static hasRepeatedCharacters(password: string): boolean {
    const seen = new Set();
    
    for (const char of password) {
      if (seen.has(char)) {
        return true;
      }
      seen.add(char);
    }
    
    return false;
  }

  /**
   * Check if password is in common password list
   */
  private static isCommonPassword(password: string): boolean {
    const lowerPassword = password.toLowerCase();
    return this.COMMON_PASSWORDS.some(common => 
      lowerPassword === common.toLowerCase()
    );
  }

  /**
   * Convert entropy to score (0-4)
   */
  private static entropyToScore(entropy: number): number {
    if (entropy < 28) return 0;      // Very Weak
    if (entropy < 36) return 1;      // Weak
    if (entropy < 50) return 2;      // Fair
    if (entropy < 70) return 3;      // Strong
    return 4;                        // Very Strong
  }

  /**
   * Create strength result object
   */
  private static createResult(score: number, entropy: number): StrengthResult {
    const colors = [
      STRENGTH_COLORS.VERY_WEAK,
      STRENGTH_COLORS.WEAK,
      STRENGTH_COLORS.FAIR,
      STRENGTH_COLORS.STRONG,
      STRENGTH_COLORS.VERY_STRONG,
    ];

    return {
      score,
      label: STRENGTH_LABELS[score as keyof typeof STRENGTH_LABELS],
      color: colors[score],
      entropy: Math.round(entropy * 10) / 10, // Round to 1 decimal place
    };
  }

  /**
   * Get password improvement suggestions
   */
  public static getSuggestions(password: string): string[] {
    const suggestions: string[] = [];

    if (password.length < 8) {
      suggestions.push('Use at least 8 characters');
    }

    if (password.length < 12) {
      suggestions.push('Consider using 12+ characters for better security');
    }

    const charTypes = this.getCharacterTypes(password);
    if (charTypes < 3) {
      suggestions.push('Include uppercase, lowercase, numbers, and symbols');
    }

    if (this.hasRepeatedCharacters(password)) {
      suggestions.push('Avoid repeated characters');
    }

    if (this.isCommonPassword(password)) {
      suggestions.push('Avoid common passwords and dictionary words');
    }

    return suggestions;
  }
}