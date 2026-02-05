/**
 * Expo config plugin to enable CarPlay support for iOS.
 * 
 * This plugin provides TWO modes:
 * 
 * 1. MEDIA-ONLY MODE (default, carPlayTemplates: false)
 *    - Adds CarPlay audio entitlement
 *    - Uses react-native-track-player's MPNowPlayingInfoCenter
 *    - App appears in CarPlay "Now Playing" when audio plays
 *    - No custom CarPlay UI
 * 
 * 2. FULL TEMPLATE MODE (carPlayTemplates: true)
 *    - Adds CarPlay audio entitlement
 *    - Configures iOS Scenes (UIApplicationSceneManifest)
 *    - Adds CarPlaySceneDelegate for custom CarPlay UI
 *    - Enables Spotify-like browsable media interface
 *    - ⚠️ EXPERIMENTAL - May have issues with Expo
 */

const {
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Add CarPlay audio entitlement
 */
function withCarPlayEntitlement(config, options = {}) {
  return withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.carplay-audio'] = true;
    return config;
  });
}

/**
 * Add UIApplicationSceneManifest to Info.plist for CarPlay Scenes
 */
function withCarPlaySceneManifest(config, options = {}) {
  return withInfoPlist(config, (config) => {
    const projectName = config.modRequest.projectName;
    
    // Create the Scene configuration
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        // CarPlay Scene
        CPTemplateApplicationSceneSessionRoleApplication: [
          {
            UISceneClassName: 'CPTemplateApplicationScene',
            UISceneConfigurationName: 'CarPlay',
            UISceneDelegateClassName: `${projectName}.CarPlaySceneDelegate`,
          },
        ],
        // Main App Scene (Phone)
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneClassName: 'UIWindowScene',
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: `${projectName}.MainSceneDelegate`,
          },
        ],
      },
    };
    
    return config;
  });
}

/**
 * Copy CarPlay Swift files to the iOS project
 */
function withCarPlaySwiftFiles(config, options = {}) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const projectName = config.modRequest.projectName;
      const iosProjectPath = path.join(projectRoot, 'ios', projectName);
      
      // Path to our Swift template files
      const pluginRoot = path.dirname(__dirname);
      const iosTemplatesPath = path.join(pluginRoot, 'ios');
      
      // Files to copy
      const filesToCopy = [
        'CarPlaySceneDelegate.swift',
        'MainSceneDelegate.swift',
      ];
      
      for (const fileName of filesToCopy) {
        const sourcePath = path.join(iosTemplatesPath, fileName);
        const destPath = path.join(iosProjectPath, fileName);
        
        if (fs.existsSync(sourcePath)) {
          let content = fs.readFileSync(sourcePath, 'utf8');
          
          // Replace placeholder imports if needed
          // The MainSceneDelegate needs to be updated for Expo
          if (fileName === 'MainSceneDelegate.swift') {
            content = generateExpoCompatibleMainSceneDelegate(projectName);
          }
          
          fs.writeFileSync(destPath, content);
          console.log(`[withCarPlay] Copied ${fileName} to ${destPath}`);
        } else {
          console.warn(`[withCarPlay] Warning: ${sourcePath} not found`);
        }
      }
      
      return config;
    },
  ]);
}

/**
 * Generate an Expo-compatible MainSceneDelegate
 */
function generateExpoCompatibleMainSceneDelegate(projectName) {
  return `import UIKit
import React
import Expo
import ExpoModulesCore

/**
 * MainSceneDelegate - Handles the main phone display lifecycle
 * 
 * This SceneDelegate integrates with Expo's React Native setup using
 * ExpoReactRootViewFactory to properly share the bridge with Expo.
 */
@available(iOS 14.0, *)
class MainSceneDelegate: UIResponder, UIWindowSceneDelegate {
    
    var window: UIWindow?
    
    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        print("[MainScene] Scene will connect")
        
        guard let windowScene = scene as? UIWindowScene else { return }
        
        // Create the window
        let window = UIWindow(windowScene: windowScene)
        self.window = window
        
        // Use Expo's ExpoReactRootViewFactory to create the root view
        // This properly integrates with Expo's bridge management
        let rootViewFactory = ExpoReactRootViewFactory()
        
        let rootView = rootViewFactory.view(
            withModuleName: "main",
            initialProperties: nil,
            launchOptions: nil
        )
        
        let rootViewController = UIViewController()
        rootViewController.view = rootView
        
        window.rootViewController = rootViewController
        window.makeKeyAndVisible()
        
        print("[MainScene] React Native view connected successfully via Expo")
    }
    
    func sceneDidDisconnect(_ scene: UIScene) {
        print("[MainScene] Scene did disconnect")
    }
    
    func sceneDidBecomeActive(_ scene: UIScene) {
        print("[MainScene] Scene did become active")
    }
    
    func sceneWillResignActive(_ scene: UIScene) {
        print("[MainScene] Scene will resign active")
    }
    
    func sceneWillEnterForeground(_ scene: UIScene) {
        print("[MainScene] Scene will enter foreground")
    }
    
    func sceneDidEnterBackground(_ scene: UIScene) {
        print("[MainScene] Scene did enter background")
    }
}
`;
}

/**
 * Add Swift files to the Xcode project
 */
function withCarPlayXcodeProject(config, options = {}) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;
    
    // Find the main group
    const mainGroup = project.getFirstProject().firstProject.mainGroup;
    const projectGroup = project.findPBXGroupKey({ name: projectName });
    
    if (!projectGroup) {
      console.warn(`[withCarPlay] Could not find project group: ${projectName}`);
      return config;
    }
    
    // Swift files to add
    const swiftFiles = [
      'CarPlaySceneDelegate.swift',
      'MainSceneDelegate.swift',
    ];
    
    for (const fileName of swiftFiles) {
      try {
        // Check if file is already in project
        const existingFile = project.hasFile(fileName);
        if (!existingFile) {
          project.addSourceFile(
            `${projectName}/${fileName}`,
            { target: project.getFirstTarget().uuid },
            projectGroup
          );
          console.log(`[withCarPlay] Added ${fileName} to Xcode project`);
        }
      } catch (error) {
        console.warn(`[withCarPlay] Could not add ${fileName}: ${error.message}`);
      }
    }
    
    return config;
  });
}

/**
 * Main CarPlay config plugin
 * 
 * Options:
 * - carPlayEnabled: boolean (default: true) - Enable CarPlay support
 * - carPlayTemplates: boolean (default: false) - Enable full CarPlay templates (experimental)
 */
function withCarPlay(config, options = {}) {
  // Skip if explicitly disabled
  if (options.carPlayEnabled === false) {
    return config;
  }
  
  // Always add the entitlement
  config = withCarPlayEntitlement(config, options);
  
  // If full templates are enabled (experimental)
  if (options.carPlayTemplates === true) {
    console.log('[withCarPlay] ⚠️  Enabling experimental CarPlay template support');
    console.log('[withCarPlay] This adds iOS Scenes which may affect app behavior');
    
    config = withCarPlaySceneManifest(config, options);
    config = withCarPlaySwiftFiles(config, options);
    config = withCarPlayXcodeProject(config, options);
  }
  
  return config;
}

module.exports = withCarPlay;
