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
    ? CarPlayNativeModule.registerScreen
    : () => Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.')),
  
  startSession: isNativeModuleAvailable
    ? CarPlayNativeModule.startSession
    : () => Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.')),
  
  navigateToScreen: isNativeModuleAvailable
    ? (screenName: string, params?: any) => {
        return CarPlayNativeModule!.navigateToScreen(screenName, params).catch((error) => {
          console.error('[CarPlayNativeModule] navigateToScreen error:', error);
          throw error;
        });
      }
    : () => Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.')),
  
  updateScreen: isNativeModuleAvailable
    ? CarPlayNativeModule.updateScreen
    : () => Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.')),
  
  getCurrentScreen: isNativeModuleAvailable
    ? CarPlayNativeModule.getCurrentScreen
    : () => Promise.resolve(null),
  
  isConnected: isNativeModuleAvailable
    ? CarPlayNativeModule.isConnected
    : () => Promise.resolve(false),
  
  finishSession: isNativeModuleAvailable
    ? CarPlayNativeModule.finishSession
    : () => Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.')),
  
  popScreen: isNativeModuleAvailable
    ? CarPlayNativeModule.popScreen
    : () => Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.')),
  
  popToRoot: isNativeModuleAvailable
    ? CarPlayNativeModule.popToRoot
    : () => Promise.reject(new Error('CarPlay native module is not available. Make sure the native module is properly linked.')),
  
  // Event listener - use the native module's addListener if available
  addListener: isNativeModuleAvailable
    ? CarPlayNativeModule.addListener
    : (_eventName: string, _listener: (...args: any[]) => void) => {
        console.warn('CarPlay native module is not available. Event listeners will not work.');
        return { remove: () => {} };
      }
};

export default CarPlayNativeModuleWrapper;
