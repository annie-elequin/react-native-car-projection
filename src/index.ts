import { useEffect, useState } from "react";

import AndroidAutoModule from "./AndroidAutoModule.js";

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

// Main AndroidAuto class
class AndroidAuto {

  /**
   * Register a screen with its template configuration
   */
  async registerScreen(screenConfig: ScreenConfig): Promise<void> {
    return AndroidAutoModule.registerScreen(screenConfig);
  }

  /**
   * Start the Android Auto session
   */
  async startSession(): Promise<void> {
    return AndroidAutoModule.startSession();
  }

  /**
   * Navigate to a specific screen
   */
  async navigateToScreen(screenName: string, params?: Record<string, any>): Promise<void> {
    return AndroidAutoModule.navigateToScreen(screenName, params);
  }

  /**
   * Update a screen's template
   */
  async updateScreen(screenName: string, template: TemplateConfig): Promise<void> {
    return AndroidAutoModule.updateScreen(screenName, template);
  }

  /**
   * Get the current active screen name
   */
  async getCurrentScreen(): Promise<string | null> {
    return AndroidAutoModule.getCurrentScreen();
  }

  /**
   * Check if Android Auto is currently connected
   */
  async isConnected(): Promise<boolean> {
    return AndroidAutoModule.isConnected();
  }

  /**
   * Finish the Android Auto session
   */
  async finishSession(): Promise<void> {
    return AndroidAutoModule.finishSession();
  }

  /**
   * Go back one screen
   */
  async popScreen(): Promise<void> {
    return AndroidAutoModule.popScreen();
  }

  /**
   * Go back to the root screen
   */
  async popToRoot(): Promise<void> {
    return AndroidAutoModule.popToRoot();
  }

  // Event listeners
  /**
   * Listen for session started events
   */
  addSessionStartedListener(listener: () => void): Subscription {
    return AndroidAutoModule.addListener('onSessionStarted', listener);
  }

  /**
   * Listen for session ended events
   */
  addSessionEndedListener(listener: () => void): Subscription {
    return AndroidAutoModule.addListener('onSessionEnded', listener);
  }

  /**
   * Listen for screen change events
   */
  addScreenChangedListener(listener: (screenName: string) => void): Subscription {
    return AndroidAutoModule.addListener('onScreenChanged', (event: any) => {
      listener(event.data);
    });
  }

  /**
   * Listen for user interaction events
   */
  addUserInteractionListener(listener: (action: string, data: any) => void): Subscription {
    return AndroidAutoModule.addListener('onUserInteraction', (event: any) => {
      const interactionData = event.data as UserInteractionData;
      listener(interactionData.action, interactionData.data);
    });
  }
}

// Create singleton instance
const androidAutoInstance = new AndroidAuto();

// Custom hook for car navigation
export function useCarNavigation() {
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Get initial state
    androidAutoInstance.getCurrentScreen().then(setCurrentScreen);
    androidAutoInstance.isConnected().then(setIsConnected);

    // Listen for changes
    const screenSub = androidAutoInstance.addScreenChangedListener(setCurrentScreen);
    const sessionStartedSub = androidAutoInstance.addSessionStartedListener(() => setIsConnected(true));
    const sessionEndedSub = androidAutoInstance.addSessionEndedListener(() => {
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
      return androidAutoInstance.navigateToScreen(screenName, params);
    },

    /**
     * Go back one screen
     */
    pop: () => {
      return androidAutoInstance.popScreen();
    },

    /**
     * Go back to root screen
     */
    popToRoot: () => {
      return androidAutoInstance.popToRoot();
    },

    /**
     * Finish the session
     */
    finish: () => {
      return androidAutoInstance.finishSession();
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
export default androidAutoInstance;

// Also export the class for advanced usage
export { AndroidAuto };
