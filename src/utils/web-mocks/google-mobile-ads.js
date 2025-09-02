/**
 * Web Mock for react-native-google-mobile-ads
 * Provides empty implementations for web compatibility
 */

// Mock components
const BannerAd = () => null;

// Mock constants
const BannerAdSize = {
  ANCHORED_ADAPTIVE_BANNER: 'adaptive',
  BANNER: 'banner',
  FULL_BANNER: 'full_banner',
  LARGE_BANNER: 'large_banner',
  LEADERBOARD: 'leaderboard',
  MEDIUM_RECTANGLE: 'medium_rectangle'
};

const AdEventType = {
  LOADED: 'loaded',
  CLICKED: 'clicked',
  CLOSED: 'closed',
  ERROR: 'error'
};

const TestIds = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712'
};

// Mock InterstitialAd class
const InterstitialAd = {
  createForAdRequest: (adUnitId, requestOptions) => ({
    load: () => Promise.resolve(),
    show: () => Promise.resolve(),
    addAdEventListener: (type, callback) => {
      if (type === 'loaded' || type === AdEventType.LOADED) {
        setTimeout(callback, 100);
      }
    }
  })
};

// Mock MobileAds
const MobileAds = () => ({
  initialize: () => Promise.resolve()
});

// Named exports
module.exports = {
  BannerAd,
  BannerAdSize,
  AdEventType,
  TestIds,
  InterstitialAd,
  MobileAds
};

// Default export
module.exports.default = {
  BannerAd,
  BannerAdSize,
  AdEventType,
  TestIds,
  InterstitialAd,
  MobileAds
};