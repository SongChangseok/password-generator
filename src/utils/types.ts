export interface GeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  preventRepeating: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4 (0: very weak, 1: weak, 2: fair, 3: good, 4: strong)
  label: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
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
