module.exports = {
  env: { node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
    ecmaVersion: 'latest',
    sourceType: 'module',
    tsconfigRootDir: '.',
  },
  plugins: [
    '@typescript-eslint', 'prettier'
  ],
  rules: {
    'prettier/prettier': [
      'error',
      {
        semi: true,
        singleQuote: true,
        printWidth: 160,
      },
      { usePrettierrc: false }
    ],
  },
  ignorePatterns: ['dist/*', '.idea/*', '*.js'],
};
