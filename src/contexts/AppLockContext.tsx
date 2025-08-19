import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  initializeAppLock,
  handleAppStateChange,
  unlockApp,
  lockApp,
  getAppLockSettings,
  isAppLockAvailable,
  type AppLockSettings,
} from '@/utils/appLock';

interface AppLockContextType {
  isLocked: boolean;
  isLoading: boolean;
  settings: AppLockSettings | null;
  isAvailable: boolean;
  authenticate: () => Promise<void>;
  lock: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

interface AppLockProviderProps {
  children: ReactNode;
}

export const AppLockProvider: React.FC<AppLockProviderProps> = ({
  children,
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AppLockSettings | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const [currentSettings, available] = await Promise.all([
        getAppLockSettings(),
        isAppLockAvailable(),
      ]);

      setSettings(currentSettings);
      setIsAvailable(available);

      return currentSettings;
    } catch (error) {
      console.error('Error loading app lock settings:', error);
      return null;
    }
  }, []);

  const initializeLock = useCallback(async () => {
    try {
      setIsLoading(true);

      await loadSettings();
      const authRequired = await initializeAppLock();
      setIsLocked(authRequired);
    } catch (error) {
      console.error('Error initializing app lock:', error);
      setIsLocked(false);
    } finally {
      setIsLoading(false);
    }
  }, [loadSettings]);

  useEffect(() => {
    initializeLock();
  }, [initializeLock]);

  useEffect(() => {
    const handleAppStateChangeWrapper = async (
      nextAppState: AppStateStatus
    ) => {
      try {
        await handleAppStateChange(nextAppState);

        // Check if app should now be locked
        if (nextAppState === 'active' && settings?.isEnabled) {
          const authRequired = await initializeAppLock();
          setIsLocked(authRequired);
        }
      } catch (error) {
        console.error('Error handling app state change:', error);
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChangeWrapper
    );

    return () => {
      subscription.remove();
    };
  }, [settings]);

  const authenticate = useCallback(async () => {
    try {
      await unlockApp();
      setIsLocked(false);
    } catch (error) {
      console.error('Error unlocking app:', error);
      throw error;
    }
  }, []);

  const lock = useCallback(async () => {
    try {
      await lockApp();
      setIsLocked(true);
    } catch (error) {
      console.error('Error locking app:', error);
      throw error;
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  const contextValue: AppLockContextType = {
    isLocked,
    isLoading,
    settings,
    isAvailable,
    authenticate,
    lock,
    refreshSettings,
  };

  return (
    <AppLockContext.Provider value={contextValue}>
      {children}
    </AppLockContext.Provider>
  );
};

export const useAppLock = (): AppLockContextType => {
  const context = useContext(AppLockContext);
  if (context === undefined) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
};
