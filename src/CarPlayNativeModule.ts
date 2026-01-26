import { requireOptionalNativeModule } from 'expo-modules-core';

// Get the native module using the recommended API
// requireOptionalNativeModule returns null if module isn't available (instead of throwing)
const CarPlayNativeModule = requireOptionalNativeModule<{
  registerScreen: (config: any) => Promise<void>;
  startSession: () => Promise<void>;
  navigateToScreen: (screenName: string, params?: any) => Promise<void>;
  updateScreen: (screenName: string, template: any) => Promise<void>;
  getCurrentScreen: () => Promise<string | null>;
  isConnected: () => Promise<boolean>;
  finishSession: () => Promise<void>;
  popScreen: () => Promise<void>;
  popToRoot: () => Promise<void>;
  addListener: (eventName: string, listener: (...args: any[]) => void) => { remove: () => void };
}>('CarPlay');

// Debug: Log module availability
if (__DEV__) {
  if (CarPlayNativeModule) {
    console.log('[CarPlay] Native module loaded successfully');
  } else {
    console.warn('[CarPlay] Native module not found. This usually means:');
    console.warn('  1. The app needs to be built and run with: npx expo run:ios');
    console.warn('  2. Do NOT use "expo start" + QR code (Expo Go doesn\'t support custom native modules)');
    console.warn('  3. The Expo config plugin may not have been applied properly');
    console.warn('  4. Make sure you\'re running a development build, not Expo Go');
    console.warn('  5. CarPlay requires a physical device or CarPlay simulator');
  }
}

// Check if native module is available
const isNativeModuleAvailable = CarPlayNativeModule != null;

// Create a wrapper that includes both native functions and stub event methods
const CarPlayNativeModuleWrapper = {
  // Native module functions with fallbacks if module isn't available
  registerScreen: isNativeModuleAvailable 
    ? (config: any) => {
        console.log('[CarPlayNativeModule] registerScreen called');
        console.log('[CarPlayNativeModule] Screen config:', JSON.stringify(config, null, 2));
        return CarPlayNativeModule!.registerScreen(config).then(() => {
          console.log('[CarPlayNativeModule] registerScreen completed');
        }).catch((error) => {
          console.error('[CarPlayNativeModule] registerScreen error:', error);
          throw error;
        });
      }
    : () => {
        console.error('[CarPlayNativeModule] registerScreen called but native module is not available');
        return Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.'));
      },
  
  startSession: isNativeModuleAvailable
    ? () => {
        console.log('[CarPlayNativeModule] startSession called');
        return CarPlayNativeModule!.startSession().then(() => {
          console.log('[CarPlayNativeModule] startSession completed');
        }).catch((error) => {
          console.error('[CarPlayNativeModule] startSession error:', error);
          throw error;
        });
      }
    : () => {
        console.error('[CarPlayNativeModule] startSession called but native module is not available');
        return Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.'));
      },
  
  navigateToScreen: isNativeModuleAvailable
    ? (screenName: string, params?: any) => {
        console.log(`[CarPlayNativeModule] navigateToScreen called: screenName=${screenName}, params=`, params);
        return CarPlayNativeModule!.navigateToScreen(screenName, params).then(() => {
          console.log(`[CarPlayNativeModule] navigateToScreen completed: ${screenName}`);
        }).catch((error) => {
          console.error(`[CarPlayNativeModule] navigateToScreen error for ${screenName}:`, error);
          throw error;
        });
      }
    : () => {
        console.error('[CarPlayNativeModule] navigateToScreen called but native module is not available');
        return Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.'));
      },
  
  updateScreen: isNativeModuleAvailable
    ? (screenName: string, template: any) => {
        console.log(`[CarPlayNativeModule] updateScreen called: screenName=${screenName}`);
        return CarPlayNativeModule!.updateScreen(screenName, template).then(() => {
          console.log(`[CarPlayNativeModule] updateScreen completed: ${screenName}`);
        }).catch((error) => {
          console.error(`[CarPlayNativeModule] updateScreen error for ${screenName}:`, error);
          throw error;
        });
      }
    : () => {
        console.error('[CarPlayNativeModule] updateScreen called but native module is not available');
        return Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.'));
      },
  
  getCurrentScreen: isNativeModuleAvailable
    ? () => {
        console.log('[CarPlayNativeModule] getCurrentScreen called');
        return CarPlayNativeModule!.getCurrentScreen().then((screen) => {
          console.log(`[CarPlayNativeModule] getCurrentScreen result: ${screen}`);
          return screen;
        }).catch((error) => {
          console.error('[CarPlayNativeModule] getCurrentScreen error:', error);
          throw error;
        });
      }
    : () => {
        console.warn('[CarPlayNativeModule] getCurrentScreen called but native module is not available');
        return Promise.resolve(null);
      },
  
  isConnected: isNativeModuleAvailable
    ? () => {
        console.log('[CarPlayNativeModule] isConnected called');
        return CarPlayNativeModule!.isConnected().then((connected) => {
          console.log(`[CarPlayNativeModule] isConnected result: ${connected}`);
          return connected;
        }).catch((error) => {
          console.error('[CarPlayNativeModule] isConnected error:', error);
          throw error;
        });
      }
    : () => {
        console.warn('[CarPlayNativeModule] isConnected called but native module is not available');
        return Promise.resolve(false);
      },
  
  finishSession: isNativeModuleAvailable
    ? () => {
        console.log('[CarPlayNativeModule] finishSession called');
        return CarPlayNativeModule!.finishSession().then(() => {
          console.log('[CarPlayNativeModule] finishSession completed');
        }).catch((error) => {
          console.error('[CarPlayNativeModule] finishSession error:', error);
          throw error;
        });
      }
    : () => {
        console.error('[CarPlayNativeModule] finishSession called but native module is not available');
        return Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.'));
      },
  
  popScreen: isNativeModuleAvailable
    ? () => {
        console.log('[CarPlayNativeModule] popScreen called');
        return CarPlayNativeModule!.popScreen().then(() => {
          console.log('[CarPlayNativeModule] popScreen completed');
        }).catch((error) => {
          console.error('[CarPlayNativeModule] popScreen error:', error);
          throw error;
        });
      }
    : () => {
        console.error('[CarPlayNativeModule] popScreen called but native module is not available');
        return Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.'));
      },
  
  popToRoot: isNativeModuleAvailable
    ? () => {
        console.log('[CarPlayNativeModule] popToRoot called');
        return CarPlayNativeModule!.popToRoot().then(() => {
          console.log('[CarPlayNativeModule] popToRoot completed');
        }).catch((error) => {
          console.error('[CarPlayNativeModule] popToRoot error:', error);
          throw error;
        });
      }
    : () => {
        console.error('[CarPlayNativeModule] popToRoot called but native module is not available');
        return Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.'));
      },
  
  // Event listener - use the native module's addListener if available
  addListener: isNativeModuleAvailable
    ? (eventName: string, listener: (...args: any[]) => void) => {
        console.log(`[CarPlayNativeModule] addListener called: eventName=${eventName}`);
        return CarPlayNativeModule!.addListener(eventName, listener);
      }
    : (_eventName: string, _listener: (...args: any[]) => void) => {
        console.warn('[CarPlayNativeModule] addListener called but native module is not available. Event listeners will not work.');
        return { remove: () => {} };
      }
};

export default CarPlayNativeModuleWrapper;
