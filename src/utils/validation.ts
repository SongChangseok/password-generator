import { GeneratorOptions, ValidationError } from '../types';
import { PASSWORD_CONSTRAINTS } from '../constants';

export class ValidationUtils {
  /**
   * Validate generator options
   */
  public static validateGeneratorOptions(options: GeneratorOptions): void {
    // Validate length
    if (!Number.isInteger(options.length)) {
      throw new ValidationError('Password length must be an integer');
    }

    if (options.length < PASSWORD_CONSTRAINTS.MIN_LENGTH) {
      throw new ValidationError(
        `Password length must be at least ${PASSWORD_CONSTRAINTS.MIN_LENGTH} characters`
      );
    }

    if (options.length > PASSWORD_CONSTRAINTS.MAX_LENGTH) {
      throw new ValidationError(
        `Password length cannot exceed ${PASSWORD_CONSTRAINTS.MAX_LENGTH} characters`
      );
    }

    // Validate at least one character type is selected
    const hasCharacterType = options.includeUppercase || 
                            options.includeLowercase || 
                            options.includeNumbers || 
                            options.includeSymbols;

    if (!hasCharacterType) {
      throw new ValidationError('At least one character type must be selected');
    }

    // Validate boolean options
    const booleanFields = [
      'includeUppercase', 'includeLowercase', 'includeNumbers', 
      'includeSymbols', 'excludeSimilar', 'preventRepeating'
    ];

    for (const field of booleanFields) {
      if (typeof options[field as keyof GeneratorOptions] !== 'boolean') {
        throw new ValidationError(`${field} must be a boolean value`);
      }
    }
  }

  /**
   * Sanitize string input to prevent XSS and injection attacks
   */
  public static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Input must be a string');
    }

    // Remove potentially dangerous characters and tags
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/[<>\"'&]/g, '') // Remove HTML/XML special characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate site name for saved passwords
   */
  public static validateSiteName(siteName: string): string {
    const sanitized = this.sanitizeString(siteName);
    
    if (sanitized.length === 0) {
      throw new ValidationError('Site name cannot be empty');
    }

    if (sanitized.length > 100) {
      throw new ValidationError('Site name cannot exceed 100 characters');
    }

    return sanitized;
  }

  /**
   * Validate account name
   */
  public static validateAccountName(accountName?: string): string | undefined {
    if (!accountName) return undefined;

    const sanitized = this.sanitizeString(accountName);
    
    if (sanitized.length > 100) {
      throw new ValidationError('Account name cannot exceed 100 characters');
    }

    return sanitized || undefined;
  }

  /**
   * Validate memo field
   */
  public static validateMemo(memo?: string): string | undefined {
    if (!memo) return undefined;

    const sanitized = this.sanitizeString(memo);
    
    if (sanitized.length > 500) {
      throw new ValidationError('Memo cannot exceed 500 characters');
    }

    return sanitized || undefined;
  }

  /**
   * Validate password ID
   */
  public static validatePasswordId(id: string): void {
    if (typeof id !== 'string') {
      throw new ValidationError('Password ID must be a string');
    }

    if (id.length === 0) {
      throw new ValidationError('Password ID cannot be empty');
    }

    // Check for valid UUID format (simple check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ValidationError('Password ID must be a valid UUID');
    }
  }

  /**
   * Validate export/import data structure
   */
  public static validateExportData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Export data must be an object');
    }

    if (!Array.isArray(data.passwords)) {
      throw new ValidationError('Export data must contain a passwords array');
    }

    if (data.passwords.length > 1000) {
      throw new ValidationError('Cannot export more than 1000 passwords');
    }

    // Validate each password entry
    for (const password of data.passwords) {
      this.validateExportPasswordEntry(password);
    }
  }

  /**
   * Validate individual password entry for export/import
   */
  private static validateExportPasswordEntry(entry: any): void {
    if (!entry || typeof entry !== 'object') {
      throw new ValidationError('Password entry must be an object');
    }

    // Required fields
    if (!entry.id || typeof entry.id !== 'string') {
      throw new ValidationError('Password entry must have a valid ID');
    }

    if (!entry.siteName || typeof entry.siteName !== 'string') {
      throw new ValidationError('Password entry must have a valid site name');
    }

    if (!entry.createdAt || typeof entry.createdAt !== 'string') {
      throw new ValidationError('Password entry must have a valid creation date');
    }

    // Validate optional fields if present
    if (entry.accountName && typeof entry.accountName !== 'string') {
      throw new ValidationError('Account name must be a string');
    }

    if (entry.memo && typeof entry.memo !== 'string') {
      throw new ValidationError('Memo must be a string');
    }
  }

  /**
   * Validate email format (for sharing functionality)
   */
  public static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if input contains only safe characters for filenames
   */
  public static isValidFilename(filename: string): boolean {
    // Allow alphanumeric, dash, underscore, and dot
    const filenameRegex = /^[a-zA-Z0-9._-]+$/;
    return filenameRegex.test(filename) && 
           filename.length > 0 && 
           filename.length <= 255;
  }

  /**
   * Validate JSON string
   */
  public static validateJSON(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new ValidationError('Invalid JSON format');
    }
  }

  /**
   * Rate limit validation - check if action can be performed
   */
  public static checkRateLimit(
    lastAction: Date | null, 
    minInterval: number
  ): void {
    if (!lastAction) return;

    const now = new Date();
    const timeDiff = now.getTime() - lastAction.getTime();
    
    if (timeDiff < minInterval) {
      const waitTime = Math.ceil((minInterval - timeDiff) / 1000);
      throw new ValidationError(`Please wait ${waitTime} seconds before trying again`);
    }
  }

  /**
   * Clean and validate search query
   */
  public static validateSearchQuery(query: string): string {
    if (typeof query !== 'string') {
      throw new ValidationError('Search query must be a string');
    }

    const cleaned = query.trim();
    
    if (cleaned.length > 100) {
      throw new ValidationError('Search query cannot exceed 100 characters');
    }

    // Remove potentially dangerous characters but keep basic search chars
    return cleaned.replace(/[<>\"'&]/g, '');
  }
}