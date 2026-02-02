import { requireOptionalNativeModule } from 'expo-modules-core';

// Define the native module interface
interface AndroidAutoNativeModuleInterface {
  registerScreen: (config: any) => Promise<void>;
  startSession: () => Promise<void>;
  navigateToScreen: (screenName: string, params?: any) => Promise<void>;
  updateScreen: (screenName: string, template: any) => Promise<void>;
  getCurrentScreen: () => Promise<string | null>;
  isConnected: () => Promise<boolean>;
  finishSession: () => Promise<void>;
  popScreen: () => Promise<void>;
  popToRoot: () => Promise<void>;
  sendTestEvent: (message: string) => Promise<void>;
  configureMediaSession: (packageName: string, serviceName: string) => Promise<void>;
  updateMediaPlaybackState: (state: string, positionSeconds: number, durationSeconds: number, title: string | null, artist: string | null) => Promise<void>;
  setMediaBrowseTree: (json: string) => Promise<void>;
  addListener: (eventName: string, listener: (event: any) => void) => { remove: () => void };
}

// Get the native module using the recommended API
// requireOptionalNativeModule returns null if module isn't available (instead of throwing)
const AndroidAutoNativeModule = requireOptionalNativeModule<AndroidAutoNativeModuleInterface>('AndroidAuto');

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

// Stub for when module isn't available
const notAvailableError = () => Promise.reject(new Error('Android Auto native module is not available. Make sure the native module is properly linked.'));

// Create a wrapper that properly delegates to the native module
// IMPORTANT: We use wrapper functions to preserve proper 'this' context for event methods
const AndroidAutoModule = {
  // Native module functions with fallbacks if module isn't available
  registerScreen: AndroidAutoNativeModule 
    ? (config: any) => AndroidAutoNativeModule.registerScreen(config)
    : notAvailableError,
  
  startSession: AndroidAutoNativeModule
    ? () => AndroidAutoNativeModule.startSession()
    : notAvailableError,
  
  navigateToScreen: AndroidAutoNativeModule
    ? (screenName: string, params?: any) => {
        return AndroidAutoNativeModule.navigateToScreen(screenName, params).catch((error: Error) => {
          console.error('[AndroidAutoModule] navigateToScreen error:', error);
          throw error;
        });
      }
    : notAvailableError,
  
  updateScreen: AndroidAutoNativeModule
    ? (screenName: string, template: any) => AndroidAutoNativeModule.updateScreen(screenName, template)
    : notAvailableError,
  
  getCurrentScreen: AndroidAutoNativeModule
    ? () => AndroidAutoNativeModule.getCurrentScreen()
    : () => Promise.resolve(null),
  
  isConnected: AndroidAutoNativeModule
    ? () => AndroidAutoNativeModule.isConnected()
    : () => Promise.resolve(false),
  
  finishSession: AndroidAutoNativeModule
    ? () => AndroidAutoNativeModule.finishSession()
    : notAvailableError,
  
  popScreen: AndroidAutoNativeModule
    ? () => AndroidAutoNativeModule.popScreen()
    : notAvailableError,
  
  popToRoot: AndroidAutoNativeModule
    ? () => AndroidAutoNativeModule.popToRoot()
    : notAvailableError,
  
  sendTestEvent: AndroidAutoNativeModule
    ? (message: string) => AndroidAutoNativeModule.sendTestEvent(message)
    : notAvailableError,
  
  configureMediaSession: AndroidAutoNativeModule
    ? (packageName: string, serviceName: string) => AndroidAutoNativeModule.configureMediaSession(packageName, serviceName)
    : notAvailableError,

  updateMediaPlaybackState: AndroidAutoNativeModule
    ? (state: string, positionSeconds: number, durationSeconds: number, title: string | null, artist: string | null) =>
        AndroidAutoNativeModule.updateMediaPlaybackState(state, positionSeconds, durationSeconds, title, artist)
    : notAvailableError,

  setMediaBrowseTree: AndroidAutoNativeModule
    ? (json: string) => AndroidAutoNativeModule.setMediaBrowseTree(json)
    : notAvailableError,
  
  // Event listener - CRITICAL: Call addListener as a method on the native module
  // to preserve the proper 'this' context for the EventEmitter
  addListener: AndroidAutoNativeModule
    ? (eventName: string, listener: (event: any) => void) => {
        // Call addListener as a method on the native module object itself
        return AndroidAutoNativeModule.addListener(eventName, listener);
      }
    : (_eventName: string, _listener: (event: any) => void) => {
        console.warn('Android Auto native module is not available. Event listeners will not work.');
        return { remove: () => {} };
      }
};

export default AndroidAutoModule;
