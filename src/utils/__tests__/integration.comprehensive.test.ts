import { generateSecurePassword } from '../passwordGenerator';
import { GeneratorOptions } from '../types';

describe('Comprehensive Integration Tests', () => {
  describe('End-to-End User Workflows', () => {
    it('should complete full password generation workflow', async () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      const startTime = Date.now();
      const result = await generateSecurePassword(options);
      const endTime = Date.now();

      // Performance requirement: ≤ 300ms
      expect(endTime - startTime).toBeLessThanOrEqual(300);

      // Validate result structure
      expect(result).toBeDefined();
      expect(result.password).toHaveLength(16);
      expect(result.strength).toBeDefined();
      expect(result.strength.score).toBeGreaterThanOrEqual(0);
      expect(result.strength.score).toBeLessThanOrEqual(4);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.generationTime).toBeLessThanOrEqual(300);
    });

    it('should handle all character type combinations', async () => {
      const testCases = [
        {
          includeUppercase: true,
          includeLowercase: false,
          includeNumbers: false,
          includeSymbols: false,
        },
        {
          includeUppercase: false,
          includeLowercase: true,
          includeNumbers: false,
          includeSymbols: false,
        },
        {
          includeUppercase: false,
          includeLowercase: false,
          includeNumbers: true,
          includeSymbols: false,
        },
        {
          includeUppercase: false,
          includeLowercase: false,
          includeNumbers: false,
          includeSymbols: true,
        },
        {
          includeUppercase: true,
          includeLowercase: true,
          includeNumbers: true,
          includeSymbols: true,
        },
      ];

      for (const testCase of testCases) {
        const options: GeneratorOptions = {
          length: 12,
          ...testCase,
          excludeSimilar: false,
          preventRepeating: false,
        readableFormat: false,
        };

        const result = await generateSecurePassword(options);
        expect(result.password).toHaveLength(12);
        expect(result.strength.score).toBeGreaterThanOrEqual(0);
      }
    });

    it('should maintain consistency across multiple generations', async () => {
      const options: GeneratorOptions = {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      const passwords: string[] = [];
      const strengths: number[] = [];

      for (let i = 0; i < 10; i++) {
        const result = await generateSecurePassword(options);
        passwords.push(result.password);
        strengths.push(result.strength.score);

        expect(result.password).toHaveLength(20);
        expect(result.metadata?.generationTime).toBeLessThanOrEqual(300);
      }

      // All passwords should be unique
      const uniquePasswords = new Set(passwords);
      expect(uniquePasswords.size).toBe(10);

      // Strength scores should be consistent for similar length/complexity
      const avgStrength = strengths.reduce((a, b) => a + b) / strengths.length;
      expect(avgStrength).toBeGreaterThan(2); // Should be at least "Fair" on average
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle minimum length passwords', async () => {
      const options: GeneratorOptions = {
        length: 8,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      const result = await generateSecurePassword(options);
      expect(result.password).toHaveLength(8);
      expect(result.strength.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle maximum length passwords', async () => {
      const options: GeneratorOptions = {
        length: 32,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      const result = await generateSecurePassword(options);
      expect(result.password).toHaveLength(32);
      expect(result.strength.score).toBe(4); // Should be "Strong"
    });

    it('should handle rapid successive calls without memory leaks', async () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      const startMemory = process.memoryUsage().heapUsed;

      // Generate 100 passwords rapidly
      for (let i = 0; i < 100; i++) {
        const result = await generateSecurePassword(options);
        expect(result.password).toHaveLength(16);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (endMemory - startMemory) / 1024 / 1024; // MB

      // Memory increase should be minimal (< 20MB for 100 generations)
      expect(memoryIncrease).toBeLessThan(20);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet app launch time requirements', async () => {
      // Simulate app initialization by measuring actual password generation
      const startTime = Date.now();

      // Initialize with a password generation call
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      const result = await generateSecurePassword(options);

      const endTime = Date.now();
      const initTime = endTime - startTime;

      // App launch time requirement: ≤ 2.5 seconds (2500ms)
      expect(initTime).toBeLessThanOrEqual(2500);
      expect(result.password).toHaveLength(16);
    });

    it('should generate passwords within performance target', async () => {
      const options: GeneratorOptions = {
        length: 24,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: true,
        preventRepeating: false,
        readableFormat: false,
      };

      const performanceTimes: number[] = [];

      // Test 20 password generations
      for (let i = 0; i < 20; i++) {
        const startTime = Date.now();
        const result = await generateSecurePassword(options);
        const endTime = Date.now();

        const generationTime = endTime - startTime;
        performanceTimes.push(generationTime);

        expect(generationTime).toBeLessThanOrEqual(300);
        expect(result.password).toHaveLength(24);
      }

      // Calculate average performance
      const avgTime =
        performanceTimes.reduce((a, b) => a + b) / performanceTimes.length;
      const maxTime = Math.max(...performanceTimes);

      expect(avgTime).toBeLessThan(100); // Should average well under 100ms
      expect(maxTime).toBeLessThanOrEqual(300); // No single call over 300ms
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work consistently across different environments', async () => {
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      // Test multiple times to ensure consistency
      const results: string[] = [];

      for (let i = 0; i < 5; i++) {
        const result = await generateSecurePassword(options);
        results.push(result.password);

        // Each result should be valid
        expect(result.password).toHaveLength(16);
        expect(result.password).toMatch(
          /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?`~]+$/
        );
        expect(result.strength.score).toBeGreaterThanOrEqual(0);
        expect(result.strength.score).toBeLessThanOrEqual(4);
      }

      // All passwords should be unique (high probability with 16 char passwords)
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThanOrEqual(4); // Allow for rare collision
    });
  });
});
