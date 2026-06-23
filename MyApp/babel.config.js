module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-runtime',
    'react-native-reanimated/plugin',
  ],
};
plugins: [
  [
    'module:react-native-dotenv',
    {
      moduleName: '@env',
      path: '.env',
    },
  ],
];
