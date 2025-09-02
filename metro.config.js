const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure resolver alias to replace react-native-google-mobile-ads globally
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  'react-native-google-mobile-ads': path.resolve(__dirname, 'src/utils/web-mocks/google-mobile-ads.js'),
};

module.exports = config;