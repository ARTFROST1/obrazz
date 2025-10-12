// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @ prefixed imports
  if (moduleName.startsWith('@/')) {
    const modulePath = moduleName.substring(2); // Remove '@/'
    const absolutePath = path.resolve(__dirname, modulePath);

    return context.resolveRequest(context, absolutePath, platform);
  }

  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
