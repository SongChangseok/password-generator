import {
  getSecureRandomBytes,
  getSecureRandomInt,
  secureShuffleArray,
} from '../secureRandom';

// Mock expo-crypto for testing
jest.mock('expo-crypto', () => {
  let mockCallCount = 0;
  return {
    getRandomBytesAsync: jest.fn((length: number) => {
      const array = new Array(length);
      for (let i = 0; i < length; i++) {
        array[i] = (i * 13 + mockCallCount * 19 + 42) % 256;
      }
      mockCallCount++;
      return Promise.resolve(array);
    }),
  };
});

describe('secureRandom', () => {
  describe('getSecureRandomBytes', () => {
    it('should generate the correct number of bytes', async () => {
      const bytes = await getSecureRandomBytes(16);
      expect(bytes).toHaveLength(16);
      expect(bytes).toBeInstanceOf(Uint8Array);
    });

    it('should generate different values on multiple calls', async () => {
      const bytes1 = await getSecureRandomBytes(16);
      const bytes2 = await getSecureRandomBytes(16);
      expect(bytes1).not.toEqual(bytes2);
    });

    it('should handle edge cases', async () => {
      const zeroBytes = await getSecureRandomBytes(0);
      expect(zeroBytes).toHaveLength(0);

      const singleByte = await getSecureRandomBytes(1);
      expect(singleByte).toHaveLength(1);
    });
  });

  describe('getSecureRandomInt', () => {
    it('should generate numbers within the specified range', async () => {
      for (let i = 0; i < 100; i++) {
        const num = await getSecureRandomInt(1, 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
        expect(Number.isInteger(num)).toBe(true);
      }
    });

    it('should handle single value range', async () => {
      const num = await getSecureRandomInt(5, 5);
      expect(num).toBe(5);
    });

    it('should handle zero range', async () => {
      const num = await getSecureRandomInt(0, 0);
      expect(num).toBe(0);
    });

    it('should throw error for invalid range', async () => {
      await expect(getSecureRandomInt(10, 5)).rejects.toThrow(
        'min must be less than or equal to max'
      );
    });

    it('should generate different values on multiple calls', async () => {
      const results = new Set();
      for (let i = 0; i < 50; i++) {
        const num = await getSecureRandomInt(1, 100);
        results.add(num);
      }
      // Should have reasonable distribution with mock
      expect(results.size).toBeGreaterThan(5);
    });
  });

  describe('secureShuffleArray', () => {
    it('should shuffle array elements', async () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = await secureShuffleArray(original);

      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());

      // With mock, just verify it's not obviously broken
      expect(shuffled).toContain(1);
      expect(shuffled).toContain(10);
    });

    it('should not modify original array', async () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      await secureShuffleArray(original);
      expect(original).toEqual(originalCopy);
    });

    it('should handle empty array', async () => {
      const result = await secureShuffleArray([]);
      expect(result).toEqual([]);
    });

    it('should handle single element array', async () => {
      const result = await secureShuffleArray([42]);
      expect(result).toEqual([42]);
    });

    it('should work with different data types', async () => {
      const strings = ['a', 'b', 'c', 'd'];
      const shuffledStrings = await secureShuffleArray(strings);
      expect(shuffledStrings.sort()).toEqual(strings.sort());

      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const shuffledObjects = await secureShuffleArray(objects);
      expect(shuffledObjects.length).toBe(objects.length);
      expect(shuffledObjects.map((o) => o.id).sort()).toEqual([1, 2, 3]);
    });
  });
});
