module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
  env: {
    test: {
      presets: [
        '@babel/preset-env',
        '@babel/preset-typescript',
        '@babel/preset-react',
      ],
    },
  },
};
