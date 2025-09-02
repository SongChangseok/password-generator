/**
 * Banner Ad Component for SecurePass Generator
 * Non-intrusive banner ad displayed at bottom of main screen
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
// Mock Google Mobile Ads components
const BannerAd = () => null;

const BannerAdSize = {
  ANCHORED_ADAPTIVE_BANNER: 'adaptive',
  BANNER: 'banner'
};

const AdEventType = {
  LOADED: 'loaded',
  CLICKED: 'clicked'
};
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

  useEffect(() => {
    setShouldShow(adManager.shouldShowBannerAd());
  }, []);

  // Hide ad during password generation if requested
  if (!shouldShow || (hideWhenGenerating && isGenerating)) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd />
      <View style={styles.placeholder} />
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
