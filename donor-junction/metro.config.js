const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ignore the android and ios directories to prevent file locking and watch errors
config.resolver.blockList = [
  /[\\/]android[\\/]/,
  /[\\/]ios[\\/]/,
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : [config.resolver.blockList].filter(Boolean))
];

module.exports = config;
