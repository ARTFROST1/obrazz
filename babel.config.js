module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for React Native Reanimated 4
      'react-native-worklets/plugin',
      
      // Path aliases configuration
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.ios.tsx',
            '.android.tsx',
            '.tsx',
            '.jsx',
            '.js',
            '.json',
          ],
          alias: {
            '@app': './app',
            '@components': './components',
            '@services': './services',
            '@store': './store',
            '@hooks': './hooks',
            '@utils': './utils',
            '@types': './types',
            '@assets': './assets',
            '@lib': './lib',
            '@config': './config',
            '@contexts': './contexts',
            '@styles': './styles',
            '@locales': './locales',
          },
        },
      ],
      
      // Expo Router requirement
      'expo-router/babel',
      
      // React Native Reanimated should be last
      'react-native-reanimated/plugin',
    ],
  };
};
