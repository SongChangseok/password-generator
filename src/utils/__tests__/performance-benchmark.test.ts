import { generateSecurePassword } from '../passwordGenerator';
import { GeneratorOptions } from '../types';

describe('Performance Benchmarks', () => {
  describe('Generation Speed Tests', () => {
    it('should generate passwords within 300ms requirement consistently', async () => {
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

      const times: number[] = [];
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const result = await generateSecurePassword(options);
        const endTime = performance.now();

        const duration = endTime - startTime;
        times.push(duration);

        expect(result.password).toHaveLength(16);
        expect(duration).toBeLessThanOrEqual(300);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`\nPerformance Results (${iterations} iterations):`);
      console.log(`Average: ${avgTime.toFixed(2)}ms`);
      console.log(`Max: ${maxTime.toFixed(2)}ms`);
      console.log(`Min: ${minTime.toFixed(2)}ms`);
      console.log(`Target: ≤300ms - ${maxTime <= 300 ? '✓ PASS' : '✗ FAIL'}`);

      expect(avgTime).toBeLessThan(100); // Should average well under 100ms
      expect(maxTime).toBeLessThanOrEqual(300); // No single call over 300ms
    });

    it('should meet performance targets for various password lengths', async () => {
      const testCases = [
        { length: 8, expectedMaxTime: 200 },
        { length: 16, expectedMaxTime: 250 },
        { length: 24, expectedMaxTime: 300 },
        { length: 32, expectedMaxTime: 300 },
      ];

      for (const testCase of testCases) {
        const options: GeneratorOptions = {
          length: testCase.length,
          includeUppercase: true,
          includeLowercase: true,
          includeNumbers: true,
          includeSymbols: true,
          excludeSimilar: false,
          preventRepeating: false,
        readableFormat: false,
        };

        const times: number[] = [];

        for (let i = 0; i < 10; i++) {
          const startTime = performance.now();
          const result = await generateSecurePassword(options);
          const endTime = performance.now();

          const duration = endTime - startTime;
          times.push(duration);

          expect(result.password).toHaveLength(testCase.length);
        }

        const avgTime = times.reduce((a, b) => a + b) / times.length;
        const maxTime = Math.max(...times);

        console.log(
          `Length ${testCase.length}: avg=${avgTime.toFixed(1)}ms, max=${maxTime.toFixed(1)}ms`
        );

        expect(maxTime).toBeLessThanOrEqual(testCase.expectedMaxTime);
      }
    });
  });

  describe('Memory Performance Tests', () => {
    it('should maintain stable memory usage during continuous operation', async () => {
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

      const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB

      // Generate 200 passwords
      for (let i = 0; i < 200; i++) {
        const result = await generateSecurePassword(options);
        expect(result.password).toHaveLength(20);

        // Check memory every 50 iterations
        if (i % 50 === 0) {
          const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
          const memoryIncrease = currentMemory - initialMemory;

          // Memory increase should be reasonable (< 50MB)
          expect(memoryIncrease).toBeLessThan(50);
        }
      }

      // Final memory check
      const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const totalIncrease = finalMemory - initialMemory;

      console.log(
        `Memory usage: ${initialMemory.toFixed(1)}MB → ${finalMemory.toFixed(1)}MB`
      );
      console.log(`Memory increase: ${totalIncrease.toFixed(1)}MB`);
      console.log(
        `Target: <80MB - ${totalIncrease < 80 ? '✓ PASS' : '✗ FAIL'}`
      );

      expect(totalIncrease).toBeLessThan(80);
    });

    it('should handle rapid generation bursts efficiently', async () => {
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

      const startTime = performance.now();
      const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

      // Generate 100 passwords rapidly
      const passwords = await Promise.all(
        Array(100)
          .fill(null)
          .map(() => generateSecurePassword(options))
      );

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

      const totalTime = endTime - startTime;
      const memoryIncrease = endMemory - startMemory;
      const avgTimePerPassword = totalTime / 100;

      console.log(`Burst test: 100 passwords in ${totalTime.toFixed(1)}ms`);
      console.log(`Average per password: ${avgTimePerPassword.toFixed(1)}ms`);
      console.log(`Memory increase: ${memoryIncrease.toFixed(1)}MB`);

      expect(passwords).toHaveLength(100);
      expect(avgTimePerPassword).toBeLessThan(50); // Should be very fast in burst
      expect(memoryIncrease).toBeLessThan(20);

      // All passwords should be valid and unique
      const uniquePasswords = new Set(passwords.map((p) => p.password));
      expect(uniquePasswords.size).toBe(100);
    });
  });

  describe('Concurrency Performance Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
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

      const concurrency = 20;
      const requestsPerConcurrency = 5;
      const totalRequests = concurrency * requestsPerConcurrency;

      const startTime = performance.now();
      const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

      // Create multiple concurrent batches
      const batches = Array(concurrency)
        .fill(null)
        .map(() =>
          Promise.all(
            Array(requestsPerConcurrency)
              .fill(null)
              .map(() => generateSecurePassword(options))
          )
        );

      const results = await Promise.all(batches);
      const flatResults = results.flat();

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

      const totalTime = endTime - startTime;
      const memoryIncrease = endMemory - startMemory;
      const avgTimePerRequest = totalTime / totalRequests;

      console.log(
        `Concurrency test: ${totalRequests} requests, ${concurrency} concurrent`
      );
      console.log(`Total time: ${totalTime.toFixed(1)}ms`);
      console.log(`Average per request: ${avgTimePerRequest.toFixed(1)}ms`);
      console.log(`Memory increase: ${memoryIncrease.toFixed(1)}MB`);

      expect(flatResults).toHaveLength(totalRequests);
      expect(avgTimePerRequest).toBeLessThan(100);
      expect(memoryIncrease).toBeLessThan(30);

      // Check uniqueness
      const uniquePasswords = new Set(flatResults.map((r) => r.password));
      expect(uniquePasswords.size).toBe(totalRequests);
    });
  });
});
