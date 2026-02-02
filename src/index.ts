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

export interface PaneTemplateConfig {
  type: 'PaneTemplate';
  title: string;
  rows?: Row[];           // Information rows displayed in the pane
  actions?: Action[];     // Action buttons displayed in the pane
  isLoading?: boolean;
  headerAction?: Action;
  actionStrip?: Action[];
}

export type TemplateConfig = ListTemplateConfig | MessageTemplateConfig | PaneTemplateConfig;

export interface ScreenConfig {
  name: string;
  template: TemplateConfig;
}

export interface UserInteractionData {
  action: 'rowPress' | 'actionPress';
  screen: string;
  data: any;
}

// Media types and interfaces
/**
 * Item for MediaBrowser browse tree (setMediaBrowseTree).
 * For the tree, root key must be "__ROOT__". playable = tap to play (track);
 * browsable = tap to open children (folder). Children are implied by the tree map
 * (key = item id, value = that item's children).
 */
export interface MediaItem {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;      // milliseconds
  artworkUri?: string;    // URL or local file path
  mediaUri?: string;      // Optional - for your app's reference
  playable?: boolean;     // true = track (tap to play), false = folder
  browsable?: boolean;    // true = folder (tap to open children)
  children?: MediaItem[]; // Nested items; for setMediaBrowseTree use tree map instead
}

export type PlaybackStateType = 'none' | 'stopped' | 'paused' | 'playing' | 'buffering' | 'error';

export interface PlaybackState {
  state: PlaybackStateType;
  position: number;       // Current position in ms
  duration: number;       // Total duration in ms
  speed?: number;         // Playback speed (default 1.0)
}

export interface CurrentTrack {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  artworkUri?: string;
  duration: number;
}

export type MediaCommand = 
  | { command: 'play' }
  | { command: 'pause' }
  | { command: 'stop' }
  | { command: 'skipNext' }
  | { command: 'skipPrevious' }
  | { command: 'seekTo'; position: number }
  | { command: 'playFromId'; mediaId: string };

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

export function createPaneTemplate(config: Omit<PaneTemplateConfig, 'type'>): PaneTemplateConfig {
  return {
    type: 'PaneTemplate',
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

  // Process PaneTemplate
  if (originalTemplate.type === 'PaneTemplate') {
    // Process rows
    if (originalTemplate.rows) {
      originalTemplate.rows.forEach((row: any, index: number) => {
        const rowId = `${screenName}_row_${index}`;
        if (row.onPress && typeof row.onPress === 'function') {
          callbacks.set(rowId, row.onPress);
        }
      });
    }
    
    // Process pane actions
    if (originalTemplate.actions) {
      originalTemplate.actions.forEach((action: any, index: number) => {
        const actionId = `${screenName}_action_${index}`;
        if (action.onPress && typeof action.onPress === 'function') {
          callbacks.set(actionId, action.onPress);
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

  if (processedTemplate.type === 'PaneTemplate') {
    if (processedTemplate.rows) {
      processedTemplate.rows = processedTemplate.rows.map((row: any, index: number) => {
        return { ...row, id: `${screenName}_row_${index}` };
      });
    }
    
    if (processedTemplate.actions) {
      processedTemplate.actions = processedTemplate.actions.map((action: any, index: number) => {
        return { ...action, id: `${screenName}_action_${index}` };
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
  
  // Store callbacks for this screen
  callbackStore.set(screenName, callbacks);
  
  return {
    ...screenConfig,
    template: processedTemplate
  };
}

// Flag to track if internal listener is set up
let internalListenerInitialized = false;
let internalListenerSubscription: Subscription | null = null;

// Internal function to set up the user interaction listener automatically
function ensureInternalListenerSetup() {
  if (internalListenerInitialized) {
    return;
  }
  internalListenerInitialized = true;
  
  console.log('[AndroidAuto] Setting up internal user interaction listener');
  
  internalListenerSubscription = AndroidAutoModule.addListener('onUserInteraction', (event: any) => {
    console.log('[AndroidAuto] *** onUserInteraction EVENT RECEIVED ***');
    console.log('[AndroidAuto] Raw event:', JSON.stringify(event, null, 2));
    
    // Parse the event data
    let rawData: any = null;
    if (event && typeof event === 'object' && event.action && event.screen) {
      rawData = event;
    } else if (event?.data && typeof event.data === 'object') {
      rawData = event.data;
    }
    
    if (!rawData || !rawData.action || !rawData.screen) {
      console.warn('[AndroidAuto] Could not parse event structure:', event);
      return;
    }
    
    const screenName = rawData.screen;
    // The id can be at rawData.id (for rows) or rawData.data?.id (for actions)
    const itemId = rawData.id || rawData.data?.id;
    
    console.log('[AndroidAuto] Looking up callback for screen:', screenName, 'itemId:', itemId);
    
    // Execute stored callback if available
    if (itemId && screenName) {
      const screenCallbacks = callbackStore.get(screenName);
      if (screenCallbacks) {
        const callback = screenCallbacks.get(itemId);
        if (callback) {
          console.log('[AndroidAuto] ✓ Executing callback for', screenName, itemId);
          try {
            callback();
          } catch (e) {
            console.error('[AndroidAuto] ✗ Error executing callback:', e);
          }
        } else {
          console.warn('[AndroidAuto] ✗ No callback found for', itemId);
          console.log('[AndroidAuto] Available callbacks:', Array.from(screenCallbacks.keys()));
        }
      } else {
        console.warn('[AndroidAuto] ✗ No callbacks registered for screen:', screenName);
        console.log('[AndroidAuto] Available screens:', Array.from(callbackStore.keys()));
      }
    }
  });
  
  console.log('[AndroidAuto] Internal listener set up successfully');
}

// Main AndroidAuto class
class AndroidAuto {

  /**
   * Register a screen with its template configuration
   */
  async registerScreen(screenConfig: ScreenConfig): Promise<void> {
    // Ensure the internal listener is set up to handle callbacks
    ensureInternalListenerSetup();
    
    // Strip callbacks before sending to native
    const preparedConfig = prepareScreenConfigForNative(screenConfig);
    const callbacks = callbackStore.get(screenConfig.name);
    if (callbacks) {
      console.log(`[AndroidAuto] Registered screen '${screenConfig.name}' with ${callbacks.size} callbacks:`, Array.from(callbacks.keys()));
    }
    console.log(`[AndroidAuto] Calling native registerScreen for '${screenConfig.name}'`);
    try {
      // Convert to JSON string to avoid Expo type conversion issues with nested objects
      const configJson = JSON.stringify(preparedConfig);
      await AndroidAutoModule.registerScreen(configJson);
      console.log(`[AndroidAuto] Native registerScreen completed for '${screenConfig.name}'`);
    } catch (e) {
      console.error(`[AndroidAuto] Native registerScreen FAILED for '${screenConfig.name}':`, e);
      throw e;
    }
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
    console.log('[AndroidAuto] Navigating to screen:', screenName);
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

  /**
   * Send a simple test event (just a string) to verify event mechanism works
   */
  async sendTestEvent(message: string): Promise<void> {
    console.log('[TEST] Sending to native:', message);
    await AndroidAutoModule.sendTestEvent(message);
    console.log('[TEST] ✓ Sent (promise resolved)');
  }

  /**
   * Configure the MediaBrowserService to use an external media session (e.g., react-native-track-player).
   * Call this at app startup so Android Auto can route audio when it connects.
   * @param options.packageName - Package hosting the media session; defaults to app package if omitted.
   * @param options.serviceName - Fully-qualified service class name (e.g. "com.doublesymmetry.trackplayer.service.MusicService")
   */
  async configureMediaSession(options: {
    packageName?: string;
    serviceName: string;
  }): Promise<void> {
    const packageName = options.packageName ?? '';
    await AndroidAutoModule.configureMediaSession(packageName, options.serviceName);
  }

  /**
   * Update the MediaBrowserService MediaSession playback state and metadata so Android Auto
   * sees our app as the active media source and routes audio. Call when TrackPlayer state or track changes.
   */
  async updateMediaPlaybackState(options: {
    state: PlaybackStateType;
    position: number;
    duration: number;
    title?: string;
    artist?: string;
  }): Promise<void> {
    await AndroidAutoModule.updateMediaPlaybackState(
      options.state,
      options.position,
      options.duration,
      options.title ?? null,
      options.artist ?? null
    );
  }

  /**
   * Set the MediaBrowser browse tree so Android Auto can show available items (playlists, tracks).
   * Tree keys are parent IDs; root must be "__ROOT__". Values are arrays of MediaItem for that parent.
   * Use addMediaPlayFromIdListener to start playback when the user taps a playable item.
   */
  async setMediaBrowseTree(tree: Record<string, MediaItem[]>): Promise<void> {
    await AndroidAutoModule.setMediaBrowseTree(JSON.stringify(tree));
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
   * Listen for Android Auto connecting via MediaBrowser (e.g. when audio can route to the car).
   */
  addMediaBrowserConnectedListener(listener: () => void): Subscription {
    return AndroidAutoModule.addListener('onMediaBrowserConnected', listener);
  }

  /**
   * Listen for play command from the car (e.g. user taps Play on DHU).
   * App should resume current track or start playback (e.g. first recently played).
   */
  addMediaPlayListener(listener: () => void): Subscription {
    return AndroidAutoModule.addListener('onMediaPlay', listener);
  }

  /**
   * Listen for user selecting a playable item in the browse UI (e.g. tap a track).
   * App should start playback for the given mediaId (e.g. match to track and play).
   */
  addMediaPlayFromIdListener(listener: (event: { mediaId: string }) => void): Subscription {
    return AndroidAutoModule.addListener('onMediaPlayFromId', (event: any) => {
      const mediaId = event?.mediaId ?? event?.value ?? '';
      listener({ mediaId });
    });
  }

  /**
   * Listen for pause command from the car.
   */
  addMediaPauseListener(listener: () => void): Subscription {
    return AndroidAutoModule.addListener('onMediaPause', listener);
  }

  /**
   * Listen for stop command from the car.
   */
  addMediaStopListener(listener: () => void): Subscription {
    return AndroidAutoModule.addListener('onMediaStop', listener);
  }

  /**
   * Listen for screen change events
   */
  addScreenChangedListener(listener: (screenName: string) => void): Subscription {
    console.log('[AndroidAuto] Setting up onScreenChanged listener');
    return AndroidAutoModule.addListener('onScreenChanged', (event: any) => {
      console.log('[AndroidAuto] *** onScreenChanged EVENT RECEIVED ***');
      console.log('[AndroidAuto] onScreenChanged event:', JSON.stringify(event, null, 2));
      // According to Expo docs, the payload is received directly as the event object
      // For string events, it's wrapped as { value: "..." }
      // For map events, the map keys are at the top level
      const screenName = event?.value || event?.screenName || event;
      console.log('[AndroidAuto] Extracted screenName:', screenName);
      listener(screenName);
    });
  }

  /**
   * Listen for test events (simple string events for debugging)
   */
  addTestEventListener(listener: (message: string) => void): Subscription {
    console.log('[TEST] Setting up listener (exactly like onScreenChanged)...');
    console.log('[TEST] AndroidAutoModule:', AndroidAutoModule);
    console.log('[TEST] AndroidAutoModule.addListener type:', typeof AndroidAutoModule.addListener);
    
    // Use EXACTLY the same pattern as onScreenChanged
    const eventCallback = (event: any) => {
      console.log('🎉 [TEST] *** EVENT RECEIVED ***');
      console.log('[TEST] Event:', JSON.stringify(event, null, 2));
      console.log('[TEST] Event type:', typeof event);
      console.log('[TEST] Event keys:', event ? Object.keys(event) : 'null');
      // According to Expo docs, the payload is received directly as the event object
      // For string events sent as mapOf("value" to data), it's received as { value: "..." }
      const message = event?.value || event?.message || event?.data?.value || String(event);
      console.log('[TEST] Extracted message:', message);
      listener(message);
    };
    
    console.log('[TEST] About to call addListener...');
    const subscription = AndroidAutoModule.addListener('onTestEvent', eventCallback);
    console.log('[TEST] ✓ Listener registered, subscription:', subscription);
    console.log('[TEST] Subscription type:', typeof subscription);
    console.log('[TEST] Subscription.remove type:', typeof subscription?.remove);
    return subscription;
  }

  /**
   * Listen for user interaction events
   */
  addUserInteractionListener(listener: (action: string, data: any) => void): Subscription {
    console.log('[AndroidAuto] Setting up onUserInteraction listener');
    const subscription = AndroidAutoModule.addListener('onUserInteraction', (event: any) => {
      console.log('[AndroidAuto] *** LISTENER CALLED ***');
      // According to Expo docs, the payload is received directly as the event object
      // When we send mapOf("action" to "rowPress", "screen" to "root", ...) from Kotlin,
      // it's received as { action: "rowPress", screen: "root", ... } directly
      
      console.log('[AndroidAuto] Raw event received:', JSON.stringify(event, null, 2));
      
      // Try direct access first (per Expo docs), then fallback to event.data if needed
      let rawData: any = null;
      if (event && typeof event === 'object' && event.action && event.screen) {
        // Direct access - event is the map we sent
        rawData = event;
      } else if (event?.data && typeof event.data === 'object') {
        // Wrapped access - event.data contains the map
        rawData = event.data;
      }
      
      if (!rawData || !rawData.action || !rawData.screen) {
        console.warn('[AndroidAuto] Could not parse event structure. Event:', event);
        console.warn('[AndroidAuto] Event type:', typeof event);
        console.warn('[AndroidAuto] Event keys:', event ? Object.keys(event) : 'null');
        return;
      }
      
      // Event data is now flattened: { action, screen, id, title, texts, ... }
      const screenName = rawData.screen;
      const itemId = rawData.id;
      
      // Reconstruct the interaction data structure for compatibility
      const interactionData: UserInteractionData = {
        action: rawData.action as 'rowPress' | 'actionPress',
        screen: screenName,
        data: {
          id: itemId,
          // Include all other fields from the flattened structure
          ...Object.fromEntries(
            Object.entries(rawData).filter(([key]) => key !== 'action' && key !== 'screen')
          )
        }
      };
      
      console.log('[AndroidAuto] Parsed interaction:', {
        action: interactionData.action,
        screen: screenName,
        itemId: itemId,
        fullData: interactionData.data
      });
      
      // Execute stored callback if available
      if (itemId && screenName) {
        const screenCallbacks = callbackStore.get(screenName);
        if (screenCallbacks) {
          const callback = screenCallbacks.get(itemId);
          if (callback) {
            console.log('[AndroidAuto] ✓ Found and executing callback for', screenName, itemId);
            try {
              callback();
            } catch (e) {
              console.error('[AndroidAuto] ✗ Error executing callback:', e);
              console.error(e);
            }
          } else {
            console.warn('[AndroidAuto] ✗ No callback found for', screenName, itemId);
            console.log('[AndroidAuto] Available callbacks for this screen:', Array.from(screenCallbacks.keys()));
          }
        } else {
          console.warn('[AndroidAuto] ✗ No callbacks registered for screen:', screenName);
          console.log('[AndroidAuto] Available screens with callbacks:', Array.from(callbackStore.keys()));
        }
      } else {
        console.warn('[AndroidAuto] ✗ Missing itemId or screenName:', { itemId, screenName });
      }
      
      // Also call the user's listener
      listener(interactionData.action, interactionData.data);
    });
    console.log('[AndroidAuto] onUserInteraction listener registered, subscription:', subscription);
    return subscription;
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
