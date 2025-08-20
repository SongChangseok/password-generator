/**
 * Premium Features Management - v1.2 Phase 3
 * 
 * Manages free/premium version features and limitations.
 * In future versions, this will integrate with in-app purchases.
 */

import * as SecureStore from 'expo-secure-store';

// Storage keys
const PREMIUM_STATUS_KEY = 'premium_status';
const PREMIUM_PURCHASE_KEY = 'premium_purchase_info';

// Free version limitations
export const FREE_VERSION_LIMITS = {
  MAX_SAVED_PASSWORDS: 10,
  MAX_TEMPLATES: 3,
  ADVANCED_SEARCH: false,
  EXPORT_IMPORT: false,
  PREMIUM_TEMPLATES: false,
  CLOUD_SYNC: false,
};

// Premium features
export const PREMIUM_FEATURES = {
  UNLIMITED_PASSWORDS: true,
  ADVANCED_SEARCH: true,
  CUSTOM_TEMPLATES: true,
  EXPORT_IMPORT: true,
  PREMIUM_TEMPLATES: true,
  PRIORITY_SUPPORT: true,
  AD_FREE: true,
  CLOUD_SYNC: true, // Future feature
};

interface PremiumStatus {
  isPremium: boolean;
  purchaseDate?: Date;
  expiryDate?: Date; // For subscription model (future)
  features: string[];
}

interface PurchaseInfo {
  productId: string;
  purchaseToken?: string;
  purchaseDate: Date;
  platform: 'ios' | 'android' | 'web';
}

/**
 * Get current premium status
 */
export const getPremiumStatus = async (): Promise<PremiumStatus> => {
  try {
    const statusData = await SecureStore.getItemAsync(PREMIUM_STATUS_KEY);
    
    if (statusData) {
      const status = JSON.parse(statusData);
      return {
        ...status,
        purchaseDate: status.purchaseDate ? new Date(status.purchaseDate) : undefined,
        expiryDate: status.expiryDate ? new Date(status.expiryDate) : undefined,
      };
    }

    // Default free version status
    return {
      isPremium: false,
      features: [],
    };
  } catch (error) {
    console.error('Error getting premium status:', error);
    return {
      isPremium: false,
      features: [],
    };
  }
};

/**
 * Set premium status (after successful purchase)
 */
export const setPremiumStatus = async (
  isPremium: boolean,
  purchaseInfo?: PurchaseInfo
): Promise<void> => {
  try {
    const status: PremiumStatus = {
      isPremium,
      purchaseDate: purchaseInfo?.purchaseDate,
      features: isPremium ? Object.keys(PREMIUM_FEATURES) : [],
    };

    await SecureStore.setItemAsync(PREMIUM_STATUS_KEY, JSON.stringify(status));

    if (purchaseInfo) {
      await SecureStore.setItemAsync(PREMIUM_PURCHASE_KEY, JSON.stringify(purchaseInfo));
    }
  } catch (error) {
    console.error('Error setting premium status:', error);
    throw new Error('Failed to update premium status');
  }
};

/**
 * Check if specific feature is available
 */
export const isFeatureAvailable = async (feature: keyof typeof PREMIUM_FEATURES): Promise<boolean> => {
  const status = await getPremiumStatus();
  
  if (status.isPremium) {
    return true;
  }

  // Check if feature is available in free version
  switch (feature) {
    case 'UNLIMITED_PASSWORDS':
    case 'ADVANCED_SEARCH':
    case 'CUSTOM_TEMPLATES':
    case 'EXPORT_IMPORT':
    case 'PREMIUM_TEMPLATES':
    case 'PRIORITY_SUPPORT':
    case 'AD_FREE':
    case 'CLOUD_SYNC':
      return false;
    default:
      return false;
  }
};

/**
 * Get storage limits based on premium status
 */
export const getStorageLimits = async () => {
  const status = await getPremiumStatus();
  
  return {
    maxPasswords: status.isPremium ? Number.MAX_SAFE_INTEGER : FREE_VERSION_LIMITS.MAX_SAVED_PASSWORDS,
    maxTemplates: status.isPremium ? Number.MAX_SAFE_INTEGER : FREE_VERSION_LIMITS.MAX_TEMPLATES,
    isPremium: status.isPremium,
  };
};

/**
 * Check if user has reached storage limit
 */
export const checkStorageLimit = async (currentCount: number): Promise<{
  canSave: boolean;
  isNearLimit: boolean;
  remainingSlots: number;
  maxSlots: number;
}> => {
  const limits = await getStorageLimits();
  const remainingSlots = limits.isPremium ? Number.MAX_SAFE_INTEGER : limits.maxPasswords - currentCount;
  
  return {
    canSave: currentCount < limits.maxPasswords,
    isNearLimit: !limits.isPremium && remainingSlots <= 2,
    remainingSlots: Math.max(0, remainingSlots),
    maxSlots: limits.maxPasswords,
  };
};

/**
 * Get premium upgrade message
 */
export const getPremiumUpgradeMessage = (feature: string): string => {
  const messages: Record<string, string> = {
    storage: 'Upgrade to Premium for unlimited password storage',
    advanced_search: 'Premium users get advanced search and filtering options',
    export_import: 'Export and import your passwords with Premium',
    templates: 'Access premium password templates and create custom ones',
    ad_free: 'Remove all ads with Premium upgrade',
  };

  return messages[feature] || 'Upgrade to Premium to unlock this feature';
};

/**
 * Simulate premium purchase (for testing - replace with real IAP)
 */
export const simulatePremiumPurchase = async (): Promise<boolean> => {
  try {
    const purchaseInfo: PurchaseInfo = {
      productId: 'premium_unlock',
      purchaseDate: new Date(),
      platform: 'android', // TODO: Detect platform
    };

    await setPremiumStatus(true, purchaseInfo);
    return true;
  } catch (error) {
    console.error('Error simulating premium purchase:', error);
    return false;
  }
};

/**
 * Reset to free version (for testing)
 */
export const resetToFreeVersion = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(PREMIUM_STATUS_KEY);
    await SecureStore.deleteItemAsync(PREMIUM_PURCHASE_KEY);
  } catch (error) {
    console.error('Error resetting to free version:', error);
  }
};

/**
 * Get premium features list for display
 */
export const getPremiumFeaturesList = (): Array<{ title: string; description: string }> => {
  return [
    {
      title: 'Unlimited Password Storage',
      description: 'Save as many passwords as you need without limits'
    },
    {
      title: 'Advanced Search & Filter',
      description: 'Find passwords quickly with powerful search options'
    },
    {
      title: 'Custom Templates',
      description: 'Create your own password generation templates'
    },
    {
      title: 'Export & Import',
      description: 'Backup and restore your password collection'
    },
    {
      title: 'Premium Templates',
      description: 'Access specialized templates for different use cases'
    },
    {
      title: 'Ad-Free Experience',
      description: 'Remove all advertisements from the app'
    },
    {
      title: 'Priority Support',
      description: 'Get faster response to your questions and issues'
    },
  ];
};

/**
 * Get feature comparison for free vs premium
 */
export const getFeatureComparison = () => {
  return {
    free: {
      'Password Generation': true,
      'Basic Copying': true,
      'Strength Analysis': true,
      'Saved Passwords': `${FREE_VERSION_LIMITS.MAX_SAVED_PASSWORDS} passwords`,
      'Search & Filter': 'Basic',
      'Templates': `${FREE_VERSION_LIMITS.MAX_TEMPLATES} templates`,
      'Export/Import': false,
      'Ads': true,
      'Support': 'Community',
    },
    premium: {
      'Password Generation': true,
      'Basic Copying': true,
      'Strength Analysis': true,
      'Saved Passwords': 'Unlimited',
      'Search & Filter': 'Advanced',
      'Templates': 'Unlimited + Custom',
      'Export/Import': true,
      'Ads': false,
      'Support': 'Priority',
    },
  };
};