import {
  calculatePasswordStrength,
  getStrengthColor,
  getStrengthDescription,
} from '../strengthCalculator';

describe('strengthCalculator', () => {
  describe('calculatePasswordStrength', () => {
    it('should identify very weak passwords', () => {
      const weakPasswords = ['123', 'password', 'aaaaaaa', '1111111', 'qwerty'];

      weakPasswords.forEach((password) => {
        const strength = calculatePasswordStrength(password);
        expect(strength.score).toBeLessThanOrEqual(1);
        expect(['very-weak', 'weak']).toContain(strength.label);
        expect(strength.feedback.length).toBeGreaterThan(0);
      });
    });

    it('should identify weak passwords', () => {
      const weakPasswords = ['password1', 'abcdefgh', '12345678', 'qwertyui'];

      weakPasswords.forEach((password) => {
        const strength = calculatePasswordStrength(password);
        expect(strength.score).toBeLessThanOrEqual(2);
        expect(['very-weak', 'weak', 'fair']).toContain(strength.label);
      });
    });

    it('should identify strong passwords', () => {
      const strongPasswords = [
        'MyStr0ng!P@ssw0rd',
        'C0mpl3x&S3cur3!P4ss',
        'Rand0m$tr1ng#2024',
        'Ungu3ss@bl3*P4ssw0rd!',
      ];

      strongPasswords.forEach((password) => {
        const strength = calculatePasswordStrength(password);
        expect(strength.score).toBeGreaterThanOrEqual(3);
        expect(['good', 'strong']).toContain(strength.label);
      });
    });

    it('should penalize common passwords', () => {
      const commonPassword = 'password';
      const strength = calculatePasswordStrength(commonPassword);
      expect(strength.feedback).toContain('Avoid common passwords');
    });

    it('should penalize simple patterns', () => {
      const patternPasswords = ['aaaaaaaa', 'abababab', '12121212'];

      patternPasswords.forEach((password) => {
        const strength = calculatePasswordStrength(password);
        expect(
          strength.feedback.some(
            (f) => f.includes('pattern') || f.includes('repeated')
          )
        ).toBe(true);
      });
    });

    it('should penalize keyboard patterns', () => {
      const keyboardPasswords = ['qwertyuiop', 'asdfghjkl', '1234567890'];

      keyboardPasswords.forEach((password) => {
        const strength = calculatePasswordStrength(password);
        expect(strength.feedback).toContain('Avoid keyboard patterns');
      });
    });

    it('should reward character variety', () => {
      const variety1 = calculatePasswordStrength('abcdefgh'); // only lowercase
      const variety2 = calculatePasswordStrength('Abcdefgh'); // + uppercase
      const variety3 = calculatePasswordStrength('Abcdef12'); // + numbers
      const variety4 = calculatePasswordStrength('Abcd12!@'); // + symbols

      expect(variety4.score).toBeGreaterThan(variety3.score);
      expect(variety3.score).toBeGreaterThan(variety2.score);
      expect(variety2.score).toBeGreaterThan(variety1.score);
    });

    it('should reward longer passwords', () => {
      const short = calculatePasswordStrength('Abc123!@');
      const medium = calculatePasswordStrength('Abc123!@Def456');
      const long = calculatePasswordStrength('Abc123!@Def456$%Ghi789');

      expect(long.score).toBeGreaterThanOrEqual(medium.score);
      expect(medium.score).toBeGreaterThanOrEqual(short.score);
    });

    it('should provide appropriate feedback', () => {
      const shortPassword = calculatePasswordStrength('Ab1!');
      expect(shortPassword.feedback).toContain('Use at least 8 characters');

      const noVariety = calculatePasswordStrength('abcdefgh');
      expect(
        noVariety.feedback.some(
          (f) =>
            f.includes('mix') ||
            f.includes('variety') ||
            f.includes('uppercase') ||
            f.includes('symbols')
        )
      ).toBe(true);
    });

    it('should return scores within valid range', () => {
      const testPasswords = [
        'a',
        'password',
        'Password1',
        'MyStr0ng!P@ssw0rd',
        'Extr3m3ly&C0mpl3x*P4ssw0rd!2024',
      ];

      testPasswords.forEach((password) => {
        const strength = calculatePasswordStrength(password);
        expect(strength.score).toBeGreaterThanOrEqual(0);
        expect(strength.score).toBeLessThanOrEqual(4);
      });
    });

    it('should handle empty password', () => {
      const strength = calculatePasswordStrength('');
      expect(strength.score).toBe(0);
      expect(strength.label).toBe('very-weak');
    });

    it('should detect repeated sequences', () => {
      const repeatedSequences = ['abcabc', '123123', 'abab', 'xyxyxy'];

      repeatedSequences.forEach((password) => {
        const strength = calculatePasswordStrength(password);
        expect(
          strength.feedback.some(
            (f) => f.includes('repeated') || f.includes('sequence')
          )
        ).toBe(true);
      });
    });
  });

  describe('getStrengthColor', () => {
    it('should return correct colors for each strength level', () => {
      expect(
        getStrengthColor({ score: 0, label: 'very-weak', feedback: [] })
      ).toBe('#FF4444');
      expect(getStrengthColor({ score: 1, label: 'weak', feedback: [] })).toBe(
        '#FF8800'
      );
      expect(getStrengthColor({ score: 2, label: 'fair', feedback: [] })).toBe(
        '#FFBB00'
      );
      expect(getStrengthColor({ score: 3, label: 'good', feedback: [] })).toBe(
        '#88CC00'
      );
      expect(
        getStrengthColor({ score: 4, label: 'strong', feedback: [] })
      ).toBe('#00AA00');
    });
  });

  describe('getStrengthDescription', () => {
    it('should return correct descriptions for each strength level', () => {
      expect(
        getStrengthDescription({ score: 0, label: 'very-weak', feedback: [] })
      ).toBe('Very Weak');
      expect(
        getStrengthDescription({ score: 1, label: 'weak', feedback: [] })
      ).toBe('Weak');
      expect(
        getStrengthDescription({ score: 2, label: 'fair', feedback: [] })
      ).toBe('Fair');
      expect(
        getStrengthDescription({ score: 3, label: 'good', feedback: [] })
      ).toBe('Good');
      expect(
        getStrengthDescription({ score: 4, label: 'strong', feedback: [] })
      ).toBe('Strong');
    });
  });
});
