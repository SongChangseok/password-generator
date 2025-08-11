// Password generation and strength calculation types

export interface GeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSpecialChars: boolean;
  excludeSimilarChars: boolean;
  preventConsecutiveChars: boolean;
  readableFormat: boolean;
}

export interface StrengthResult {
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong';
  entropy: number;
  color: string;
  label: string;
  feedback: string[];
}

export interface CharacterSet {
  uppercase: string;
  lowercase: string;
  numbers: string;
  specialChars: string;
  similarChars: string[];
}