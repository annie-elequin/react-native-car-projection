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
const AndroidAutoModule = {
  // Native module functions with fallbacks if module isn't available
  registerScreen: isNativeModuleAvailable 
    ? AndroidAutoNativeModule.registerScreen
    : () => Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.')),
  
  startSession: isNativeModuleAvailable
    ? AndroidAutoNativeModule.startSession
    : () => Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.')),
  
  navigateToScreen: isNativeModuleAvailable
    ? (screenName: string, params?: any) => {
        return AndroidAutoNativeModule!.navigateToScreen(screenName, params).catch((error) => {
          console.error('[AndroidAutoModule] navigateToScreen error:', error);
          throw error;
        });
      }
    : () => Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.')),
  
  updateScreen: isNativeModuleAvailable
    ? AndroidAutoNativeModule.updateScreen
    : () => Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.')),
  
  getCurrentScreen: isNativeModuleAvailable
    ? AndroidAutoNativeModule.getCurrentScreen
    : () => Promise.resolve(null),
  
  isConnected: isNativeModuleAvailable
    ? AndroidAutoNativeModule.isConnected
    : () => Promise.resolve(false),
  
  finishSession: isNativeModuleAvailable
    ? AndroidAutoNativeModule.finishSession
    : () => Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.')),
  
  popScreen: isNativeModuleAvailable
    ? AndroidAutoNativeModule.popScreen
    : () => Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.')),
  
  popToRoot: isNativeModuleAvailable
    ? AndroidAutoNativeModule.popToRoot
    : () => Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.')),
  
  // Event listener - use the native module's addListener if available
  addListener: isNativeModuleAvailable
    ? AndroidAutoNativeModule.addListener
    : (_eventName: string, _listener: (...args: any[]) => void) => {
        console.warn('Android Auto native module is not available. Event listeners will not work.');
        return { remove: () => {} };
      }
};

export default AndroidAutoModule;
