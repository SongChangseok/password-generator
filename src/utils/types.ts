export interface GeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  preventRepeating: boolean;
  readableFormat: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4 (0: very weak, 1: weak, 2: fair, 3: good, 4: strong)
  label: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  entropy?: number; // Optional entropy calculation
}

export interface GeneratedPassword {
  password: string;
  strength: PasswordStrength;
  entropy: number;
  generatedAt: Date;
  metadata?: {
    generationTime: number;
    entropy: number;
  };
}

// === Phase 3 - v1.2 Password Storage Types ===

// Saved password data model
export interface SavedPassword {
  id: string;
  password: string;
  siteName: string;
  accountName?: string;
  memo?: string;
  strength: PasswordStrength;
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

// Password storage operations interface
export interface PasswordStorage {
  save: (password: SavedPassword) => Promise<void>;
  getAll: () => Promise<SavedPassword[]>;
  getById: (id: string) => Promise<SavedPassword | null>;
  update: (id: string, updates: Partial<SavedPassword>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  getCount: () => Promise<number>;
}

// Password list sorting options
export enum SortOrder {
  NEWEST_FIRST = 'newest_first',
  OLDEST_FIRST = 'oldest_first',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  STRENGTH_DESC = 'strength_desc',
  MOST_USED = 'most_used',
}

// Search and filter options
export interface SearchOptions {
  query: string;
  sortOrder: SortOrder;
  strengthFilter?: number; // Filter by minimum strength score (0-4)
}

// Save dialog input options
export interface SavePasswordOptions {
  password: string;
  strength: PasswordStrength;
  siteName?: string;
  accountName?: string;
  memo?: string;
}

// Storage limits for free/premium versions
export interface StorageLimit {
  maxPasswords: number;
  currentCount: number;
  isPremium: boolean;
}

// Advanced generation options (v1.2)
export interface AdvancedGeneratorOptions extends GeneratorOptions {
  excludeSimilarChars: boolean; // 0/O, 1/l/I exclusion
  preventConsecutive: boolean;  // Prevent same character repeating
  readableFormat: boolean;      // 4-digit separation display
  template?: PasswordTemplate;  // Preset templates
}

// Password generation templates
export enum PasswordTemplate {
  WEBSITE = 'website',             // General website requirements
  HIGH_SECURITY = 'high_security', // Maximum security settings
  PIN_NUMBER = 'pin_number',       // Numeric PIN 4-8 digits
  SIMPLE = 'simple'                // Simple passwords without symbols
}

// Template configurations
export interface TemplateConfig {
  name: string;
  description: string;
  options: GeneratorOptions;
}
