module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  root: true,
  env: {
    node: true,
    es6: true
  },
  ignorePatterns: [
    '.eslintrc.js',
    'dist/',
    'node_modules/',
    'coverage/',
    '*.d.ts'
  ],
  rules: {
    // TypeScript Specific - mais tolerante para CI
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // General Rules - tolerantes
    'no-console': 'off',
    'no-debugger': 'error',
    'no-unused-vars': 'off', // Use TypeScript version instead
    'prefer-const': 'warn'
  }
};
