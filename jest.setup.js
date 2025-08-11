// Mock crypto.getRandomValues for testing
global.crypto = {
  getRandomValues: (array) => {
    // Generate deterministic "random" values for testing
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 4294967296);
    }
    return array;
  },
};

// Mock React Native modules that might not be available in test environment
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(() => Promise.resolve('')),
}));

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));