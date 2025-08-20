import { GeneratorOptions, PasswordTemplate, TemplateConfig } from './types';

/**
 * Password Generation Templates - v1.2
 *
 * Provides preset configurations for common use cases
 */

/**
 * Website Password Template
 * Balanced security for most websites
 */
export const WEBSITE_TEMPLATE: TemplateConfig = {
  name: 'Website',
  description: 'Balanced security for most websites and services',
  options: {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
    preventRepeating: false,
    readableFormat: false,
  },
};

/**
 * High Security Template
 * Maximum security for critical accounts
 */
export const HIGH_SECURITY_TEMPLATE: TemplateConfig = {
  name: 'High Security',
  description: 'Maximum security for banking and critical accounts',
  options: {
    length: 24,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
    preventRepeating: true,
    readableFormat: true,
  },
};

/**
 * PIN Number Template
 * Numeric PIN for devices and simple access
 */
export const PIN_TEMPLATE: TemplateConfig = {
  name: 'PIN Number',
  description: '4-8 digit PIN for devices and simple access',
  options: {
    length: 6,
    includeUppercase: false,
    includeLowercase: false,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: false,
    preventRepeating: true,
    readableFormat: false,
  },
};

/**
 * Simple Password Template
 * Easy to type for devices with limited keyboards
 */
export const SIMPLE_TEMPLATE: TemplateConfig = {
  name: 'Simple',
  description: 'Easy to type, no special characters',
  options: {
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: true,
    preventRepeating: false,
    readableFormat: true,
  },
};

/**
 * All available password templates
 */
export const PASSWORD_TEMPLATES: TemplateConfig[] = [
  WEBSITE_TEMPLATE,
  HIGH_SECURITY_TEMPLATE,
  PIN_TEMPLATE,
  SIMPLE_TEMPLATE,
];

/**
 * Get template configuration by type
 * @param template Template type
 * @returns Template configuration
 */
export const getTemplateConfig = (
  template: PasswordTemplate
): TemplateConfig | null => {
  switch (template) {
    case PasswordTemplate.WEBSITE:
      return WEBSITE_TEMPLATE;
    case PasswordTemplate.HIGH_SECURITY:
      return HIGH_SECURITY_TEMPLATE;
    case PasswordTemplate.PIN_NUMBER:
      return PIN_TEMPLATE;
    case PasswordTemplate.SIMPLE:
      return SIMPLE_TEMPLATE;
    default:
      return null;
  }
};

/**
 * Apply template to generator options
 * @param template Template type
 * @returns Generator options based on template
 */
export const applyTemplate = (template: PasswordTemplate): GeneratorOptions => {
  const config = getTemplateConfig(template);
  if (!config) {
    throw new Error(`Template ${template} not found`);
  }

  return { ...config.options };
};

/**
 * Get template by name (for UI selection)
 * @param name Template name
 * @returns Template configuration or null
 */
export const getTemplateByName = (name: string): TemplateConfig | null => {
  return (
    PASSWORD_TEMPLATES.find(
      (template) => template.name.toLowerCase() === name.toLowerCase()
    ) || null
  );
};

/**
 * Check if current options match a template
 * @param options Current generator options
 * @returns Matching template or null
 */
export const detectCurrentTemplate = (
  options: GeneratorOptions
): TemplateConfig | null => {
  for (const template of PASSWORD_TEMPLATES) {
    const templateOptions = template.options;

    // Check if all options match
    const matches =
      templateOptions.length === options.length &&
      templateOptions.includeUppercase === options.includeUppercase &&
      templateOptions.includeLowercase === options.includeLowercase &&
      templateOptions.includeNumbers === options.includeNumbers &&
      templateOptions.includeSymbols === options.includeSymbols &&
      templateOptions.excludeSimilar === options.excludeSimilar &&
      templateOptions.preventRepeating === options.preventRepeating &&
      templateOptions.readableFormat === options.readableFormat;

    if (matches) {
      return template;
    }
  }

  return null;
};

/**
 * Get template recommendations based on context
 * @param context Usage context (e.g., 'banking', 'social', 'device')
 * @returns Recommended templates
 */
export const getRecommendedTemplates = (context?: string): TemplateConfig[] => {
  if (!context) {
    return PASSWORD_TEMPLATES;
  }

  const recommendations: TemplateConfig[] = [];

  switch (context.toLowerCase()) {
    case 'banking':
    case 'financial':
    case 'crypto':
      recommendations.push(HIGH_SECURITY_TEMPLATE, WEBSITE_TEMPLATE);
      break;

    case 'social':
    case 'email':
    case 'shopping':
      recommendations.push(WEBSITE_TEMPLATE, SIMPLE_TEMPLATE);
      break;

    case 'device':
    case 'phone':
    case 'tablet':
      recommendations.push(PIN_TEMPLATE, SIMPLE_TEMPLATE);
      break;

    default:
      return PASSWORD_TEMPLATES;
  }

  return recommendations;
};

/**
 * Get template statistics
 * @param template Template configuration
 * @returns Template security metrics
 */
export const getTemplateStats = (template: TemplateConfig) => {
  const options = template.options;
  let characterSetSize = 0;

  if (options.includeUppercase)
    characterSetSize += options.excludeSimilar ? 24 : 26;
  if (options.includeLowercase)
    characterSetSize += options.excludeSimilar ? 25 : 26;
  if (options.includeNumbers)
    characterSetSize += options.excludeSimilar ? 8 : 10;
  if (options.includeSymbols)
    characterSetSize += options.excludeSimilar ? 28 : 29;

  const entropy = Math.log2(Math.pow(characterSetSize, options.length));

  let securityLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  if (entropy < 40) securityLevel = 'Low';
  else if (entropy < 60) securityLevel = 'Medium';
  else if (entropy < 80) securityLevel = 'High';
  else securityLevel = 'Very High';

  return {
    characterSetSize,
    entropy: Math.round(entropy),
    securityLevel,
    estimatedCrackTime: calculateCrackTime(entropy),
  };
};

/**
 * Calculate estimated crack time based on entropy
 * @param entropy Password entropy in bits
 * @returns Human readable crack time estimate
 */
const calculateCrackTime = (entropy: number): string => {
  // Assuming 1 billion guesses per second
  const guessesPerSecond = 1e9;
  const totalCombinations = Math.pow(2, entropy);
  const avgCombinations = totalCombinations / 2; // Average case
  const seconds = avgCombinations / guessesPerSecond;

  if (seconds < 60) return 'Less than 1 minute';
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`;
  return 'Centuries';
};
