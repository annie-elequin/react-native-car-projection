/**
 * Expo config plugin to enable CarPlay support for iOS.
 * 
 * For the media-only approach, this plugin simply adds the CarPlay audio entitlement.
 * react-native-track-player automatically provides Now Playing information to CarPlay
 * via MPNowPlayingInfoCenter - no custom scene delegates needed.
 * 
 * Note: The com.apple.developer.carplay-audio entitlement requires Apple approval
 * for production/TestFlight builds. It works in the simulator without approval.
 */

const { withEntitlementsPlist } = require('@expo/config-plugins');

/**
 * Add CarPlay audio entitlement
 * This allows the app to appear in CarPlay's audio section and display
 * Now Playing information when audio is playing.
 */
function withCarPlayEntitlement(config, options = {}) {
  return withEntitlementsPlist(config, (config) => {
    // Add the CarPlay audio entitlement
    config.modResults['com.apple.developer.carplay-audio'] = true;
    return config;
  });
}

/**
 * Main CarPlay config plugin
 * For media-only apps, we only need the entitlement - TrackPlayer handles
 * the MPNowPlayingInfoCenter integration automatically.
 */
function withCarPlay(config, options = {}) {
  // Only apply if carPlayEnabled is true (or not explicitly set to false)
  if (options.carPlayEnabled === false) {
    return config;
  }
  
  config = withCarPlayEntitlement(config, options);
  
  return config;
}

module.exports = withCarPlay;
