// @ts-expect-error Missing types
import * as configPrettier from 'eslint-config-prettier';

import type {
  FlatConfigItem,
  OptionsComponentExts,
  OptionsFiles,
  OptionsOverrides,
} from '../../types';
import { pluginPrettier } from '../../plugins';

const prettierConflictRules = { ...configPrettier.rules };
delete prettierConflictRules['vue/html-self-closing'];

export async function prettier(
  options: OptionsFiles & OptionsComponentExts & OptionsOverrides = {},
): Promise<FlatConfigItem[]> {
  const { overrides = {} } = options;

  return [
    {
      name: 'joabesv:prettier',
      plugins: {
        prettier: pluginPrettier,
      },
      rules: {
        ...prettierConflictRules,
        // @ts-expect-error Library types problem
        ...pluginPrettier.configs!.recommended.rules,
        'prettier/prettier': 'error',
        ...overrides,
      },
    },
  ];
}
