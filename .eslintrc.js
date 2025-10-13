module.exports = {
  extends: 'expo',
  env: {
    jest: true,
  },
  rules: {
    // Disable problematic import rules
    'import/namespace': 'off',
    'import/default': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-unresolved': 'off',

    // Relax TypeScript rules
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/array-type': 'off',

    // Relax React hooks
    'react-hooks/exhaustive-deps': 'warn',

    // Allow no-undef in test files
    'no-undef': 'off',
  },
};
