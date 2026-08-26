const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ignore transient npm temporary lock folders on Windows
config.resolver.blockList = [
  /.*node_modules[\\\/]\..*/,
];

module.exports = config;
