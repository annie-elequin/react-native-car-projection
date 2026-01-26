import { useEffect, useState } from "react";
import { Platform } from "react-native";

import AndroidAutoNativeModule from "./AndroidAutoNativeModule.js";
import CarPlayNativeModule from "./CarPlayNativeModule.js";

// Define Subscription interface
interface Subscription {
  remove(): void;
}

// Define TypeScript interfaces
export interface CarColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

export interface Action {
  title: string;
  onPress: () => void;
  icon?: any;
  backgroundColor?: CarColor;
}

export interface Row {
  title: string;
  texts?: string[];
  onPress?: () => void;
  metadata?: {
    place?: string;
    distance?: string;
    [key: string]: any;
  };
}

export interface ItemList {
  header?: string;
  items: Row[];
}

export interface ListTemplateConfig {
  type: 'ListTemplate';
  title: string;
  isLoading?: boolean;
  header?: string;
  headerAction?: Action;
  actionStrip?: Action[];
  itemLists?: ItemList[];
  items?: Row[]; // Simplified version - will be converted to itemLists
}

export interface MessageTemplateConfig {
  type: 'MessageTemplate';
  title: string;
  message: string;
  headerAction?: Action;
  actionStrip?: Action[];
}

export type TemplateConfig = ListTemplateConfig | MessageTemplateConfig;

export interface ScreenConfig {
  name: string;
  template: TemplateConfig;
}

export interface UserInteractionData {
  action: 'rowPress' | 'actionPress';
  screen: string;
  data: any;
}

// Helper functions to create templates
export function createListTemplate(config: Omit<ListTemplateConfig, 'type'>): ListTemplateConfig {
  const template: ListTemplateConfig = {
    type: 'ListTemplate',
    ...config
  };

  // Convert simple items array to itemLists format if needed
  if (config.items && !config.itemLists) {
    template.itemLists = [{
      header: config.header,
      items: config.items
    }];
  }

  return template;
}

export function createMessageTemplate(config: Omit<MessageTemplateConfig, 'type'>): MessageTemplateConfig {
  return {
    type: 'MessageTemplate',
    ...config
  };
}

// Store callbacks separately since they can't be serialized
const callbackStore = new Map<string, Map<string, () => void>>();

// Helper function to deep clone without functions
function cloneWithoutFunctions(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cloneWithoutFunctions(item));
  }
  
  const cloned: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'function') {
        // Skip functions
        continue;
      }
      cloned[key] = cloneWithoutFunctions(value);
    }
  }
  return cloned;
}

// Helper function to strip callbacks and add IDs
function prepareScreenConfigForNative(screenConfig: ScreenConfig): ScreenConfig {
  const screenName = screenConfig.name;
  const callbacks = new Map<string, () => void>();
  const originalTemplate = screenConfig.template;
  
  // Process items in ListTemplate - extract callbacks from original
  if (originalTemplate.type === 'ListTemplate') {
    if (originalTemplate.items) {
      originalTemplate.items.forEach((item: any, index: number) => {
        const itemId = `${screenName}_item_${index}`;
        if (item.onPress && typeof item.onPress === 'function') {
          callbacks.set(itemId, item.onPress);
        }
      });
    }
    
    // Process itemLists if present
    if (originalTemplate.itemLists) {
      originalTemplate.itemLists.forEach((itemList: any, listIndex: number) => {
        if (itemList.items) {
          itemList.items.forEach((item: any, itemIndex: number) => {
            const itemId = `${screenName}_list_${listIndex}_item_${itemIndex}`;
            if (item.onPress && typeof item.onPress === 'function') {
              callbacks.set(itemId, item.onPress);
            }
          });
        }
      });
    }
    
    // Process headerAction
    if (originalTemplate.headerAction?.onPress && typeof originalTemplate.headerAction.onPress === 'function') {
      const actionId = `${screenName}_headerAction`;
      callbacks.set(actionId, originalTemplate.headerAction.onPress);
    }
    
    // Process actionStrip
    if (originalTemplate.actionStrip) {
      originalTemplate.actionStrip.forEach((action: any, index: number) => {
        const actionId = `${screenName}_actionStrip_${index}`;
        if (action.onPress && typeof action.onPress === 'function') {
          callbacks.set(actionId, action.onPress);
        }
      });
    }
  }
  
  // Process MessageTemplate actions
  if (originalTemplate.type === 'MessageTemplate') {
    if (originalTemplate.headerAction?.onPress && typeof originalTemplate.headerAction.onPress === 'function') {
      const actionId = `${screenName}_headerAction`;
      callbacks.set(actionId, originalTemplate.headerAction.onPress);
    }
    
    if (originalTemplate.actionStrip) {
      originalTemplate.actionStrip.forEach((action: any, index: number) => {
        const actionId = `${screenName}_actionStrip_${index}`;
        if (action.onPress && typeof action.onPress === 'function') {
          callbacks.set(actionId, action.onPress);
        }
      });
    }
  }
  
  // Now clone without functions and add IDs
  const processedTemplate = cloneWithoutFunctions(originalTemplate);
  
  // Add IDs to items
  if (processedTemplate.type === 'ListTemplate') {
    if (processedTemplate.items) {
      processedTemplate.items = processedTemplate.items.map((item: any, index: number) => {
        return { ...item, id: `${screenName}_item_${index}` };
      });
    }
    
    if (processedTemplate.itemLists) {
      processedTemplate.itemLists = processedTemplate.itemLists.map((itemList: any, listIndex: number) => {
        if (itemList.items) {
          itemList.items = itemList.items.map((item: any, itemIndex: number) => {
            return { ...item, id: `${screenName}_list_${listIndex}_item_${itemIndex}` };
          });
        }
        return itemList;
      });
    }
    
    if (processedTemplate.headerAction) {
      processedTemplate.headerAction = { ...processedTemplate.headerAction, id: `${screenName}_headerAction` };
    }
    
    if (processedTemplate.actionStrip) {
      processedTemplate.actionStrip = processedTemplate.actionStrip.map((action: any, index: number) => {
        return { ...action, id: `${screenName}_actionStrip_${index}` };
      });
    }
  }
  
  if (processedTemplate.type === 'MessageTemplate') {
    if (processedTemplate.headerAction) {
      processedTemplate.headerAction = { ...processedTemplate.headerAction, id: `${screenName}_headerAction` };
    }
    
    if (processedTemplate.actionStrip) {
      processedTemplate.actionStrip = processedTemplate.actionStrip.map((action: any, index: number) => {
        return { ...action, id: `${screenName}_actionStrip_${index}` };
      });
    }
  }
  
  // Store callbacks for this screen
  callbackStore.set(screenName, callbacks);
  
  return {
    ...screenConfig,
    template: processedTemplate
  };
}

// Get platform-specific native module
function getNativeModule() {
  if (Platform.OS === 'android') {
    return AndroidAutoNativeModule;
  } else if (Platform.OS === 'ios') {
    return CarPlayNativeModule;
  }
  return null;
}

// Main CarProjection class - unified API for both Android Auto and CarPlay
class CarProjection {

  /**
   * Register a screen with its template configuration
   * Registers on the current platform (Android Auto or CarPlay)
   */
  async registerScreen(screenConfig: ScreenConfig): Promise<void> {
    const preparedConfig = prepareScreenConfigForNative(screenConfig);
    const nativeModule = getNativeModule();
    
    if (!nativeModule) {
      throw new Error(`Car Projection is not available on platform: ${Platform.OS}`);
    }
    
    return nativeModule.registerScreen(preparedConfig);
  }

  /**
   * Start the car projection session (Android Auto or CarPlay)
   */
  async startSession(): Promise<void> {
    const nativeModule = getNativeModule();
    
    if (!nativeModule) {
      throw new Error(`Car Projection is not available on platform: ${Platform.OS}`);
    }
    
    return nativeModule.startSession();
  }

  /**
   * Navigate to a specific screen
   */
  async navigateToScreen(screenName: string, params?: Record<string, any>): Promise<void> {
    const nativeModule = getNativeModule();
    
    if (!nativeModule) {
      throw new Error(`Car Projection is not available on platform: ${Platform.OS}`);
    }
    
    return nativeModule.navigateToScreen(screenName, params);
  }

  /**
   * Update a screen's template
   */
  async updateScreen(screenName: string, template: TemplateConfig): Promise<void> {
    const nativeModule = getNativeModule();
    
    if (!nativeModule) {
      throw new Error(`Car Projection is not available on platform: ${Platform.OS}`);
    }
    
    return nativeModule.updateScreen(screenName, template);
  }

  /**
   * Get the current active screen name
   */
  async getCurrentScreen(): Promise<string | null> {
    const nativeModule = getNativeModule();
    
    if (!nativeModule) {
      return Promise.resolve(null);
    }
    
    return nativeModule.getCurrentScreen();
  }

  /**
   * Check if car projection is currently connected (Android Auto or CarPlay)
   */
  async isConnected(): Promise<boolean> {
    const nativeModule = getNativeModule();
    
    if (!nativeModule) {
      return Promise.resolve(false);
    }
    
    return nativeModule.isConnected();
  }

  /**
   * Finish the car projection session
   */
  async finishSession(): Promise<void> {
    const nativeModule = getNativeModule();
    
    if (!nativeModule) {
      throw new Error(`Car Projection is not available on platform: ${Platform.OS}`);
    }
    
    return nativeModule.finishSession();
  }

  /**
   * Go back one screen
   */
  async popScreen(): Promise<void> {
    const nativeModule = getNativeModule();
    
    if (!nativeModule) {
      throw new Error(`Car Projection is not available on platform: ${Platform.OS}`);
    }
    
    return nativeModule.popScreen();
  }

  /**
   * Go back to the root screen
   */
  async popToRoot(): Promise<void> {
    const nativeModule = getNativeModule();
    
    if (!nativeModule) {
      throw new Error(`Car Projection is not available on platform: ${Platform.OS}`);
    }
    
    return nativeModule.popToRoot();
  }

  // Event listeners
  /**
   * Listen for session started events
   */
  addSessionStartedListener(listener: () => void): Subscription {
    const nativeModule = getNativeModule();
    
    if (!nativeModule) {
      console.warn(`Car Projection is not available on platform: ${Platform.OS}`);
      return { remove: () => {} };
    }
    
    return nativeModule.addListener('onSessionStarted', listener);
  }

  /**
   * Listen for session ended events
   */
  addSessionEndedListener(listener: () => void): Subscription {
    const nativeModule = getNativeModule();
    
    if (!nativeModule) {
      console.warn(`Car Projection is not available on platform: ${Platform.OS}`);
      return { remove: () => {} };
    }
    
    return nativeModule.addListener('onSessionEnded', listener);
  }

  /**
   * Listen for screen change events
   */
  addScreenChangedListener(listener: (screenName: string) => void): Subscription {
    const nativeModule = getNativeModule();
    
    if (!nativeModule) {
      console.warn(`Car Projection is not available on platform: ${Platform.OS}`);
      return { remove: () => {} };
    }
    
    return nativeModule.addListener('onScreenChanged', (event: any) => {
      listener(event.data);
    });
  }

  /**
   * Listen for user interaction events
   */
  addUserInteractionListener(listener: (action: string, data: any) => void): Subscription {
    const nativeModule = getNativeModule();
    
    if (!nativeModule) {
      console.warn(`Car Projection is not available on platform: ${Platform.OS}`);
      return { remove: () => {} };
    }
    
    return nativeModule.addListener('onUserInteraction', (event: any) => {
      // Expo Modules passes the event data directly as the second parameter
      // The event might be the data itself, or wrapped in an object
      const interactionData = (event?.action ? event : (event?.data || event)) as UserInteractionData;
      const screenName = interactionData.screen;
      const itemId = interactionData.data?.id;
      
      // Execute stored callback if available
      if (itemId && screenName) {
        const screenCallbacks = callbackStore.get(screenName);
        const callback = screenCallbacks?.get(itemId);
        if (callback) {
          try {
            callback();
          } catch (e) {
            console.error('[CarProjection] Error executing callback:', e);
          }
        }
      }
      
      listener(interactionData.action, interactionData.data);
    });
  }
}

// Create singleton instance
const carProjectionInstance = new CarProjection();

// Custom hook for car navigation
export function useCarNavigation() {
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Get initial state
    carProjectionInstance.getCurrentScreen().then(setCurrentScreen);
    carProjectionInstance.isConnected().then(setIsConnected);

    // Listen for changes
    const screenSub = carProjectionInstance.addScreenChangedListener(setCurrentScreen);
    const sessionStartedSub = carProjectionInstance.addSessionStartedListener(() => setIsConnected(true));
    const sessionEndedSub = carProjectionInstance.addSessionEndedListener(() => {
      setIsConnected(false);
      setCurrentScreen(null);
    });

    return () => {
      screenSub.remove();
      sessionStartedSub.remove();
      sessionEndedSub.remove();
    };
  }, []);

  const navigation = {
    /**
     * Navigate to a screen
     */
    push: (screenName: string, params?: Record<string, any>) => {
      return carProjectionInstance.navigateToScreen(screenName, params);
    },

    /**
     * Go back one screen
     */
    pop: () => {
      return carProjectionInstance.popScreen();
    },

    /**
     * Go back to root screen
     */
    popToRoot: () => {
      return carProjectionInstance.popToRoot();
    },

    /**
     * Finish the session
     */
    finish: () => {
      return carProjectionInstance.finishSession();
    },

    /**
     * Get current screen name
     */
    getCurrentScreen: () => currentScreen,

    /**
     * Check if connected
     */
    isConnected: () => isConnected
  };

  return navigation;
}

// Export the singleton instance as default
export default carProjectionInstance;

// Also export the class for advanced usage
export { CarProjection };
