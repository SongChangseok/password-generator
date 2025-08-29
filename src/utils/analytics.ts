/**
 * Analytics and Revenue Tracking for SecurePass Generator
 * Tracks ad performance and user engagement metrics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Analytics events
export enum AnalyticsEvent {
  APP_LAUNCHED = 'app_launched',
  PASSWORD_GENERATED = 'password_generated',
  PASSWORD_COPIED = 'password_copied',
  BANNER_AD_DISPLAYED = 'banner_ad_displayed',
  BANNER_AD_CLICKED = 'banner_ad_clicked',
  INTERSTITIAL_AD_DISPLAYED = 'interstitial_ad_displayed',
  INTERSTITIAL_AD_CLICKED = 'interstitial_ad_clicked',
  PURCHASE_ATTEMPTED = 'purchase_attempted',
  PURCHASE_COMPLETED = 'purchase_completed',
  SETTINGS_OPENED = 'settings_opened',
  SECURITY_FEATURE_USED = 'security_feature_used',
}

// Storage keys
const ANALYTICS_DATA_KEY = 'analytics_data';
const SESSION_COUNT_KEY = 'session_count';
const LAST_ANALYTICS_SYNC = 'last_analytics_sync';

interface AnalyticsData {
  events: {
    event: AnalyticsEvent;
    timestamp: number;
    properties?: Record<string, any>;
  }[];
  sessionCount: number;
  appInstallDate: number;
  lastSyncDate?: number;
}

interface AdRevenue {
  bannerImpressions: number;
  bannerClicks: number;
  interstitialShown: number;
  interstitialClicks: number;
  estimatedRevenue: number; // in cents
}

class Analytics {
  private data: AnalyticsData | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_DATA_KEY);

      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        // First time user
        this.data = {
          events: [],
          sessionCount: 0,
          appInstallDate: Date.now(),
        };
        await this.save();
      }

      this.isInitialized = true;
      await this.incrementSessionCount();
    } catch (error) {
      console.warn('Failed to initialize analytics:', error);
      this.data = {
        events: [],
        sessionCount: 1,
        appInstallDate: Date.now(),
      };
    }
  }

  async trackEvent(
    event: AnalyticsEvent,
    properties?: Record<string, any>
  ): Promise<void> {
    if (!this.data) return;

    try {
      this.data.events.push({
        event,
        timestamp: Date.now(),
        properties: {
          ...properties,
          platform: Platform.OS,
          version: '1.3.0',
        },
      });

      // Keep only last 1000 events to manage storage
      if (this.data.events.length > 1000) {
        this.data.events = this.data.events.slice(-1000);
      }

      await this.save();
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  }

  async getAdRevenueSummary(): Promise<AdRevenue> {
    if (!this.data) {
      return {
        bannerImpressions: 0,
        bannerClicks: 0,
        interstitialShown: 0,
        interstitialClicks: 0,
        estimatedRevenue: 0,
      };
    }

    const events = this.data.events;
    const bannerImpressions = events.filter(
      (e) => e.event === AnalyticsEvent.BANNER_AD_DISPLAYED
    ).length;
    const bannerClicks = events.filter(
      (e) => e.event === AnalyticsEvent.BANNER_AD_CLICKED
    ).length;
    const interstitialShown = events.filter(
      (e) => e.event === AnalyticsEvent.INTERSTITIAL_AD_DISPLAYED
    ).length;
    const interstitialClicks = events.filter(
      (e) => e.event === AnalyticsEvent.INTERSTITIAL_AD_CLICKED
    ).length;

    // Estimated revenue calculation (rough estimates)
    const estimatedRevenue =
      bannerImpressions * 0.5 + // $0.005 per banner impression
      bannerClicks * 15 + // $0.15 per banner click
      interstitialShown * 2 + // $0.02 per interstitial impression
      interstitialClicks * 50; // $0.50 per interstitial click

    return {
      bannerImpressions,
      bannerClicks,
      interstitialShown,
      interstitialClicks,
      estimatedRevenue: Math.round(estimatedRevenue),
    };
  }

  async getUsageStats(): Promise<{
    sessionCount: number;
    passwordsGenerated: number;
    passwordsCopied: number;
    daysSinceInstall: number;
  }> {
    if (!this.data) {
      return {
        sessionCount: 0,
        passwordsGenerated: 0,
        passwordsCopied: 0,
        daysSinceInstall: 0,
      };
    }

    const events = this.data.events;
    const passwordsGenerated = events.filter(
      (e) => e.event === AnalyticsEvent.PASSWORD_GENERATED
    ).length;
    const passwordsCopied = events.filter(
      (e) => e.event === AnalyticsEvent.PASSWORD_COPIED
    ).length;
    const daysSinceInstall = Math.floor(
      (Date.now() - this.data.appInstallDate) / (1000 * 60 * 60 * 24)
    );

    return {
      sessionCount: this.data.sessionCount,
      passwordsGenerated,
      passwordsCopied,
      daysSinceInstall,
    };
  }

  private async incrementSessionCount(): Promise<void> {
    if (!this.data) return;

    this.data.sessionCount += 1;
    await this.save();
    await this.trackEvent(AnalyticsEvent.APP_LAUNCHED);
  }

  private async save(): Promise<void> {
    if (!this.data) return;

    try {
      await AsyncStorage.setItem(ANALYTICS_DATA_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.warn('Failed to save analytics data:', error);
    }
  }

  async exportData(): Promise<string> {
    // For GDPR compliance - allow users to export their data
    if (!this.data) return '{}';

    const exportData = {
      ...this.data,
      // Remove sensitive data if any
      events: this.data.events.map((event) => ({
        ...event,
        // Keep only non-sensitive properties
        properties: event.properties
          ? {
              platform: event.properties.platform,
              version: event.properties.version,
            }
          : undefined,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  async clearData(): Promise<void> {
    // For GDPR compliance - allow users to delete their data
    try {
      await AsyncStorage.removeItem(ANALYTICS_DATA_KEY);
      this.data = null;
      this.isInitialized = false;
    } catch (error) {
      console.warn('Failed to clear analytics data:', error);
    }
  }
}

// Singleton instance
export const analytics = new Analytics();

// Convenience functions
export const trackPasswordGenerated = (options: Record<string, any>) =>
  analytics.trackEvent(AnalyticsEvent.PASSWORD_GENERATED, options);

export const trackPasswordCopied = () =>
  analytics.trackEvent(AnalyticsEvent.PASSWORD_COPIED);

export const trackBannerAdDisplayed = () =>
  analytics.trackEvent(AnalyticsEvent.BANNER_AD_DISPLAYED);

export const trackBannerAdClicked = () =>
  analytics.trackEvent(AnalyticsEvent.BANNER_AD_CLICKED);

export const trackInterstitialAdDisplayed = () =>
  analytics.trackEvent(AnalyticsEvent.INTERSTITIAL_AD_DISPLAYED);

export const trackInterstitialAdClicked = () =>
  analytics.trackEvent(AnalyticsEvent.INTERSTITIAL_AD_CLICKED);

export const trackPurchaseAttempted = (productId: string) =>
  analytics.trackEvent(AnalyticsEvent.PURCHASE_ATTEMPTED, { productId });

export const trackPurchaseCompleted = (productId: string, price: string) =>
  analytics.trackEvent(AnalyticsEvent.PURCHASE_COMPLETED, { productId, price });

export default Analytics;
