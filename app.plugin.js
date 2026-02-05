const withAndroidAuto = require('./plugin/withAndroidAuto.js');
const withCarPlay = require('./plugin/withCarPlay.js');

/**
 * Combined Expo config plugin for react-native-car-projection
 * Applies both Android Auto and CarPlay configurations based on options.
 * 
 * Options:
 * - carPlayEnabled: boolean (default: true) - Enable CarPlay for iOS
 * - carAppCategory: string - Android Auto app category
 * - minCarApiLevel: number - Minimum Android Auto API level
 * - targetCarApiLevel: number - Target Android Auto API level
 * - mediaOnly: boolean - Use media-only mode for Android Auto
 */
module.exports = function withCarProjection(config, options = {}) {
  // Apply Android Auto config (Android)
  config = withAndroidAuto(config, options);
  
  // Apply CarPlay config (iOS) - enabled by default unless explicitly disabled
  config = withCarPlay(config, options);
  
  return config;
};
