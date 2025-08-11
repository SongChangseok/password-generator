import { PasswordGenerator } from '../../utils/passwordGenerator';
import { PasswordStrengthCalculator } from '../../utils/strengthCalculator';
import { GeneratorOptions } from '../../types/password';

describe('Performance Tests', () => {
  const defaultOptions: GeneratorOptions = {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSpecialChars: true,
    excludeSimilarChars: false,
    preventConsecutiveChars: false,
    readableFormat: false
  };

  describe('Password Generation Performance', () => {
    it('should generate passwords in less than 1 second', () => {
      const iterations = 1000;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        PasswordGenerator.generate(defaultOptions);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / iterations;
      
      console.log(`Generated ${iterations} passwords in ${totalTime.toFixed(2)}ms`);
      console.log(`Average time per password: ${averageTime.toFixed(2)}ms`);
      
      // Each password generation should be well under 1 second (1000ms)
      expect(averageTime).toBeLessThan(1000);
      
      // For good performance, should be under 10ms per password
      expect(averageTime).toBeLessThan(10);
    });

    it('should handle maximum length passwords efficiently', () => {
      const maxLengthOptions: GeneratorOptions = {
        ...defaultOptions,
        length: 128
      };
      
      const startTime = performance.now();
      const password = PasswordGenerator.generate(maxLengthOptions);
      const endTime = performance.now();
      
      expect(password.length).toBe(128);
      expect(endTime - startTime).toBeLessThan(100); // Should be under 100ms
    });

    it('should handle complex options efficiently', () => {
      const complexOptions: GeneratorOptions = {
        length: 64,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecialChars: true,
        excludeSimilarChars: true,
        preventConsecutiveChars: true,
        readableFormat: true
      };
      
      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        PasswordGenerator.generate(complexOptions);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / iterations;
      
      console.log(`Generated ${iterations} complex passwords in ${totalTime.toFixed(2)}ms`);
      console.log(`Average time per complex password: ${averageTime.toFixed(2)}ms`);
      
      // Even with complex options, should be efficient
      expect(averageTime).toBeLessThan(50);
    });
  });

  describe('Password Strength Calculation Performance', () => {
    it('should calculate strength in less than 100ms', () => {
      const testPasswords = [
        'short',
        'medium-length-password',
        'very-long-password-with-many-characters-and-symbols-!@#$%^&*()',
        'ComplexP@ssw0rd!With$pecial&Numbers123',
        '1234567890',
        'abcdefghijklmnopqrstuvwxyz',
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        '!@#$%^&*()_+-=[]{}|;:,.<>?',
        'MixedCaseWithNumbers123AndSymbols!@#'
      ];
      
      let totalTime = 0;
      let calculationCount = 0;
      
      for (const password of testPasswords) {
        const iterations = 100;
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
          PasswordStrengthCalculator.calculate(password);
          calculationCount++;
        }
        
        const endTime = performance.now();
        totalTime += (endTime - startTime);
      }
      
      const averageTime = totalTime / calculationCount;
      
      console.log(`Calculated strength for ${calculationCount} passwords in ${totalTime.toFixed(2)}ms`);
      console.log(`Average time per strength calculation: ${averageTime.toFixed(2)}ms`);
      
      // Each strength calculation should be well under 100ms
      expect(averageTime).toBeLessThan(100);
      
      // For good performance, should be under 1ms per calculation
      expect(averageTime).toBeLessThan(1);
    });

    it('should handle very long passwords efficiently', () => {
      const longPassword = 'A'.repeat(128) + '1'.repeat(128) + '!'.repeat(128);
      
      const startTime = performance.now();
      const result = PasswordStrengthCalculator.calculate(longPassword);
      const endTime = performance.now();
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(endTime - startTime).toBeLessThan(100); // Should be under 100ms
    });

    it('should handle bulk strength calculations efficiently', () => {
      const passwords: string[] = [];
      
      // Generate test passwords
      for (let i = 0; i < 1000; i++) {
        passwords.push(PasswordGenerator.generate({
          length: 8 + (i % 20), // Vary length from 8 to 27
          includeUppercase: true,
          includeLowercase: true,
          includeNumbers: true,
          includeSpecialChars: i % 2 === 0,
          excludeSimilarChars: false,
          preventConsecutiveChars: false,
          readableFormat: false
        }));
      }
      
      const startTime = performance.now();
      
      passwords.forEach(password => {
        PasswordStrengthCalculator.calculate(password);
      });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / passwords.length;
      
      console.log(`Calculated strength for ${passwords.length} passwords in ${totalTime.toFixed(2)}ms`);
      console.log(`Average time per calculation: ${averageTime.toFixed(2)}ms`);
      
      // Bulk processing should still be efficient
      expect(averageTime).toBeLessThan(5);
    });
  });

  describe('Memory Performance', () => {
    it('should not have memory leaks during repeated operations', () => {
      // This is more of a smoke test - in a real environment, you'd use proper memory profiling tools
      const iterations = 10000;
      
      const startMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < iterations; i++) {
        const password = PasswordGenerator.generate(defaultOptions);
        PasswordStrengthCalculator.calculate(password);
        
        // Occasionally force garbage collection if available
        if (i % 1000 === 0 && global.gc) {
          global.gc();
        }
      }
      
      const endMemory = process.memoryUsage().heapUsed;
      const memoryDelta = endMemory - startMemory;
      
      console.log(`Memory usage delta after ${iterations} operations: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory growth should be reasonable (less than 10MB for this test)
      expect(memoryDelta).toBeLessThan(10 * 1024 * 1024); // 10MB
    });
  });

  describe('Concurrent Performance', () => {
    it('should handle concurrent operations efficiently', async () => {
      const concurrentOperations = 100;
      const operationsPerTask = 10;
      
      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrentOperations }, async () => {
        for (let i = 0; i < operationsPerTask; i++) {
          const password = PasswordGenerator.generate(defaultOptions);
          PasswordStrengthCalculator.calculate(password);
        }
      });
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const totalOperations = concurrentOperations * operationsPerTask;
      const averageTime = totalTime / totalOperations;
      
      console.log(`Completed ${totalOperations} concurrent operations in ${totalTime.toFixed(2)}ms`);
      console.log(`Average time per operation: ${averageTime.toFixed(2)}ms`);
      
      // Concurrent operations should still be efficient
      expect(averageTime).toBeLessThan(10);
    });
  });
});