/**
 * Banner Ad Component for SecurePass Generator
 * Non-intrusive banner ad displayed at bottom of main screen
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { adManager } from '@/utils/adManager';
import { Colors } from '@/utils/colors';
import { trackBannerAdDisplayed } from '@/utils/analytics';

interface BannerAdComponentProps {
  style?: any;
  hideWhenGenerating?: boolean;
  isGenerating?: boolean;
}

export const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  style,
  hideWhenGenerating = false,
  isGenerating = false,
}) => {
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setShouldShow(adManager.shouldShowBannerAd());
  }, []);

  // Hide ad during password generation if requested
  if (!shouldShow || (hideWhenGenerating && isGenerating)) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adManager.getBannerAdUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
          keywords: ['security', 'password', 'privacy', 'tools'],
        }}
        onAdLoaded={() => {
          setIsLoaded(true);
          trackBannerAdDisplayed();
        }}
        onAdFailedToLoad={(error) => {
          console.warn('Banner ad failed to load:', error);
          setIsLoaded(false);
        }}
      />
      {!isLoaded && <View style={styles.placeholder} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    ...Platform.select({
      web: {
        maxHeight: 100,
      },
    }),
  },
  placeholder: {
    height: 50,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    marginHorizontal: 16,
    opacity: 0.3,
  },
});

export default BannerAdComponent;
