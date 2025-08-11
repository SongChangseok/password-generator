import { GeneratorOptions, CharacterSet } from '../types/password';

export class PasswordGenerator {
  private static readonly CHARACTER_SETS: CharacterSet = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    similarChars: ['0', 'O', '1', 'l', 'I', 'i']
  };

  /**
   * Generates a cryptographically secure password based on the provided options
   * @param options Password generation options
   * @returns Generated password string
   */
  public static generate(options: GeneratorOptions): string {
    this.validateOptions(options);
    
    const characterPool = this.buildCharacterPool(options);
    if (characterPool.length === 0) {
      throw new Error('No character types selected for password generation');
    }

    let password = '';
    const requiredChars = this.getRequiredCharacters(options);
    
    // Ensure at least one character from each selected type is included
    for (const char of requiredChars) {
      password += char;
    }

    // Fill the remaining length with random characters
    const remainingLength = options.length - password.length;
    for (let i = 0; i < remainingLength; i++) {
      let nextChar: string;
      let attempts = 0;
      const maxAttempts = 50;

      do {
        nextChar = this.getSecureRandomChar(characterPool);
        attempts++;
        
        if (attempts > maxAttempts) {
          // Fallback: use the character even if it violates constraints
          break;
        }
      } while (this.violatesConstraints(password, nextChar, options));

      password += nextChar;
    }

    // Shuffle the password to randomize the position of required characters
    password = this.shuffleString(password);

    // Apply readable format if requested
    if (options.readableFormat) {
      password = this.formatReadable(password);
    }

    return password;
  }

  /**
   * Validates the generator options
   */
  private static validateOptions(options: GeneratorOptions): void {
    if (options.length < 4 || options.length > 128) {
      throw new Error('Password length must be between 4 and 128 characters');
    }

    if (!options.includeUppercase && !options.includeLowercase && 
        !options.includeNumbers && !options.includeSpecialChars) {
      throw new Error('At least one character type must be selected');
    }
  }

  /**
   * Builds the character pool based on selected options
   */
  private static buildCharacterPool(options: GeneratorOptions): string {
    let pool = '';

    if (options.includeUppercase) {
      pool += this.CHARACTER_SETS.uppercase;
    }
    if (options.includeLowercase) {
      pool += this.CHARACTER_SETS.lowercase;
    }
    if (options.includeNumbers) {
      pool += this.CHARACTER_SETS.numbers;
    }
    if (options.includeSpecialChars) {
      pool += this.CHARACTER_SETS.specialChars;
    }

    // Remove similar characters if requested
    if (options.excludeSimilarChars) {
      for (const similarChar of this.CHARACTER_SETS.similarChars) {
        pool = pool.replace(new RegExp(similarChar, 'g'), '');
      }
    }

    return pool;
  }

  /**
   * Gets at least one character from each required character type
   */
  private static getRequiredCharacters(options: GeneratorOptions): string[] {
    const required: string[] = [];

    if (options.includeUppercase) {
      let chars = this.CHARACTER_SETS.uppercase;
      if (options.excludeSimilarChars) {
        chars = this.removeSimilarChars(chars);
      }
      required.push(this.getSecureRandomChar(chars));
    }

    if (options.includeLowercase) {
      let chars = this.CHARACTER_SETS.lowercase;
      if (options.excludeSimilarChars) {
        chars = this.removeSimilarChars(chars);
      }
      required.push(this.getSecureRandomChar(chars));
    }

    if (options.includeNumbers) {
      let chars = this.CHARACTER_SETS.numbers;
      if (options.excludeSimilarChars) {
        chars = this.removeSimilarChars(chars);
      }
      required.push(this.getSecureRandomChar(chars));
    }

    if (options.includeSpecialChars) {
      required.push(this.getSecureRandomChar(this.CHARACTER_SETS.specialChars));
    }

    return required;
  }

  /**
   * Removes similar characters from a character set
   */
  private static removeSimilarChars(chars: string): string {
    let result = chars;
    for (const similarChar of this.CHARACTER_SETS.similarChars) {
      result = result.replace(new RegExp(similarChar, 'g'), '');
    }
    return result;
  }

  /**
   * Checks if adding a character would violate constraints
   */
  private static violatesConstraints(
    currentPassword: string,
    nextChar: string,
    options: GeneratorOptions
  ): boolean {
    if (options.preventConsecutiveChars && currentPassword.length > 0) {
      const lastChar = currentPassword[currentPassword.length - 1];
      if (lastChar === nextChar) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generates a cryptographically secure random character from the given pool
   * Uses crypto.getRandomValues() for secure random number generation
   */
  private static getSecureRandomChar(characterPool: string): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      const randomIndex = randomArray[0] % characterPool.length;
      return characterPool[randomIndex];
    } else {
      // Fallback for environments without crypto.getRandomValues
      console.warn('crypto.getRandomValues not available, falling back to Math.random()');
      const randomIndex = Math.floor(Math.random() * characterPool.length);
      return characterPool[randomIndex];
    }
  }

  /**
   * Shuffles a string using the Fisher-Yates algorithm with secure random numbers
   */
  private static shuffleString(str: string): string {
    const arr = str.split('');
    
    for (let i = arr.length - 1; i > 0; i--) {
      let randomIndex: number;
      
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        randomIndex = randomArray[0] % (i + 1);
      } else {
        randomIndex = Math.floor(Math.random() * (i + 1));
      }
      
      [arr[i], arr[randomIndex]] = [arr[randomIndex], arr[i]];
    }
    
    return arr.join('');
  }

  /**
   * Formats password in readable format (groups of 4 characters)
   */
  private static formatReadable(password: string): string {
    return password.match(/.{1,4}/g)?.join('-') || password;
  }

  /**
   * Gets the character pool size for entropy calculation
   */
  public static getCharacterPoolSize(options: GeneratorOptions): number {
    return this.buildCharacterPool(options).length;
  }
}