import { StrengthResult } from '../types/password';

export class PasswordStrengthCalculator {
  private static readonly COMMON_PATTERNS = [
    /(.)\1{2,}/g, // repeated characters
    /123|234|345|456|567|678|789|890/g, // sequential numbers
    /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/gi, // sequential letters
    /qwerty|asdf|zxcv/gi, // keyboard patterns
    /password|123456|qwerty|admin|login|root|user/gi // common passwords
  ];

  private static readonly COMMON_WORDS = [
    'password', 'admin', 'login', 'user', 'root', 'guest', 'test', 'demo',
    'welcome', 'master', 'secret', 'system', 'computer', 'internet'
  ];

  /**
   * Calculates password strength based on NIST guidelines and security best practices
   * @param password The password to analyze
   * @returns StrengthResult with score, level, and feedback
   */
  public static calculate(password: string): StrengthResult {
    if (!password || password.length === 0) {
      return {
        score: 0,
        level: 'weak',
        entropy: 0,
        color: '#DC2626',
        label: 'Very Weak',
        feedback: ['Password is required']
      };
    }

    const analysis = this.analyzePassword(password);
    const entropy = this.calculateEntropy(password, analysis.characterSetSize);
    const score = this.calculateScore(password, analysis, entropy);
    const level = this.getStrengthLevel(score);
    const feedback = this.generateFeedback(password, analysis, score);

    return {
      score: Math.min(100, Math.max(0, score)),
      level,
      entropy,
      color: this.getColorForLevel(level),
      label: this.getLabelForLevel(level),
      feedback
    };
  }

  /**
   * Analyzes password composition and characteristics
   */
  private static analyzePassword(password: string) {
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);

    const characterTypes = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars]
      .filter(Boolean).length;

    let characterSetSize = 0;
    if (hasLowercase) characterSetSize += 26;
    if (hasUppercase) characterSetSize += 26;
    if (hasNumbers) characterSetSize += 10;
    if (hasSpecialChars) characterSetSize += 32; // Approximate special characters

    return {
      length: password.length,
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSpecialChars,
      characterTypes,
      characterSetSize,
      hasRepeatedChars: this.hasRepeatedCharacters(password),
      hasSequentialChars: this.hasSequentialCharacters(password),
      hasCommonPatterns: this.hasCommonPatterns(password),
      hasCommonWords: this.hasCommonWords(password),
      uniqueCharacters: new Set(password).size
    };
  }

  /**
   * Calculates entropy using Shannon's formula: H = L * log2(N)
   * Where L is length and N is character set size
   */
  private static calculateEntropy(password: string, characterSetSize: number): number {
    if (characterSetSize === 0) return 0;
    return password.length * Math.log2(characterSetSize);
  }

  /**
   * Calculates overall password strength score (0-100)
   * Based on NIST SP 800-63B guidelines and security best practices
   */
  private static calculateScore(
    password: string,
    analysis: ReturnType<typeof this.analyzePassword>,
    entropy: number
  ): number {
    let score = 0;

    // Base score from entropy (0-60 points)
    score += Math.min(60, entropy * 1.5);

    // Length bonus (0-15 points)
    if (analysis.length >= 12) score += 15;
    else if (analysis.length >= 8) score += 10;
    else if (analysis.length >= 6) score += 5;

    // Character type diversity (0-20 points)
    score += analysis.characterTypes * 5;

    // Unique characters bonus (0-5 points)
    const uniquenessRatio = analysis.uniqueCharacters / analysis.length;
    score += uniquenessRatio * 5;

    // Penalties
    if (analysis.hasRepeatedChars) score -= 10;
    if (analysis.hasSequentialChars) score -= 15;
    if (analysis.hasCommonPatterns) score -= 20;
    if (analysis.hasCommonWords) score -= 25;

    // Length penalties
    if (analysis.length < 8) score -= 20;
    if (analysis.length < 6) score -= 30;
    if (analysis.length < 4) score -= 40;

    return score;
  }

  /**
   * Determines strength level based on score
   */
  private static getStrengthLevel(score: number): StrengthResult['level'] {
    if (score >= 80) return 'strong';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'weak';
  }

  /**
   * Gets color for strength level
   */
  private static getColorForLevel(level: StrengthResult['level']): string {
    const colors = {
      weak: '#DC2626', // Red
      fair: '#F59E0B', // Amber
      good: '#10B981', // Emerald
      strong: '#059669' // Green
    };
    return colors[level];
  }

  /**
   * Gets label for strength level
   */
  private static getLabelForLevel(level: StrengthResult['level']): string {
    const labels = {
      weak: 'Weak',
      fair: 'Fair',
      good: 'Good',
      strong: 'Strong'
    };
    return labels[level];
  }

  /**
   * Generates feedback messages for password improvement
   */
  private static generateFeedback(
    password: string,
    analysis: ReturnType<typeof this.analyzePassword>,
    score: number
  ): string[] {
    const feedback: string[] = [];

    if (score >= 80) {
      feedback.push('Excellent! This is a strong password.');
      return feedback;
    }

    if (analysis.length < 8) {
      feedback.push('Use at least 8 characters for better security.');
    }

    if (analysis.length < 12) {
      feedback.push('Consider using 12 or more characters for optimal security.');
    }

    if (analysis.characterTypes < 3) {
      feedback.push('Include a mix of uppercase, lowercase, numbers, and symbols.');
    }

    if (!analysis.hasNumbers) {
      feedback.push('Add numbers to strengthen your password.');
    }

    if (!analysis.hasSpecialChars) {
      feedback.push('Include special characters (!@#$%^&*) for better security.');
    }

    if (analysis.hasRepeatedChars) {
      feedback.push('Avoid repeated characters (like "aaa" or "111").');
    }

    if (analysis.hasSequentialChars) {
      feedback.push('Avoid sequential characters (like "abc" or "123").');
    }

    if (analysis.hasCommonPatterns) {
      feedback.push('Avoid common keyboard patterns and dictionary words.');
    }

    if (analysis.hasCommonWords) {
      feedback.push('Avoid common words that can be found in dictionaries.');
    }

    const uniquenessRatio = analysis.uniqueCharacters / analysis.length;
    if (uniquenessRatio < 0.7) {
      feedback.push('Use more unique characters to increase complexity.');
    }

    if (feedback.length === 0) {
      feedback.push('Consider making your password longer and more complex.');
    }

    return feedback;
  }

  /**
   * Checks for repeated characters
   */
  private static hasRepeatedCharacters(password: string): boolean {
    return /(.)\1{2,}/.test(password);
  }

  /**
   * Checks for sequential characters
   */
  private static hasSequentialCharacters(password: string): boolean {
    const sequences = [
      '0123456789',
      'abcdefghijklmnopqrstuvwxyz',
      'qwertyuiopasdfghjklzxcvbnm'
    ];

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const substr = sequence.substring(i, i + 3);
        if (password.toLowerCase().includes(substr) || 
            password.toLowerCase().includes(substr.split('').reverse().join(''))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Checks for common patterns
   */
  private static hasCommonPatterns(password: string): boolean {
    return this.COMMON_PATTERNS.some(pattern => pattern.test(password));
  }

  /**
   * Checks for common words
   */
  private static hasCommonWords(password: string): boolean {
    const lowerPassword = password.toLowerCase();
    return this.COMMON_WORDS.some(word => lowerPassword.includes(word));
  }

  /**
   * Estimates time to crack password (for educational purposes)
   */
  public static estimateCrackTime(password: string): string {
    const analysis = this.analyzePassword(password);
    const entropy = this.calculateEntropy(password, analysis.characterSetSize);
    
    // Assuming 1 billion guesses per second
    const guessesPerSecond = 1_000_000_000;
    const possibleCombinations = Math.pow(analysis.characterSetSize, analysis.length);
    const averageCrackTime = possibleCombinations / (2 * guessesPerSecond);

    if (averageCrackTime < 1) return 'Instantly';
    if (averageCrackTime < 60) return `${Math.round(averageCrackTime)} seconds`;
    if (averageCrackTime < 3600) return `${Math.round(averageCrackTime / 60)} minutes`;
    if (averageCrackTime < 86400) return `${Math.round(averageCrackTime / 3600)} hours`;
    if (averageCrackTime < 31536000) return `${Math.round(averageCrackTime / 86400)} days`;
    if (averageCrackTime < 31536000000) return `${Math.round(averageCrackTime / 31536000)} years`;
    
    return 'Centuries';
  }
}