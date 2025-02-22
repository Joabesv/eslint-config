import process from 'node:process';
import { existsSync } from 'node:fs';
import { isPackageExists } from 'local-pkg';
import type {
  Awaitable,
  FlatConfigItem,
  OptionsConfig,
  UserConfigItem,
} from './types';
import {
  comments,
  ignores,
  imports,
  javascript,
  jsdoc,
  jsonc,
  markdown,
  node,
  perfectionist,
  prettier,
  react,
  sortPackageJson,
  sortTsconfig,
  test,
  typescript,
  unicorn,
  vue,
  yaml,
} from './configs';
import { combine, interopDefault } from './utils';

const flatConfigProps: (keyof FlatConfigItem)[] = [
  'files',
  'ignores',
  'languageOptions',
  'linterOptions',
  'processor',
  'plugins',
  'rules',
  'settings',
];

const VuePackages = ['vue', 'nuxt', 'vitepress', '@slidev/cli'];

/**
 * Construct an array of ESLint flat config items.
 */
export async function jsvEslintConfig(
  options: OptionsConfig & FlatConfigItem = {},
  ...userConfigs: Awaitable<UserConfigItem | UserConfigItem[]>[]
): Promise<UserConfigItem[]> {
  const {
    componentExts = [],
    gitignore: enableGitignore = true,
    isInEditor = !!(
      (process.env.VSCODE_PID || process.env.JETBRAINS_IDE) &&
      !process.env.CI
    ),
    overrides = {},
    react: enableReact = false,
    typescript: enableTypeScript = isPackageExists('typescript'),
    vue: enableVue = VuePackages.some((i) => isPackageExists(i)),
  } = options;

  const configs: Awaitable<FlatConfigItem[]>[] = [];

  if (enableGitignore) {
    if (typeof enableGitignore !== 'boolean') {
      configs.push(
        interopDefault(import('eslint-config-flat-gitignore')).then((r) => [
          r(enableGitignore),
        ]),
      );
    } else {
      if (existsSync('.gitignore'))
        configs.push(
          interopDefault(import('eslint-config-flat-gitignore')).then((r) => [
            r(),
          ]),
        );
    }
  }

  // Base configs
  configs.push(
    ignores(),
    javascript({
      isInEditor,
      overrides: overrides.javascript,
    }),
    comments(),
    node(),
    jsdoc(),
    imports(),
    unicorn(),

    // Optional plugins (installed but not enabled by default)
    perfectionist(),
    prettier(),
  );

  if (enableVue) componentExts.push('vue');

  if (enableTypeScript) {
    configs.push(
      typescript({
        ...(typeof enableTypeScript !== 'boolean' ? enableTypeScript : {}),
        componentExts,
        overrides: overrides.typescript,
      }),
    );
  }

  if (options.test ?? true) {
    configs.push(
      test({
        isInEditor,
        overrides: overrides.test,
      }),
    );
  }

  if (enableVue) {
    configs.push(
      vue({
        overrides: overrides.vue,
        typescript: !!enableTypeScript,
      }),
    );
  }

  if (enableReact) {
    configs.push(
      react({
        overrides: overrides.react,
        typescript: !!enableTypeScript,
      }),
    );
  }

  if (options.jsonc ?? true) {
    configs.push(
      jsonc({
        overrides: overrides.jsonc,
      }),
      sortPackageJson(),
      sortTsconfig(),
    );
  }

  if (options.yaml ?? true) {
    configs.push(
      yaml({
        overrides: overrides.yaml,
      }),
    );
  }

  if (options.markdown ?? true) {
    configs.push(
      markdown({
        componentExts,
        overrides: overrides.markdown,
      }),
    );
  }

  if (options.prettier ?? true) {
    configs.push(
      prettier({
        overrides: overrides.prettier,
      }),
    );
  }

  // User can optionally pass a flat config item to the first argument
  // We pick the known keys as ESLint would do schema validation
  const fusedConfig = flatConfigProps.reduce((acc, key) => {
    if (key in options) acc[key] = options[key] as any;
    return acc;
  }, {} as FlatConfigItem);
  if (Object.keys(fusedConfig).length) configs.push([fusedConfig]);

  const merged = combine(...configs, ...userConfigs);

  return merged;
}
