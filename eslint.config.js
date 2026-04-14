import openlayers from 'eslint-config-openlayers';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...openlayers,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {vars: 'all', args: 'none'}],
      'jsdoc/check-syntax': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-property-description': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-returns-type': 'off',
    },
  },
  {
    files: ['examples/*.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: {
        Cesium: 'readonly',
      },
    },
  },
  {
    ignores: ['**/*.d.ts', 'lib/**', 'apidoc/**', 'dist/**'],
  },
);
