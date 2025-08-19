import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus } from 'react-native';
import { isPinEnabled, isPinConfigured } from './pinAuth';
import {
  isBiometricAuthEnabled,
  checkBiometricCapabilities,
} from './biometricAuth';

export interface AppLockSettings {
  isEnabled: boolean;
  lockTimeout: number; // seconds
  requireAuthOnStart: boolean;
  backgroundProtection: boolean;
}

export enum AutoLockTimeout {
  IMMEDIATE = 0,
  THIRTY_SECONDS = 30,
  ONE_MINUTE = 60,
  FIVE_MINUTES = 300,
}

export const AUTO_LOCK_OPTIONS = [
  { label: 'Immediate', value: AutoLockTimeout.IMMEDIATE },
  { label: '30 seconds', value: AutoLockTimeout.THIRTY_SECONDS },
  { label: '1 minute', value: AutoLockTimeout.ONE_MINUTE },
  { label: '5 minutes', value: AutoLockTimeout.FIVE_MINUTES },
];

export const getAutoLockLabel = (timeout: number): string => {
  const option = AUTO_LOCK_OPTIONS.find((opt) => opt.value === timeout);
  return option ? option.label : `${timeout} seconds`;
};

export interface AppLockState {
  isLocked: boolean;
  lastActiveTime: number;
  authRequired: boolean;
}

const APP_LOCK_SETTINGS_KEY = 'app_lock_settings';
const APP_LOCK_STATE_KEY = 'app_lock_state';

// Default settings
const DEFAULT_SETTINGS: AppLockSettings = {
  isEnabled: false,
  lockTimeout: AutoLockTimeout.FIVE_MINUTES,
  requireAuthOnStart: true,
  backgroundProtection: true,
};

/**
 * Check if app lock is available (any auth method configured)
 * @returns Promise<boolean> Whether app lock can be enabled
 */
export const isAppLockAvailable = async (): Promise<boolean> => {
  try {
    const [pinConfigured, biometricEnabled, biometricCapabilities] =
      await Promise.all([
        isPinConfigured(),
        isBiometricAuthEnabled(),
        checkBiometricCapabilities(),
      ]);

    const hasBiometric =
      biometricEnabled &&
      biometricCapabilities.hasHardware &&
      biometricCapabilities.isEnrolled;

    return pinConfigured || hasBiometric;
  } catch (error) {
    console.error('Error checking app lock availability:', error);
    return false;
  }
};

/**
 * Get app lock settings
 * @returns Promise<AppLockSettings> Current app lock settings
 */
export const getAppLockSettings = async (): Promise<AppLockSettings> => {
  try {
    const settingsJson = await SecureStore.getItemAsync(APP_LOCK_SETTINGS_KEY);
    if (settingsJson) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting app lock settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save app lock settings
 * @param settings App lock settings to save
 * @returns Promise<void>
 */
export const setAppLockSettings = async (
  settings: AppLockSettings
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(
      APP_LOCK_SETTINGS_KEY,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error('Error saving app lock settings:', error);
    throw new Error('Failed to save app lock settings');
  }
};

/**
 * Get current app lock state
 * @returns Promise<AppLockState> Current lock state
 */
export const getAppLockState = async (): Promise<AppLockState> => {
  try {
    const stateJson = await SecureStore.getItemAsync(APP_LOCK_STATE_KEY);
    if (stateJson) {
      return JSON.parse(stateJson);
    }

    return {
      isLocked: false,
      lastActiveTime: Date.now(),
      authRequired: false,
    };
  } catch (error) {
    console.error('Error getting app lock state:', error);
    return {
      isLocked: false,
      lastActiveTime: Date.now(),
      authRequired: false,
    };
  }
};

/**
 * Update app lock state
 * @param state New lock state
 * @returns Promise<void>
 */
export const setAppLockState = async (state: AppLockState): Promise<void> => {
  try {
    await SecureStore.setItemAsync(APP_LOCK_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving app lock state:', error);
  }
};

/**
 * Check if app should be locked based on current state and settings
 * @returns Promise<boolean> Whether app should be locked
 */
export const shouldAppBeLocked = async (): Promise<boolean> => {
  try {
    const settings = await getAppLockSettings();
    const state = await getAppLockState();

    if (!settings.isEnabled) {
      return false;
    }

    // Check if auth is explicitly required
    if (state.authRequired) {
      return true;
    }

    // Check timeout
    const timeSinceActive = Date.now() - state.lastActiveTime;
    const timeoutMs = settings.lockTimeout * 1000;

    return timeSinceActive > timeoutMs;
  } catch (error) {
    console.error('Error checking if app should be locked:', error);
    return false;
  }
};

/**
 * Lock the app immediately
 * @returns Promise<void>
 */
export const lockApp = async (): Promise<void> => {
  try {
    const currentState = await getAppLockState();
    await setAppLockState({
      ...currentState,
      isLocked: true,
      authRequired: true,
    });
  } catch (error) {
    console.error('Error locking app:', error);
  }
};

/**
 * Unlock the app
 * @returns Promise<void>
 */
export const unlockApp = async (): Promise<void> => {
  try {
    await setAppLockState({
      isLocked: false,
      lastActiveTime: Date.now(),
      authRequired: false,
    });
  } catch (error) {
    console.error('Error unlocking app:', error);
  }
};

/**
 * Update last active time (call when user interacts with app)
 * @returns Promise<void>
 */
export const updateLastActiveTime = async (): Promise<void> => {
  try {
    const currentState = await getAppLockState();
    await setAppLockState({
      ...currentState,
      lastActiveTime: Date.now(),
    });
  } catch (error) {
    console.error('Error updating last active time:', error);
  }
};

/**
 * Handle app state change (background/foreground)
 * @param nextAppState Next app state
 * @returns Promise<void>
 */
export const handleAppStateChange = async (
  nextAppState: AppStateStatus
): Promise<void> => {
  try {
    const settings = await getAppLockSettings();

    if (!settings.isEnabled) {
      return;
    }

    if (nextAppState === 'background') {
      // App going to background - update last active time
      await updateLastActiveTime();
    } else if (nextAppState === 'active') {
      // App coming to foreground - check if should be locked
      const shouldLock = await shouldAppBeLocked();
      if (shouldLock) {
        await lockApp();
      }
    }
  } catch (error) {
    console.error('Error handling app state change:', error);
  }
};

/**
 * Initialize app lock on app startup
 * @returns Promise<boolean> Whether authentication is required
 */
export const initializeAppLock = async (): Promise<boolean> => {
  try {
    const settings = await getAppLockSettings();

    if (!settings.isEnabled) {
      return false;
    }

    // Always require auth on app start if configured
    if (settings.requireAuthOnStart) {
      await lockApp();
      return true;
    }

    // Check if app should be locked based on last active time
    const shouldLock = await shouldAppBeLocked();
    if (shouldLock) {
      await lockApp();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error initializing app lock:', error);
    return false;
  }
};

/**
 * Enable app lock with default settings
 * @returns Promise<void>
 */
export const enableAppLock = async (): Promise<void> => {
  const available = await isAppLockAvailable();
  if (!available) {
    throw new Error('No authentication methods configured');
  }

  const settings = await getAppLockSettings();
  await setAppLockSettings({
    ...settings,
    isEnabled: true,
  });
};

/**
 * Disable app lock
 * @returns Promise<void>
 */
export const disableAppLock = async (): Promise<void> => {
  const settings = await getAppLockSettings();
  await setAppLockSettings({
    ...settings,
    isEnabled: false,
  });

  // Unlock the app
  await unlockApp();
};
