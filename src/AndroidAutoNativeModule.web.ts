// Web implementation - Car Projection is not available on web
const AndroidAutoNativeModule = {
  registerScreen: () => Promise.reject(new Error('Android Auto is not available on web')),
  startSession: () => Promise.reject(new Error('Android Auto is not available on web')),
  navigateToScreen: () => Promise.reject(new Error('Android Auto is not available on web')),
  updateScreen: () => Promise.reject(new Error('Android Auto is not available on web')),
  getCurrentScreen: () => Promise.resolve(null),
  isConnected: () => Promise.resolve(false),
  finishSession: () => Promise.reject(new Error('Android Auto is not available on web')),
  popScreen: () => Promise.reject(new Error('Android Auto is not available on web')),
  popToRoot: () => Promise.reject(new Error('Android Auto is not available on web')),
  addListener: () => ({ remove: () => {} }), // Stub for event listeners
};

export default AndroidAutoNativeModule;
