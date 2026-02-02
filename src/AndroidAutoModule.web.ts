// Web implementation - Android Auto is not available on web
const AndroidAutoModule = {
  registerScreen: () => Promise.reject(new Error('Android Auto is not available on web')),
  startSession: () => Promise.reject(new Error('Android Auto is not available on web')),
  navigateToScreen: () => Promise.reject(new Error('Android Auto is not available on web')),
  updateScreen: () => Promise.reject(new Error('Android Auto is not available on web')),
  getCurrentScreen: () => Promise.resolve(null),
  isConnected: () => Promise.resolve(false),
  finishSession: () => Promise.reject(new Error('Android Auto is not available on web')),
  popScreen: () => Promise.reject(new Error('Android Auto is not available on web')),
  popToRoot: () => Promise.reject(new Error('Android Auto is not available on web')),
  configureMediaSession: () => Promise.resolve(),
  updateMediaPlaybackState: () => Promise.resolve(),
  setMediaBrowseTree: () => Promise.resolve(),
  addListener: () => ({ remove: () => {} }), // Stub for event listeners
};

export default AndroidAutoModule;
