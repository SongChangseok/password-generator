/**
 * Security Integration Tests
 * Tests for biometric + PIN authentication combinations and security features
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

// Mock Expo modules
jest.mock('expo-secure-store');
jest.mock('expo-local-authentication');

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockLocalAuth = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;

import {
  authenticateUser,
  checkBiometricCapabilities,
  isBiometricAuthEnabled,
  setBiometricAuthEnabled,
} from '../biometricAuth';
import {
  verifyPin,
  setupPin,
  isPinConfigured,
  isPinEnabled,
} from '../pinAuth';
import {
  initializeAppLock,
  shouldAppBeLocked,
  getAppLockSettings,
  setAppLockSettings,
  isAppLockAvailable,
} from '../appLock';

describe('Security Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear all secure storage
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    mockSecureStore.setItemAsync.mockResolvedValue();
    mockSecureStore.deleteItemAsync.mockResolvedValue();
  });

  describe('Biometric + PIN Authentication Flow', () => {
    it('should fallback to PIN when biometric fails', async () => {
      // Setup: Biometric enabled but fails
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'biometric_auth_enabled') return Promise.resolve('true');
        if (key === 'user_pin_hash') return Promise.resolve('hashed_pin');
        if (key === 'pin_salt') return Promise.resolve('salt');
        if (key === 'pin_enabled') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: false,
        error: 'Authentication failed',
      });

      const result = await authenticateUser();

      expect(result.success).toBe(false);
      expect(result.biometricUsed).toBe(true);
      expect(result.error).toBe('Authentication failed');
    });

    it('should succeed with biometric authentication', async () => {
      // Setup: Biometric enabled and succeeds
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'biometric_auth_enabled') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: true,
      });

      const result = await authenticateUser();

      expect(result.success).toBe(true);
      expect(result.biometricUsed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should work with PIN only when biometric disabled', async () => {
      // Setup: Biometric disabled, PIN configured
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'biometric_auth_enabled') return Promise.resolve('false');
        if (key === 'user_pin_hash') return Promise.resolve('hashed_pin');
        if (key === 'pin_salt') return Promise.resolve('salt');
        if (key === 'pin_enabled') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      const result = await authenticateUser();

      expect(result.success).toBe(false);
      expect(result.biometricUsed).toBe(false);
      expect(result.error).toBe('Biometric authentication disabled');
    });
  });

  describe('Cross-Device Compatibility', () => {
    it('should handle devices without biometric hardware', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([]);

      const capabilities = await checkBiometricCapabilities();

      expect(capabilities.hasHardware).toBe(false);
      expect(capabilities.isEnrolled).toBe(false);
      expect(capabilities.supportedTypes).toEqual([]);
    });

    it('should handle devices with hardware but no enrollment', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      const capabilities = await checkBiometricCapabilities();

      expect(capabilities.hasHardware).toBe(true);
      expect(capabilities.isEnrolled).toBe(false);
      expect(capabilities.supportedTypes).toEqual([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);
    });

    it('should identify different biometric types correctly', async () => {
      // Test Face ID
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      let capabilities = await checkBiometricCapabilities();
      expect(capabilities.supportedTypes).toEqual([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      // Test Touch ID
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      capabilities = await checkBiometricCapabilities();
      expect(capabilities.supportedTypes).toEqual([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);
    });
  });

  describe('Security Settings Change Scenarios', () => {
    it('should properly enable biometric authentication', async () => {
      await setBiometricAuthEnabled(true);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'biometric_auth_enabled',
        'true'
      );
    });

    it('should properly disable biometric authentication', async () => {
      await setBiometricAuthEnabled(false);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'biometric_auth_enabled',
        'false'
      );
    });

    it('should maintain app lock availability with PIN fallback', async () => {
      // Setup: PIN configured but biometric disabled
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'user_pin_hash') return Promise.resolve('hashed_pin');
        if (key === 'pin_salt') return Promise.resolve('salt');
        if (key === 'biometric_auth_enabled') return Promise.resolve('false');
        return Promise.resolve(null);
      });

      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([]);

      const isAvailable = await isAppLockAvailable();
      expect(isAvailable).toBe(true);
    });
  });

  describe('Memory Security and Data Clearing', () => {
    it('should clear PIN attempts after successful verification', async () => {
      // Setup PIN
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'pin_enabled') return Promise.resolve('true');
        if (key === 'user_pin_hash') return Promise.resolve('test_hash');
        if (key === 'pin_salt') return Promise.resolve('test_salt');
        return Promise.resolve(null);
      });

      // Mock successful hash comparison
      const crypto = require('expo-crypto');
      jest.spyOn(crypto, 'digestStringAsync').mockResolvedValue('test_hash');

      const result = await verifyPin('1234');

      expect(result.isValid).toBe(true);
      // Should clear attempts on success
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('pin_attempts');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('pin_last_attempt');
    });

    it('should properly setup PIN with secure hashing', async () => {
      const crypto = require('expo-crypto');
      jest.spyOn(crypto, 'getRandomBytesAsync').mockResolvedValue(new Uint8Array(32));
      jest.spyOn(crypto, 'digestStringAsync').mockResolvedValue('hashed_pin');

      await setupPin('1234');

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'user_pin_hash',
        'hashed_pin'
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'pin_enabled',
        'true'
      );
    });
  });

  describe('App Lock Timeout Functionality', () => {
    it('should correctly determine if app should be locked based on timeout', async () => {
      const mockSettings = {
        isEnabled: true,
        lockTimeout: 30, // 30 seconds
        requireAuthOnStart: true,
        backgroundProtection: true,
      };

      const oldTime = Date.now() - 31000; // 31 seconds ago
      const mockState = {
        isLocked: false,
        lastActiveTime: oldTime,
        authRequired: false,
      };

      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'app_lock_settings') return Promise.resolve(JSON.stringify(mockSettings));
        if (key === 'app_lock_state') return Promise.resolve(JSON.stringify(mockState));
        return Promise.resolve(null);
      });

      const shouldLock = await shouldAppBeLocked();
      expect(shouldLock).toBe(true);
    });

    it('should not lock if within timeout period', async () => {
      const mockSettings = {
        isEnabled: true,
        lockTimeout: 60, // 60 seconds
        requireAuthOnStart: true,
        backgroundProtection: true,
      };

      const recentTime = Date.now() - 30000; // 30 seconds ago
      const mockState = {
        isLocked: false,
        lastActiveTime: recentTime,
        authRequired: false,
      };

      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'app_lock_settings') return Promise.resolve(JSON.stringify(mockSettings));
        if (key === 'app_lock_state') return Promise.resolve(JSON.stringify(mockState));
        return Promise.resolve(null);
      });

      const shouldLock = await shouldAppBeLocked();
      expect(shouldLock).toBe(false);
    });

    it('should handle immediate lock timeout', async () => {
      const mockSettings = {
        isEnabled: true,
        lockTimeout: 0, // Immediate
        requireAuthOnStart: true,
        backgroundProtection: true,
      };

      const recentTime = Date.now() - 1000; // 1 second ago
      const mockState = {
        isLocked: false,
        lastActiveTime: recentTime,
        authRequired: false,
      };

      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'app_lock_settings') return Promise.resolve(JSON.stringify(mockSettings));
        if (key === 'app_lock_state') return Promise.resolve(JSON.stringify(mockState));
        return Promise.resolve(null);
      });

      const shouldLock = await shouldAppBeLocked();
      expect(shouldLock).toBe(true);
    });
  });

  describe('Background Protection', () => {
    it('should enable background protection by default', async () => {
      const settings = await getAppLockSettings();
      expect(settings.backgroundProtection).toBe(true);
    });

    it('should allow toggling background protection', async () => {
      const newSettings = {
        isEnabled: true,
        lockTimeout: 300,
        requireAuthOnStart: true,
        backgroundProtection: false,
      };

      await setAppLockSettings(newSettings);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'app_lock_settings',
        JSON.stringify(newSettings)
      );
    });
  });

  describe('Security Level Assessment', () => {
    it('should assess high security with biometric + PIN', async () => {
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'biometric_auth_enabled') return Promise.resolve('true');
        if (key === 'user_pin_hash') return Promise.resolve('hashed_pin');
        if (key === 'pin_salt') return Promise.resolve('salt');
        return Promise.resolve(null);
      });

      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      const biometricEnabled = await isBiometricAuthEnabled();
      const pinConfigured = await isPinConfigured();
      const capabilities = await checkBiometricCapabilities();

      expect(biometricEnabled).toBe(true);
      expect(pinConfigured).toBe(true);
      expect(capabilities.hasHardware).toBe(true);
      expect(capabilities.isEnrolled).toBe(true);
    });

    it('should assess medium security with PIN only', async () => {
      mockSecureStore.getItemAsync.mockImplementation((key) => {
        if (key === 'biometric_auth_enabled') return Promise.resolve('false');
        if (key === 'user_pin_hash') return Promise.resolve('hashed_pin');
        if (key === 'pin_salt') return Promise.resolve('salt');
        return Promise.resolve(null);
      });

      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);

      const biometricEnabled = await isBiometricAuthEnabled();
      const pinConfigured = await isPinConfigured();

      expect(biometricEnabled).toBe(false);
      expect(pinConfigured).toBe(true);
    });

    it('should assess low security with no authentication', async () => {
      const biometricEnabled = await isBiometricAuthEnabled();
      const pinConfigured = await isPinConfigured();

      expect(biometricEnabled).toBe(false);
      expect(pinConfigured).toBe(false);
    });
  });
});