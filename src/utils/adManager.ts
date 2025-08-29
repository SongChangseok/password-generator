/**
 * Ad Manager for SecurePass Generator
 * Handles banner and interstitial ads with user-friendly policies
 */

import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
  TestIds,
  MobileAds,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  trackBannerAdDisplayed,
  trackInterstitialAdDisplayed,
  analytics,
} from './analytics';

// Test IDs for development
const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : 'ca-app-pub-3940256099942544/6300978111'; // Replace with real ID

const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-3940256099942544/1033173712'; // Replace with real ID

// Storage keys
const LAST_INTERSTITIAL_SHOWN = 'lastInterstitialShown';
const INTERSTITIAL_COUNT = 'interstitialCount';
const AD_FREE_PURCHASED = 'adFreePurchased';

// Configuration - Non-intrusive ad policy
const AD_CONFIG = {
  // Show interstitial ads maximum 5 times per month
  MAX_INTERSTITIALS_PER_MONTH: 5,
  // Minimum time between interstitial ads (24 hours)
  MIN_INTERSTITIAL_INTERVAL: 24 * 60 * 60 * 1000,
  // Show interstitial on every 10th app launch
  INTERSTITIAL_FREQUENCY: 10,
};

class AdManager {
  private interstitialAd: InterstitialAd | null = null;
  private isAdFree: boolean = false;

  constructor() {
    this.initializeAds();
  }

  async initializeAds(): Promise<void> {
    try {
      // Initialize Mobile Ads SDK
      await MobileAds().initialize();

      // Initialize analytics
      await analytics.initialize();

      // Check if user purchased ad-free version
      this.isAdFree = await this.checkAdFreePurchase();

      // Load interstitial ad if not ad-free
      if (!this.isAdFree) {
        this.loadInterstitialAd();
      }
    } catch (error) {
      console.warn('Failed to initialize ads:', error);
    }
  }

  private async checkAdFreePurchase(): Promise<boolean> {
    try {
      const purchased = await AsyncStorage.getItem(AD_FREE_PURCHASED);
      return purchased === 'true';
    } catch (error) {
      console.warn('Failed to check ad-free status:', error);
      return false;
    }
  }

  async setAdFreePurchased(purchased: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(AD_FREE_PURCHASED, purchased.toString());
      this.isAdFree = purchased;
    } catch (error) {
      console.warn('Failed to save ad-free status:', error);
    }
  }

  private loadInterstitialAd(): void {
    if (this.isAdFree) return;

    try {
      // For development, we'll mock the interstitial ad functionality
      // In production, you would use the actual InterstitialAd API
      const mockInterstitial = {
        load: () => console.log('Mock interstitial ad loaded'),
        show: () => Promise.resolve(),
        addAdEventListener: (type: string, callback: Function) => {
          if (type === AdEventType.LOADED) {
            setTimeout(callback, 100);
          }
        },
      } as any;

      this.interstitialAd = mockInterstitial;
      mockInterstitial.load();
    } catch (error) {
      console.warn('Failed to load interstitial ad:', error);
      this.interstitialAd = null;
    }
  }

  async shouldShowInterstitialAd(): Promise<boolean> {
    if (this.isAdFree) return false;

    try {
      // Check last shown time
      const lastShown = await AsyncStorage.getItem(LAST_INTERSTITIAL_SHOWN);
      const lastShownTime = lastShown ? parseInt(lastShown, 10) : 0;
      const now = Date.now();

      // Don't show if shown recently
      if (now - lastShownTime < AD_CONFIG.MIN_INTERSTITIAL_INTERVAL) {
        return false;
      }

      // Check monthly limit
      const monthlyCount = await this.getMonthlyInterstitialCount();
      if (monthlyCount >= AD_CONFIG.MAX_INTERSTITIALS_PER_MONTH) {
        return false;
      }

      // Check frequency based on app launches
      const launchCount = await this.getAppLaunchCount();
      return launchCount % AD_CONFIG.INTERSTITIAL_FREQUENCY === 0;
    } catch (error) {
      console.warn('Failed to check interstitial ad eligibility:', error);
      return false;
    }
  }

  async showInterstitialAd(): Promise<void> {
    if (this.isAdFree || !this.interstitialAd) return;

    try {
      const shouldShow = await this.shouldShowInterstitialAd();
      if (!shouldShow) return;

      await this.interstitialAd.show();

      // Track analytics
      await trackInterstitialAdDisplayed();

      // Update tracking
      await AsyncStorage.setItem(
        LAST_INTERSTITIAL_SHOWN,
        Date.now().toString()
      );
      await this.incrementMonthlyInterstitialCount();

      // Reload for next time
      this.loadInterstitialAd();
    } catch (error) {
      console.warn('Failed to show interstitial ad:', error);
    }
  }

  private async getMonthlyInterstitialCount(): Promise<number> {
    try {
      const currentMonth = new Date().getMonth();
      const countData = await AsyncStorage.getItem(INTERSTITIAL_COUNT);

      if (!countData) return 0;

      const { month, count } = JSON.parse(countData);

      // Reset count if new month
      if (month !== currentMonth) {
        await AsyncStorage.setItem(
          INTERSTITIAL_COUNT,
          JSON.stringify({
            month: currentMonth,
            count: 0,
          })
        );
        return 0;
      }

      return count;
    } catch (error) {
      console.warn('Failed to get monthly interstitial count:', error);
      return 0;
    }
  }

  private async incrementMonthlyInterstitialCount(): Promise<void> {
    try {
      const currentMonth = new Date().getMonth();
      const currentCount = await this.getMonthlyInterstitialCount();

      await AsyncStorage.setItem(
        INTERSTITIAL_COUNT,
        JSON.stringify({
          month: currentMonth,
          count: currentCount + 1,
        })
      );
    } catch (error) {
      console.warn('Failed to increment monthly interstitial count:', error);
    }
  }

  private async getAppLaunchCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem('appLaunchCount');
      return count ? parseInt(count, 10) : 1;
    } catch (error) {
      console.warn('Failed to get app launch count:', error);
      return 1;
    }
  }

  async incrementAppLaunchCount(): Promise<void> {
    try {
      const current = await this.getAppLaunchCount();
      await AsyncStorage.setItem('appLaunchCount', (current + 1).toString());
    } catch (error) {
      console.warn('Failed to increment app launch count:', error);
    }
  }

  shouldShowBannerAd(): boolean {
    return !this.isAdFree;
  }

  getBannerAdUnitId(): string {
    return BANNER_AD_UNIT_ID;
  }

  getInterstitialAdUnitId(): string {
    return INTERSTITIAL_AD_UNIT_ID;
  }
}

// Singleton instance
export const adManager = new AdManager();

// Export components and utilities
export { BannerAd, BannerAdSize, AdEventType };
export default AdManager;
