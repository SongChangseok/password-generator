/**
 * Cross-platform storage utility for web and native compatibility
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const webSecureStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      const item = localStorage.getItem(key);
      return item ? atob(item) : null;
    } else if (SecureStore) {
      return await SecureStore.getItemAsync(key);
    }
    return null;
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, btoa(value));
    } else if (SecureStore) {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else if (SecureStore) {
      await SecureStore.deleteItemAsync(key);
    }
  }
};

// Web-compatible crypto utilities
export const webCrypto = {
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256' as const
  },

  async digestStringAsync(algorithm: string, data: string, options = { encoding: 'hex' }) {
    if (Platform.OS === 'web' && crypto?.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for native platforms (will use Expo Crypto)
    const ExpoBackground = require('expo-crypto');
    return await ExpoBackground.digestStringAsync(algorithm, data, options);
  }
};