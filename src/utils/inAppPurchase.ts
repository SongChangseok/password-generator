/**
 * In-App Purchase Manager for Ad-Free Version
 * Handles premium upgrade to remove all advertisements
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

// Product IDs for in-app purchases
const PRODUCT_IDS = {
  AD_FREE: Platform.select({
    ios: 'com.securepass.generator.adfree',
    android: 'com_securepass_generator_adfree',
    default: 'ad_free_premium',
  }),
} as const;

// Storage keys
const AD_FREE_PURCHASED_KEY = 'adFreePurchased';
const PURCHASE_DATE_KEY = 'adFreePurchaseDate';

export interface PurchaseResult {
  success: boolean;
  error?: string;
  productId?: string;
  transactionId?: string;
}

class InAppPurchaseManager {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // For Expo managed workflow, we'll simulate purchases for now
      // In production, you would use expo-in-app-purchases or react-native-purchases
      console.log('IAP Manager initialized');
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize IAP:', error);
    }
  }

  async isAdFreePurchased(): Promise<boolean> {
    try {
      const purchased = await AsyncStorage.getItem(AD_FREE_PURCHASED_KEY);
      return purchased === 'true';
    } catch (error) {
      console.warn('Failed to check ad-free purchase status:', error);
      return false;
    }
  }

  async getPurchaseDate(): Promise<Date | null> {
    try {
      const dateString = await AsyncStorage.getItem(PURCHASE_DATE_KEY);
      return dateString ? new Date(dateString) : null;
    } catch (error) {
      console.warn('Failed to get purchase date:', error);
      return null;
    }
  }

  async purchaseAdFree(): Promise<PurchaseResult> {
    try {
      await this.initialize();

      // Show confirmation dialog
      return new Promise((resolve) => {
        Alert.alert(
          'Remove Ads - $1.99',
          'Remove all advertisements and support SecurePass Generator development.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () =>
                resolve({ success: false, error: 'User cancelled' }),
            },
            {
              text: 'Purchase',
              onPress: async () => {
                try {
                  // In a real implementation, you would:
                  // 1. Show native purchase dialog
                  // 2. Process payment through App Store/Google Play
                  // 3. Validate receipt server-side
                  // 4. Grant premium features

                  // For now, we'll simulate a successful purchase
                  if (Platform.OS === 'web') {
                    Alert.alert(
                      'Demo Mode',
                      'In-app purchases are not available in web version. This would redirect to premium signup.',
                      [{ text: 'OK' }]
                    );
                    resolve({ success: false, error: 'Web not supported' });
                    return;
                  }

                  await this.setAdFreePurchased(true);

                  Alert.alert(
                    'Purchase Successful!',
                    'Thank you for supporting SecurePass Generator. All ads have been removed.',
                    [{ text: 'OK' }]
                  );

                  resolve({
                    success: true,
                    productId: PRODUCT_IDS.AD_FREE,
                    transactionId: `demo_${Date.now()}`,
                  });
                } catch (error) {
                  console.error('Purchase failed:', error);
                  resolve({
                    success: false,
                    error:
                      error instanceof Error ? error.message : 'Unknown error',
                  });
                }
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('Purchase initiation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    try {
      // In a real implementation, you would query the app store
      // for previous purchases and restore them

      const isAlreadyPurchased = await this.isAdFreePurchased();

      if (isAlreadyPurchased) {
        Alert.alert(
          'Already Purchased',
          'Ad-free version is already active on this device.',
          [{ text: 'OK' }]
        );
        return { success: true, productId: PRODUCT_IDS.AD_FREE };
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous ad-free purchases found for this device.',
          [{ text: 'OK' }]
        );
        return { success: false, error: 'No purchases found' };
      }
    } catch (error) {
      console.error('Restore failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async setAdFreePurchased(purchased: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(AD_FREE_PURCHASED_KEY, purchased.toString());
      if (purchased) {
        await AsyncStorage.setItem(PURCHASE_DATE_KEY, new Date().toISOString());
      }
    } catch (error) {
      console.warn('Failed to save purchase status:', error);
    }
  }

  async resetPurchases(): Promise<void> {
    // For testing purposes only
    try {
      await AsyncStorage.removeItem(AD_FREE_PURCHASED_KEY);
      await AsyncStorage.removeItem(PURCHASE_DATE_KEY);
      console.log('Purchase data reset');
    } catch (error) {
      console.warn('Failed to reset purchases:', error);
    }
  }

  getProductId(): string {
    return PRODUCT_IDS.AD_FREE;
  }

  getPrice(): string {
    return '$1.99';
  }
}

// Singleton instance
export const iapManager = new InAppPurchaseManager();
export default InAppPurchaseManager;
