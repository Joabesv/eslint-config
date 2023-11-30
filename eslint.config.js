// @ts-check
import { jsvEslintConfig } from './dist/index.js';

export default jsvEslintConfig(
  {
    vue: true,
    typescript: true,
    ignores: ['fixtures', '_fixtures'],
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'perfectionist/sort-objects': 'error',
    },
  },
);
