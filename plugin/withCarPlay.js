const { withInfoPlist, withEntitlements } = require('@expo/config-plugins');

const withCarPlay = (config, options = {}) => {
  const {
    carAppCategory = 'navigation', // navigation, media, messaging, etc.
    requiresCarPlayApp = true
  } = options;

  // Configure Info.plist with CarPlay entitlements and configuration
  config = withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;

    // Add CarPlay scene configuration
    if (!infoPlist.UISceneConfigurations) {
      infoPlist.UISceneConfigurations = {};
    }
    
    if (!infoPlist.UISceneConfigurations['UIWindowSceneSessionRoleApplication']) {
      infoPlist.UISceneConfigurations['UIWindowSceneSessionRoleApplication'] = [];
    }

    // Add CarPlay scene delegate configuration
    const carPlayScene = {
      'UISceneConfigurationName': 'CarPlay',
      'UISceneDelegateClassName': '$(PRODUCT_MODULE_NAME).CarPlaySceneDelegate',
      'UISceneClass': 'CPTemplateApplicationScene'
    };

    const sceneConfigs = infoPlist.UISceneConfigurations['UIWindowSceneSessionRoleApplication'];
    const existingCarPlayScene = sceneConfigs.find(
      (scene: any) => scene?.UISceneConfigurationName === 'CarPlay'
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
  config = withEntitlements(config, (config) => {
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
