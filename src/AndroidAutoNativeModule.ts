import { requireOptionalNativeModule } from 'expo-modules-core';

// Get the native module using the recommended API
// requireOptionalNativeModule returns null if module isn't available (instead of throwing)
const AndroidAutoNativeModule = requireOptionalNativeModule<{
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
}>('AndroidAuto');

// Debug: Log module availability
if (__DEV__) {
  if (AndroidAutoNativeModule) {
    console.log('[AndroidAuto] Native module loaded successfully');
  } else {
    console.warn('[AndroidAuto] Native module not found. This usually means:');
    console.warn('  1. The app needs to be built and run with: npx expo run:android');
    console.warn('  2. Do NOT use "expo start" + QR code (Expo Go doesn\'t support custom native modules)');
    console.warn('  3. The Expo config plugin may not have been applied properly');
    console.warn('  4. Make sure you\'re running a development build, not Expo Go');
  }
}

// Check if native module is available
const isNativeModuleAvailable = AndroidAutoNativeModule != null;

// Create a wrapper that includes both native functions and stub event methods
const AndroidAutoNativeModuleWrapper = {
  // Native module functions with fallbacks if module isn't available
  registerScreen: isNativeModuleAvailable 
    ? (config: any) => {
        console.log('[AndroidAutoNativeModule] registerScreen called');
        console.log('[AndroidAutoNativeModule] Screen config:', JSON.stringify(config, null, 2));
        return AndroidAutoNativeModule!.registerScreen(config).then(() => {
          console.log('[AndroidAutoNativeModule] registerScreen completed');
        }).catch((error) => {
          console.error('[AndroidAutoNativeModule] registerScreen error:', error);
          throw error;
        });
      }
    : () => {
        console.error('[AndroidAutoNativeModule] registerScreen called but native module is not available');
        return Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.'));
      },
  
  startSession: isNativeModuleAvailable
    ? () => {
        console.log('[AndroidAutoNativeModule] startSession called');
        return AndroidAutoNativeModule!.startSession().then(() => {
          console.log('[AndroidAutoNativeModule] startSession completed');
        }).catch((error) => {
          console.error('[AndroidAutoNativeModule] startSession error:', error);
          throw error;
        });
      }
    : () => {
        console.error('[AndroidAutoNativeModule] startSession called but native module is not available');
        return Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.'));
      },
  
  navigateToScreen: isNativeModuleAvailable
    ? (screenName: string, params?: any) => {
        console.log(`[AndroidAutoNativeModule] navigateToScreen called: screenName=${screenName}, params=`, params);
        return AndroidAutoNativeModule!.navigateToScreen(screenName, params).then(() => {
          console.log(`[AndroidAutoNativeModule] navigateToScreen completed: ${screenName}`);
        }).catch((error) => {
          console.error(`[AndroidAutoNativeModule] navigateToScreen error for ${screenName}:`, error);
          throw error;
        });
      }
    : () => {
        console.error('[AndroidAutoNativeModule] navigateToScreen called but native module is not available');
        return Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.'));
      },
  
  updateScreen: isNativeModuleAvailable
    ? (screenName: string, template: any) => {
        console.log(`[AndroidAutoNativeModule] updateScreen called: screenName=${screenName}`);
        return AndroidAutoNativeModule!.updateScreen(screenName, template).then(() => {
          console.log(`[AndroidAutoNativeModule] updateScreen completed: ${screenName}`);
        }).catch((error) => {
          console.error(`[AndroidAutoNativeModule] updateScreen error for ${screenName}:`, error);
          throw error;
        });
      }
    : () => {
        console.error('[AndroidAutoNativeModule] updateScreen called but native module is not available');
        return Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.'));
      },
  
  getCurrentScreen: isNativeModuleAvailable
    ? () => {
        console.log('[AndroidAutoNativeModule] getCurrentScreen called');
        return AndroidAutoNativeModule!.getCurrentScreen().then((screen) => {
          console.log(`[AndroidAutoNativeModule] getCurrentScreen result: ${screen}`);
          return screen;
        }).catch((error) => {
          console.error('[AndroidAutoNativeModule] getCurrentScreen error:', error);
          throw error;
        });
      }
    : () => {
        console.warn('[AndroidAutoNativeModule] getCurrentScreen called but native module is not available');
        return Promise.resolve(null);
      },
  
  isConnected: isNativeModuleAvailable
    ? () => {
        console.log('[AndroidAutoNativeModule] isConnected called');
        return AndroidAutoNativeModule!.isConnected().then((connected) => {
          console.log(`[AndroidAutoNativeModule] isConnected result: ${connected}`);
          return connected;
        }).catch((error) => {
          console.error('[AndroidAutoNativeModule] isConnected error:', error);
          throw error;
        });
      }
    : () => {
        console.warn('[AndroidAutoNativeModule] isConnected called but native module is not available');
        return Promise.resolve(false);
      },
  
  finishSession: isNativeModuleAvailable
    ? () => {
        console.log('[AndroidAutoNativeModule] finishSession called');
        return AndroidAutoNativeModule!.finishSession().then(() => {
          console.log('[AndroidAutoNativeModule] finishSession completed');
        }).catch((error) => {
          console.error('[AndroidAutoNativeModule] finishSession error:', error);
          throw error;
        });
      }
    : () => {
        console.error('[AndroidAutoNativeModule] finishSession called but native module is not available');
        return Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.'));
      },
  
  popScreen: isNativeModuleAvailable
    ? () => {
        console.log('[AndroidAutoNativeModule] popScreen called');
        return AndroidAutoNativeModule!.popScreen().then(() => {
          console.log('[AndroidAutoNativeModule] popScreen completed');
        }).catch((error) => {
          console.error('[AndroidAutoNativeModule] popScreen error:', error);
          throw error;
        });
      }
    : () => {
        console.error('[AndroidAutoNativeModule] popScreen called but native module is not available');
        return Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.'));
      },
  
  popToRoot: isNativeModuleAvailable
    ? () => {
        console.log('[AndroidAutoNativeModule] popToRoot called');
        return AndroidAutoNativeModule!.popToRoot().then(() => {
          console.log('[AndroidAutoNativeModule] popToRoot completed');
        }).catch((error) => {
          console.error('[AndroidAutoNativeModule] popToRoot error:', error);
          throw error;
        });
      }
    : () => {
        console.error('[AndroidAutoNativeModule] popToRoot called but native module is not available');
        return Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.'));
      },
  
  // Event listener - use the native module's addListener if available
  addListener: isNativeModuleAvailable
    ? (eventName: string, listener: (...args: any[]) => void) => {
        console.log(`[AndroidAutoNativeModule] addListener called: eventName=${eventName}`);
        return AndroidAutoNativeModule!.addListener(eventName, listener);
      }
    : (_eventName: string, _listener: (...args: any[]) => void) => {
        console.warn('[AndroidAutoNativeModule] addListener called but native module is not available. Event listeners will not work.');
        return { remove: () => {} };
      }
};

export default AndroidAutoNativeModuleWrapper;
