module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
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

      // React Native Reanimated must be last (includes worklets)
      'react-native-reanimated/plugin',
    ],
  };
};
