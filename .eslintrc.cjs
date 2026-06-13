// .eslintrc.cjs
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks', 'jsx-a11y', '@typescript-eslint'],
  settings: { react: { version: 'detect' } },
  rules: {
    // Strict code quality rules
    'no-console': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'eqeqeq': ['error', 'always'],
    // Accessibility rules already enforced by jsx-a11y
  },
};
