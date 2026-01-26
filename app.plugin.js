const withAndroidAuto = require('./plugin/withAndroidAuto.js');
const withCarPlay = require('./plugin/withCarPlay.js');

module.exports = (config, options = {}) => {
  // Apply Android Auto plugin
  config = withAndroidAuto(config, options.android || {});
  
  // Apply CarPlay plugin
  config = withCarPlay(config, options.ios || {});
  
  return config;
};

// Export individual plugins for advanced usage
module.exports.withAndroidAuto = withAndroidAuto;
module.exports.withCarPlay = withCarPlay;
