const path = require('path');
const { pathToFileURL } = require('url');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('node:')) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

const globalCssPath = path.resolve(__dirname, 'global.css');
const globalCssInput = process.platform === 'win32'
  ? pathToFileURL(globalCssPath).href
  : globalCssPath;

module.exports = withNativeWind(config, { input: globalCssInput });