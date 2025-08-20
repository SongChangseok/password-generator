import { generateSecurePassword } from '../passwordGenerator';
import { GeneratorOptions } from '../types';

describe('Memory and Resource Management Tests', () => {
  describe('Memory Usage Monitoring', () => {
    it('should maintain memory usage under 80MB target during intensive operations', async () => {
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

      // Record initial memory
      const initialMemory = process.memoryUsage();
      const initialHeapMB = initialMemory.heapUsed / 1024 / 1024;

      // Perform intensive password generation
      const passwords: string[] = [];
      for (let i = 0; i < 500; i++) {
        const result = await generateSecurePassword(options);
        passwords.push(result.password);

        // Check memory every 100 iterations
        if (i % 100 === 0) {
          const currentMemory = process.memoryUsage();
          const currentHeapMB = currentMemory.heapUsed / 1024 / 1024;
          const memoryIncrease = currentHeapMB - initialHeapMB;

          // Should not exceed 80MB total usage increase
          expect(memoryIncrease).toBeLessThan(80);
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Final memory check
      const finalMemory = process.memoryUsage();
      const finalHeapMB = finalMemory.heapUsed / 1024 / 1024;
      const totalMemoryIncrease = finalHeapMB - initialHeapMB;

      expect(totalMemoryIncrease).toBeLessThan(50); // Should be well under limit after GC
      expect(passwords.length).toBe(500);
    });

    it('should not create memory leaks in string operations', async () => {
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

      const iterations = 1000;
      const memoryReadings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Generate password and immediately discard reference
        await generateSecurePassword(options);

        // Record memory usage every 100 iterations
        if (i % 100 === 0) {
          const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
          memoryReadings.push(currentMemory);
        }
      }

      // Memory should not show a consistent upward trend
      const firstReading = memoryReadings[0];
      const lastReading = memoryReadings[memoryReadings.length - 1];
      const memoryGrowth = lastReading - firstReading;

      // Allow some growth but not excessive (< 30MB for 1000 iterations)
      expect(memoryGrowth).toBeLessThan(30);
    });

    it('should handle concurrent operations without memory explosion', async () => {
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

      const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;

      // Create 50 concurrent password generation promises
      const promises = Array.from({ length: 50 }, () =>
        generateSecurePassword(options)
      );

      const results = await Promise.all(promises);

      const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryIncrease = finalMemory - initialMemory;

      // Should handle concurrent operations efficiently
      expect(memoryIncrease).toBeLessThan(30);
      expect(results.length).toBe(50);

      // All results should be valid
      results.forEach((result) => {
        expect(result.password).toHaveLength(20);
        expect(result.strength.score).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Resource Cleanup', () => {
    it('should properly clean up TypedArrays and crypto resources', async () => {
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

      // Monitor heap objects before operations
      const initialMemory = process.memoryUsage();

      // Perform operations that create TypedArrays
      for (let i = 0; i < 100; i++) {
        await generateSecurePassword(options);
      }

      // Force cleanup
      if (global.gc) {
        global.gc();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const finalMemory = process.memoryUsage();
      const heapGrowth =
        (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

      // Heap growth should be minimal after cleanup
      expect(heapGrowth).toBeLessThan(5);
    });

    it('should not accumulate objects in rapid succession', async () => {
      const options: GeneratorOptions = {
        length: 12,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: false,
        preventRepeating: false,
        readableFormat: false,
      };

      let peakMemory = 0;
      let currentMemory = 0;

      // Rapid succession test
      for (let i = 0; i < 200; i++) {
        await generateSecurePassword(options);

        currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        if (currentMemory > peakMemory) {
          peakMemory = currentMemory;
        }

        // Memory should not continuously grow
        if (i > 50) {
          const memoryRatio = currentMemory / peakMemory;
          expect(memoryRatio).toBeLessThan(1.5); // No more than 50% over peak
        }
      }
    });
  });

  describe('Performance Under Memory Pressure', () => {
    it('should maintain performance when memory is constrained', async () => {
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

      // Create some memory pressure
      const memoryPressure: number[][] = [];
      for (let i = 0; i < 10; i++) {
        memoryPressure.push(new Array(100000).fill(Math.random()));
      }

      const performanceTimes: number[] = [];

      // Test password generation under memory pressure
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        const result = await generateSecurePassword(options);
        const endTime = Date.now();

        const generationTime = endTime - startTime;
        performanceTimes.push(generationTime);

        // Should still meet performance targets
        expect(generationTime).toBeLessThanOrEqual(300);
        expect(result.password).toHaveLength(24);
      }

      // Performance should remain consistent
      const avgTime =
        performanceTimes.reduce((a, b) => a + b) / performanceTimes.length;
      expect(avgTime).toBeLessThan(150);

      // Clean up memory pressure
      memoryPressure.length = 0;
    });
  });
});
