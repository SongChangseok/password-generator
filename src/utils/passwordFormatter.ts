/**
 * Password formatting utilities for enhanced readability
 */

/**
 * Format password with 4-character groups for better readability
 * Example: "MyP@ssw0rd123!" becomes "MyP@ ssw0 rd12 3!"
 * 
 * @param password The password to format
 * @param separator The separator character (default: space)
 * @returns Formatted password string
 */
export const formatPasswordReadable = (
  password: string,
  separator: string = ' '
): string => {
  if (!password) return '';
  
  // Split password into 4-character chunks
  const chunks: string[] = [];
  for (let i = 0; i < password.length; i += 4) {
    chunks.push(password.slice(i, i + 4));
  }
  
  return chunks.join(separator);
};

/**
 * Remove formatting from a readable password to get original
 * Example: "MyP@ ssw0 rd12 3!" becomes "MyP@ssw0rd123!"
 * 
 * @param formattedPassword The formatted password
 * @param separator The separator that was used (default: space)
 * @returns Original password string
 */
export const unformatPassword = (
  formattedPassword: string,
  separator: string = ' '
): string => {
  if (!formattedPassword) return '';
  
  return formattedPassword.split(separator).join('');
};

/**
 * Check if a password should be displayed in readable format
 * Based on length and user preference
 * 
 * @param password The password to check
 * @param userPreference User's readable format preference
 * @param minLength Minimum length to apply formatting (default: 12)
 * @returns Whether to use readable format
 */
export const shouldUseReadableFormat = (
  password: string,
  userPreference: boolean,
  minLength: number = 12
): boolean => {
  return userPreference && password.length >= minLength;
};

/**
 * Get display version of password based on options
 * 
 * @param password Original password
 * @param useReadableFormat Whether to use readable format
 * @param separator Separator character
 * @returns Display-ready password string
 */
export const getPasswordDisplayText = (
  password: string,
  useReadableFormat: boolean = false,
  separator: string = ' '
): string => {
  if (!password) return '';
  
  if (shouldUseReadableFormat(password, useReadableFormat)) {
    return formatPasswordReadable(password, separator);
  }
  
  return password;
};

/**
 * Calculate display width adjustment for formatted passwords
 * Helps with UI layout when password formatting adds separators
 * 
 * @param password Original password
 * @param useReadableFormat Whether formatting is applied
 * @returns Number of extra characters added by formatting
 */
export const getFormattingWidthDelta = (
  password: string,
  useReadableFormat: boolean = false
): number => {
  if (!password || !useReadableFormat || password.length < 12) {
    return 0;
  }
  
  // Calculate number of separators that will be added
  const numGroups = Math.ceil(password.length / 4);
  const numSeparators = numGroups - 1;
  
  return numSeparators;
};