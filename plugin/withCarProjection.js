const { 
  withAndroidManifest, 
  withProjectBuildGradle, 
  withAppBuildGradle 
} = require('@expo/config-plugins');

const withCarProjection = (config, options = {}) => {
  const {
    carAppCategory = 'media',
    minCarApiLevel = 1,
    customPermissions = [],
    javaVersion = 'VERSION_17' // Default to JVM 17 for modern RN projects
  } = options;

  // Add Android Auto manifest configuration
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config?.modResults;
    // const application = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
    const application = config?.modResults?.manifest?.application?.[0];
    if (!application) {
      throw new Error('Application not found in manifest');
    }
    if (!androidManifest) {
      throw new Error('Android manifest not found');
    }

    // Add Android Auto metadata
    const carAppMetadata = {
      $: {
        'android:name': 'com.google.android.gms.car.application',
        'android:resource': '@xml/automotive_app_desc'
      }
    };

    // Add minCarApiLevel metadata (required by Car App Library)
    const minCarApiLevelMetadata = {
      $: {
        'android:name': 'androidx.car.app.minCarApiLevel',
        'android:value': minCarApiLevel.toString()
      }
    };

    // Add Car App Service
    const carAppService = {
      $: {
        'android:name': 'expo.modules.carprojection.CarProjectionCarAppService',
        'android:exported': 'true',
        'android:label': 'Android Auto Service'
      },
      'intent-filter': [
        {
          action: [
            {
              $: {
                'android:name': 'androidx.car.app.CarAppService'
              }
            }
          ],
          category: [
            {
              $: {
                'android:name': `androidx.car.app.category.${carAppCategory.toUpperCase()}`
              }
            }
          ]
        }
      ]
    };

    // Check if metadata already exists
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    // Check if service already exists
    if (!application.service) {
      application.service = [];
    }

    // Add metadata if it doesn't exist
    const existingMetadata = application['meta-data'].find(
      (meta) => meta.$['android:name'] === 'com.google.android.gms.car.application'
    );

    if (!existingMetadata) {
      application['meta-data'].push(carAppMetadata);
    }

    // Add minCarApiLevel metadata if it doesn't exist
    const existingMinApiMetadata = application['meta-data'].find(
      (meta) => meta.$['android:name'] === 'androidx.car.app.minCarApiLevel'
    );

    if (!existingMinApiMetadata) {
      application['meta-data'].push(minCarApiLevelMetadata);
    }

    // Add service if it doesn't exist
    const existingService = application.service.find(
      (service) => service.$['android:name'] === 'expo.modules.carprojection.CarProjectionCarAppService'
    );

    if (!existingService) {
      application.service.push(carAppService);
    }

    // Add uses-permission for Android Auto
    const permissions = [
      'com.google.android.gms.permission.CAR_APPLICATION',
      ...customPermissions
    ];

    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    permissions.forEach(permission => {
      const existingPermission = androidManifest.manifest['uses-permission'].find(
        (perm) => perm.$['android:name'] === permission
      );

      if (!existingPermission) {
        androidManifest.manifest['uses-permission'].push({
          $: {
            'android:name': permission
          }
        });
      }
    });

    return config;
  });

  // Configure project-level build.gradle to set JVM version
  config = withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Check if javaVersion is already set in buildscript.ext
    const javaVersionPattern = /buildscript\s*\{[\s\S]*?ext\s*\{[\s\S]*?javaVersion\s*=/;
    
    if (!javaVersionPattern.test(buildGradle)) {
      // Add javaVersion to buildscript.ext block
      const buildscriptExtPattern = /(buildscript\s*\{[\s\S]*?ext\s*\{[\s\S]*?)(minSdkVersion|compileSdkVersion|targetSdkVersion)/;
      
      if (buildscriptExtPattern.test(buildGradle)) {
        // Insert javaVersion before existing version properties
        config.modResults.contents = buildGradle.replace(
          buildscriptExtPattern,
          `$1javaVersion = JavaVersion.${javaVersion}\n        $2`
        );
      } else {
        // If no ext block exists, add one
        const buildscriptPattern = /(buildscript\s*\{[\s\S]*?)(dependencies\s*\{|classpath)/;
        if (buildscriptPattern.test(buildGradle)) {
          config.modResults.contents = buildGradle.replace(
            buildscriptPattern,
            `$1    ext {\n        javaVersion = JavaVersion.${javaVersion}\n    }\n    $2`
          );
        }
      }
    }

    return config;
  });

  // Configure app-level build.gradle to ensure JVM compatibility
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Ensure compileOptions uses the correct Java version
    const compileOptionsPattern = /(android\s*\{[\s\S]*?)(compileOptions\s*\{[\s\S]*?sourceCompatibility[\s\S]*?targetCompatibility[\s\S]*?\})/;
    
    if (compileOptionsPattern.test(buildGradle)) {
      // Update existing compileOptions to use rootProject.ext.javaVersion
      const updatedCompileOptions = `
    compileOptions {
        sourceCompatibility rootProject.ext.javaVersion ?: JavaVersion.${javaVersion}
        targetCompatibility rootProject.ext.javaVersion ?: JavaVersion.${javaVersion}
    }`;
      
      config.modResults.contents = buildGradle.replace(
        compileOptionsPattern,
        `$1${updatedCompileOptions}`
      );
    } else {
      // Add compileOptions if they don't exist
      const androidBlockPattern = /(android\s*\{[\s\S]*?)(defaultConfig|buildTypes|signingConfigs|\s*\})/;
      if (androidBlockPattern.test(buildGradle)) {
        const compileOptionsToAdd = `
    compileOptions {
        sourceCompatibility rootProject.ext.javaVersion ?: JavaVersion.${javaVersion}
        targetCompatibility rootProject.ext.javaVersion ?: JavaVersion.${javaVersion}
    }

    `;
        config.modResults.contents = buildGradle.replace(
          androidBlockPattern,
          `$1${compileOptionsToAdd}$2`
        );
      }
    }

    return config;
  });

  return config;
};

// Helper function to create the automotive app descriptor file content
function createAutomotiveAppDescriptor(carAppCategory, minApiLevel, targetApiLevel) {
  return `<?xml version="1.0" encoding="utf-8"?>
<automotiveApp>
  <uses name="template" />
  <library name="androidx.car.app.CarAppLibrary" />
  <api name="androidx.car.app" minApiLevel="${minApiLevel}" targetApiLevel="${targetApiLevel}" />
</automotiveApp>`;
}

module.exports = withCarProjection;
module.exports.createAutomotiveAppDescriptor = createAutomotiveAppDescriptor;
