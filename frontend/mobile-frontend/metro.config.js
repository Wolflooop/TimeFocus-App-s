const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = mergeConfig(defaultConfig, {
  resolver: {
    blockList: [
      /node_modules\/.*\/android\/.cxx\/.*/,
      /node_modules\/.*\/android\/build\/.*/,
      /android\/app\/build\/.*/,
      /android\/.cxx\/.*/,
    ],
  },
});

module.exports = config;
