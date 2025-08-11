export type RootStackParamList = {
  Generator: undefined;
  PasswordList: undefined;
  PasswordDetail: { passwordId: string };
  Settings: undefined;
};

export interface GeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  preventRepeating: boolean;
}

export interface StrengthResult {
  score: number; // 0-4
  label: string; // "Very Weak", "Weak", "Fair", "Strong", "Very Strong"
  color: string;
  entropy: number;
}

export interface SavedPassword {
  id: string;
  password: string;
  siteName: string;
  accountName?: string;
  memo?: string;
  strength: StrengthResult;
  createdAt: Date;
  lastUsed?: Date;
}

export interface CharacterSet {
  name: string;
  characters: string;
  enabled: boolean;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}