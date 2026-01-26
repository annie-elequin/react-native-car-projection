const { withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

const withCarPlay = (config, options = {}) => {
  const {
    carAppCategory = 'navigation' // navigation, media, messaging, etc.
  } = options;

  // Configure Info.plist with CarPlay entitlements and configuration
  config = withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;

    // Add CarPlay scene configuration
    if (!infoPlist.UISceneConfigurations) {
      infoPlist.UISceneConfigurations = {};
    }
    
    // CarPlay scenes should be under CPTemplateApplicationSceneSessionRoleApplication
    if (!infoPlist.UISceneConfigurations['CPTemplateApplicationSceneSessionRoleApplication']) {
      infoPlist.UISceneConfigurations['CPTemplateApplicationSceneSessionRoleApplication'] = [];
    }

    // Add CarPlay scene delegate configuration
    const carPlayScene = {
      'UISceneConfigurationName': 'CarPlay',
      'UISceneDelegateClassName': '$(PRODUCT_MODULE_NAME).CarPlaySceneDelegate',
      'UISceneClass': 'CPTemplateApplicationScene'
    };

    const sceneConfigs = infoPlist.UISceneConfigurations['CPTemplateApplicationSceneSessionRoleApplication'];
    const existingCarPlayScene = sceneConfigs.find(
      (scene) => scene?.UISceneConfigurationName === 'CarPlay'
    );

    if (!existingCarPlayScene) {
      sceneConfigs.push(carPlayScene);
    }

    // Add CarPlay app category
    if (!infoPlist['UIApplicationSceneManifest']) {
      infoPlist['UIApplicationSceneManifest'] = {};
    }

    if (!infoPlist['UIApplicationSceneManifest']['UIApplicationSupportsMultipleScenes']) {
      infoPlist['UIApplicationSceneManifest']['UIApplicationSupportsMultipleScenes'] = true;
    }

    // Add CarPlay app transport security if needed
    if (!infoPlist.NSAppTransportSecurity) {
      infoPlist.NSAppTransportSecurity = {
        NSAllowsArbitraryLoads: false
      };
    }

    return config;
  });

  // Configure entitlements for CarPlay
  config = withEntitlementsPlist(config, (config) => {
    const entitlements = config.modResults;

    // Add CarPlay capability
    if (!entitlements['com.apple.developer.carplay']) {
      entitlements['com.apple.developer.carplay'] = true;
    }

    // Add CarPlay app categories based on the app type
    if (!entitlements['com.apple.developer.carplay.app-categories']) {
      entitlements['com.apple.developer.carplay.app-categories'] = [carAppCategory];
    }

    return config;
  });

  return config;
};

module.exports = withCarPlay;
