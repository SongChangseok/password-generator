import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import {
  SavedPassword,
  PasswordStorage,
  SortOrder,
  SearchOptions,
  StorageLimit,
} from './types';

/**
 * Password Storage System - v1.2 Phase 3
 *
 * Provides encrypted local storage for saved passwords using expo-secure-store
 * with AES-256 encryption. Implements search, sorting, and free version limits.
 */

const STORAGE_KEY = 'saved_passwords';
const STORAGE_VERSION_KEY = 'storage_version';
const CURRENT_STORAGE_VERSION = '1.2.0';

// Free version limits
const FREE_VERSION_LIMIT = 10;

/**
 * Generate unique ID for saved passwords
 */
export const generatePasswordId = async (): Promise<string> => {
  const timestamp = Date.now().toString();
  const randomBytes = await Crypto.getRandomBytesAsync(8);
  const randomHex = Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `pwd_${timestamp}_${randomHex}`;
};

/**
 * Encrypt password data before storage
 */
const encryptData = async (data: string): Promise<string> => {
  // For now, rely on expo-secure-store's built-in encryption
  // In future versions, could add additional encryption layer
  return data;
};

/**
 * Decrypt password data after retrieval
 */
const decryptData = async (encryptedData: string): Promise<string> => {
  // Corresponding decryption for future encryption layer
  return encryptedData;
};

/**
 * Get all saved passwords from secure storage
 */
const getAllPasswords = async (): Promise<SavedPassword[]> => {
  try {
    const encryptedData = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!encryptedData) {
      return [];
    }

    const decryptedData = await decryptData(encryptedData);
    const passwords: SavedPassword[] = JSON.parse(decryptedData);

    // Validate and sanitize data
    return passwords.map((password) => ({
      ...password,
      createdAt: new Date(password.createdAt),
      lastUsed: password.lastUsed ? new Date(password.lastUsed) : undefined,
    }));
  } catch (error) {
    console.error('Error retrieving passwords:', error);
    return [];
  }
};

/**
 * Save all passwords to secure storage
 */
const saveAllPasswords = async (passwords: SavedPassword[]): Promise<void> => {
  try {
    const dataToStore = JSON.stringify(passwords);
    const encryptedData = await encryptData(dataToStore);
    await SecureStore.setItemAsync(STORAGE_KEY, encryptedData);
  } catch (error) {
    console.error('Error saving passwords:', error);
    throw new Error('Failed to save passwords');
  }
};

/**
 * Sort passwords based on specified order
 */
const sortPasswords = (
  passwords: SavedPassword[],
  sortOrder: SortOrder
): SavedPassword[] => {
  const sorted = [...passwords];

  switch (sortOrder) {
    case SortOrder.NEWEST_FIRST:
      return sorted.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

    case SortOrder.OLDEST_FIRST:
      return sorted.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

    case SortOrder.NAME_ASC:
      return sorted.sort((a, b) =>
        a.siteName.toLowerCase().localeCompare(b.siteName.toLowerCase())
      );

    case SortOrder.NAME_DESC:
      return sorted.sort((a, b) =>
        b.siteName.toLowerCase().localeCompare(a.siteName.toLowerCase())
      );

    case SortOrder.STRENGTH_DESC:
      return sorted.sort((a, b) => b.strength.score - a.strength.score);

    case SortOrder.MOST_USED:
      return sorted.sort((a, b) => b.usageCount - a.usageCount);

    default:
      return sorted;
  }
};

/**
 * Filter and search passwords
 */
const searchPasswords = (
  passwords: SavedPassword[],
  options: SearchOptions
): SavedPassword[] => {
  let filtered = passwords;

  // Apply text search
  if (options.query.trim()) {
    const query = options.query.toLowerCase().trim();
    filtered = passwords.filter(
      (password) =>
        password.siteName.toLowerCase().includes(query) ||
        password.accountName?.toLowerCase().includes(query) ||
        password.memo?.toLowerCase().includes(query)
    );
  }

  // Apply strength filter
  if (options.strengthFilter !== undefined) {
    filtered = filtered.filter(
      (password) => password.strength.score >= options.strengthFilter!
    );
  }

  // Apply sorting
  return sortPasswords(filtered, options.sortOrder);
};

/**
 * Check storage version and migrate if necessary
 */
const checkAndMigrateStorage = async (): Promise<void> => {
  try {
    const currentVersion = await SecureStore.getItemAsync(STORAGE_VERSION_KEY);

    if (currentVersion !== CURRENT_STORAGE_VERSION) {
      // Future: Add migration logic here when storage format changes
      await SecureStore.setItemAsync(
        STORAGE_VERSION_KEY,
        CURRENT_STORAGE_VERSION
      );
    }
  } catch (error) {
    console.error('Error checking storage version:', error);
  }
};

/**
 * Get current storage limits
 */
export const getStorageLimit = async (): Promise<StorageLimit> => {
  const passwords = await getAllPasswords();

  // TODO: In future versions, check premium status from user settings
  const isPremium = false;

  return {
    maxPasswords: isPremium ? Number.MAX_SAFE_INTEGER : FREE_VERSION_LIMIT,
    currentCount: passwords.length,
    isPremium,
  };
};

/**
 * Password Storage Implementation
 */
export const passwordStorage: PasswordStorage = {
  /**
   * Save a new password
   */
  save: async (password: SavedPassword): Promise<void> => {
    await checkAndMigrateStorage();

    // Check storage limit
    const limit = await getStorageLimit();
    if (limit.currentCount >= limit.maxPasswords) {
      throw new Error(
        `Storage limit reached. Free version allows ${limit.maxPasswords} passwords.`
      );
    }

    const passwords = await getAllPasswords();

    // Check if password with same ID already exists
    const existingIndex = passwords.findIndex((p) => p.id === password.id);
    if (existingIndex >= 0) {
      throw new Error('Password with this ID already exists');
    }

    passwords.push(password);
    await saveAllPasswords(passwords);
  },

  /**
   * Get all saved passwords (sorted by newest first by default)
   */
  getAll: async (): Promise<SavedPassword[]> => {
    await checkAndMigrateStorage();
    const passwords = await getAllPasswords();
    return sortPasswords(passwords, SortOrder.NEWEST_FIRST);
  },

  /**
   * Get password by ID
   */
  getById: async (id: string): Promise<SavedPassword | null> => {
    const passwords = await getAllPasswords();
    return passwords.find((p) => p.id === id) || null;
  },

  /**
   * Update password metadata (not the password itself)
   */
  update: async (
    id: string,
    updates: Partial<SavedPassword>
  ): Promise<void> => {
    const passwords = await getAllPasswords();
    const index = passwords.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error('Password not found');
    }

    // Only allow updating metadata, not the password itself
    const allowedUpdates = {
      siteName: updates.siteName,
      accountName: updates.accountName,
      memo: updates.memo,
      lastUsed: updates.lastUsed,
      usageCount: updates.usageCount,
    };

    passwords[index] = {
      ...passwords[index],
      ...Object.fromEntries(
        Object.entries(allowedUpdates).filter(
          ([_, value]) => value !== undefined
        )
      ),
    };

    await saveAllPasswords(passwords);
  },

  /**
   * Delete password by ID
   */
  delete: async (id: string): Promise<void> => {
    const passwords = await getAllPasswords();
    const filteredPasswords = passwords.filter((p) => p.id !== id);

    if (filteredPasswords.length === passwords.length) {
      throw new Error('Password not found');
    }

    await saveAllPasswords(filteredPasswords);
  },

  /**
   * Delete all saved passwords
   */
  deleteAll: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  },

  /**
   * Get count of saved passwords
   */
  getCount: async (): Promise<number> => {
    const passwords = await getAllPasswords();
    return passwords.length;
  },
};

/**
 * Search and filter passwords
 */
export const searchSavedPasswords = async (
  options: SearchOptions
): Promise<SavedPassword[]> => {
  const passwords = await getAllPasswords();
  return searchPasswords(passwords, options);
};

/**
 * Mark password as used (increment usage count and update lastUsed)
 */
export const markPasswordAsUsed = async (id: string): Promise<void> => {
  const password = await passwordStorage.getById(id);
  if (!password) {
    throw new Error('Password not found');
  }

  await passwordStorage.update(id, {
    lastUsed: new Date(),
    usageCount: password.usageCount + 1,
  });
};

/**
 * Check if storage limit is reached
 */
export const isStorageLimitReached = async (): Promise<boolean> => {
  const limit = await getStorageLimit();
  return limit.currentCount >= limit.maxPasswords;
};

/**
 * Get storage statistics
 */
export const getStorageStats = async () => {
  const passwords = await getAllPasswords();
  const limit = await getStorageLimit();

  const strengthDistribution = passwords.reduce(
    (acc, password) => {
      acc[password.strength.label] = (acc[password.strength.label] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalPasswords: passwords.length,
    limit: limit.maxPasswords,
    isPremium: limit.isPremium,
    strengthDistribution,
    oldestPassword:
      passwords.length > 0
        ? passwords.reduce((oldest, current) =>
            current.createdAt < oldest.createdAt ? current : oldest
          ).createdAt
        : null,
    newestPassword:
      passwords.length > 0
        ? passwords.reduce((newest, current) =>
            current.createdAt > newest.createdAt ? current : newest
          ).createdAt
        : null,
  };
};
