import sveltePlugin from 'eslint-plugin-svelte';

export default [
  {
    ignores: ['dist/', 'node_modules/'],
  },
  ...sveltePlugin.configs['flat/recommended'],
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },
];
