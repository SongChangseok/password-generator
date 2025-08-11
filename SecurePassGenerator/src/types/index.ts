export type RootStackParamList = {
  Generator: undefined;
  PasswordList: undefined;
  PasswordDetail: { passwordId: string };
  Settings: undefined;
};

export interface PasswordSettings {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSpecialChars: boolean;
  excludeSimilar: boolean;
  excludeConsecutive: boolean;
}

export interface SavedPassword {
  id: string;
  password: string;
  siteName: string;
  accountName?: string;
  memo?: string;
  createdAt: string;
  strength: 'weak' | 'medium' | 'strong';
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';