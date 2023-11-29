# @Joabesv/eslint-config

[![npm](https://img.shields.io/npm/v/@antfu/eslint-config?color=444&label=)](https://npmjs.com/package/@antfu/eslint-config) [![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config)

- Single quotes, no semi
- Designed to work with TypeScript, JSX, Vue out-of-box
- Lints also for json, yaml, markdown
- Sorted imports, dangling commas
- Reasonable defaults, best practices, only one-line of config
- Respects `.gitignore` by default
- [ESLint Flat config](https://eslint.org/docs/latest/use/configure/configuration-files-new), compose easily!
- **Style principle**: Minimal for reading, stable for diff, consistent


## Usage

### Install

```bash
pnpm i -D eslint @joabesv/eslint-config
```

### Create config file

With [`"type": "module"`](https://nodejs.org/api/packages.html#type) in `package.json` (recommended):

```js
// eslint.config.js
import { jsvEslintConfig } from '@joabesv/eslint-config'

export default jsvEslintConfig()
```

With CJS:

```js
// eslint.config.js
const { jsvEslintConfig } = require('@joabesv/eslint-config').default

module.exports = jsvEslintConfig()
```

Combined with legacy config:

> Note that `.eslintignore` no longer works in Flat config, see [customization](#customization) for more details.

### Add script for package.json

For example:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

### Migration

We provided an experimental CLI tool to help you migrate from the legacy config to the new flat config.

```bash
npx @joabesv/eslint-config@latest
```

Before running the migration, make sure to commit your unsaved changes first.

## VS Code support (auto fix)

Install [VS Code ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

Add the following settings to your `.vscode/settings.json`:

```jsonc
{
  // Enable the ESlint flat config support
  "eslint.experimental.useFlatConfig": true,

  "prettier.enable": true,
  "editor.formatOnSave": false,

  // Auto fix
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },

  // Enable eslint for all supported languages
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue",
    "html",
    "markdown",
    "json",
    "jsonc",
    "yaml"
  ]
}
```

## Customization

You can configure each integration individually, for example:

```js
// eslint.config.js
import { jsvEslintConfig } from '@joabesv/eslint-config'


export default await jsvEslintConfig({
  // TypeScript and Vue are auto-detected, you can also explicitly enable them:
  typescript: true,
  vue: true,

  // Disable jsonc and yaml support
  jsonc: false,
  yaml: false,

  // `.eslintignore` is no longer supported in Flat config, use `ignores` instead
  ignores: [
    './fixtures',
    // ...globs
  ]
})
```

The `jsvEslintConfig` factory function also accepts any number of arbitrary custom config overrides:

```js
// eslint.config.js
import { jsvEslintConfig } from '@joabesv/eslint-config'

export default await jsvEslintConfig(
  {
    // Configures for jsv's config
  },

  // From the second arguments they are ESLint Flat Configs
  // you can have multiple configs
  {
    files: ['**/*.ts'],
    rules: {},
  },
  {
    rules: {},
  },
)
```

Going more advanced, you can also import fine-grained configs and compose them as you wish:

<details>
<summary>Advanced Example</summary>

We don't recommend using this style in general usages, as there are shared options between configs and might need extra care to make them consistent.

```js
// eslint.config.js
import {
  combine,
  comments,
  ignores,
  imports,
  javascript,
  jsdoc,
  jsonc,
  markdown,
  node,
  sortPackageJson,
  sortTsconfig,
  typescript,
  unicorn,
  vue,
  yaml,
} from '@joabesv/eslint-config'

export default await combine(
  ignores(),
  javascript(/* Options */),
  comments(),
  node(),
  jsdoc(),
  imports(),
  unicorn(),
  typescript(/* Options */),
  vue(),
  jsonc(),
  yaml(),
  markdown(),
)
```

</details>

Check out the [configs](https://github.com/Joabesv/eslint-config/blob/main/src/configs) and [factory](https://github.com/Joabesv/eslint-config/blob/main/src/factory.ts) for more details.

> Thanks to [sxzz/eslint-config](https://github.com/sxzz/eslint-config) for the inspiration and reference.

### Plugins Renaming

Since flat config requires us to explicitly provide the plugin names (instead of mandatory convention from npm package name), we renamed some plugins to make overall scope more consistent and easier to write.

| New Prefix | Original Prefix | Source Plugin |
| --- | --- | --- |
| `import/*` | `i/*` | [eslint-plugin-i](https://github.com/un-es/eslint-plugin-i) |
| `node/*` | `n/*` | [eslint-plugin-n](https://github.com/eslint-community/eslint-plugin-n) |
| `yaml/*` | `yml/*` | [eslint-plugin-yml](https://github.com/ota-meshi/eslint-plugin-yml) |
| `ts/*` | `@typescript-eslint/*` | [@typescript-eslint/eslint-plugin](https://github.com/typescript-eslint/typescript-eslint) |
| `test/*` | `vitest/*` | [eslint-plugin-vitest](https://github.com/veritem/eslint-plugin-vitest) |
| `test/*` | `no-only-tests/*` | [eslint-plugin-no-only-tests](https://github.com/levibuzolic/eslint-plugin-no-only-tests) |

When you want to override rules, or disable them inline, you need to update to the new prefix:

```diff
-// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
+// eslint-disable-next-line ts/consistent-type-definitions
type foo = { bar: 2 }
```

### Rules Overrides

Certain rules would only be enabled in specific files, for example, `ts/*` rules would only be enabled in `.ts` files and `vue/*` rules would only be enabled in `.vue` files. If you want to override the rules, you need to specify the file extension:

```js
// eslint.config.js
import { jsvEslintConfig } from '@joabesv/eslint-config'

export default await jsvEslintConfig(
  { vue: true, typescript: true },
  {
    // Remember to specify the file glob here, otherwise it might cause the vue plugin to handle non-vue files
    files: ['**/*.vue'],
    rules: {
      'vue/operator-linebreak': ['error', 'before'],
    },
  },
  {
    // Without `files`, they are general rules for all files
    rules: {
      'style/semi': ['error', 'never'],
    },
  }
)
```

We also provided a `overrides` options to make it easier:

```js
// eslint.config.js
import { jsvEslintConfig } from '@joabesv/eslint-config'

export default jsvEslintConfig({
  overrides: {
    vue: {
      'vue/operator-linebreak': ['error', 'before'],
    },
    typescript: {
      'ts/consistent-type-definitions': ['error', 'interface'],
    },
    yaml: {},
    // ...
  }
})
```

### Optional Configs

We provide some optional configs for specific use cases, that we don't include their dependencies by default.

#### React

To enable React support, need to explicitly turn it on:

```js
// eslint.config.js
import { jsvEslintConfig } from '@joabesv/eslint-config'

export default jsvEslintConfig({
  react: true,
})
```

Running `npx eslint` should prompt you to install the required dependencies, otherwise, you can install them manually:

```bash
pnpm i -D eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh
```

### Optional Rules

This config also provides some optional plugins/rules for extended usages.

#### `perfectionist` (sorting)

This plugin [`eslint-plugin-perfectionist`](https://github.com/azat-io/eslint-plugin-perfectionist) allows you to sorted object keys, imports, etc, with auto-fix.

The plugin is installed but no rules are enabled by default. 

It's recommended to opt-in on each file individually using [configuration comments](https://eslint.org/docs/latest/use/configure/rules#using-configuration-comments-1).

```js
/* eslint perfectionist/sort-objects: "error" */
const objectWantedToSort = {
  a: 2,
  b: 1,
  c: 3,
}
/* eslint perfectionist/sort-objects: "off" */
```

### Type Aware Rules

You can optionally enable the [type aware rules](https://typescript-eslint.io/linting/typed-linting/) by passing the options object to the `typescript` config:

```js
// eslint.config.js
import { jsvEslintConfig } from '@joabesv/eslint-config'

export default jsvEslintConfig({
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
})
```

### Lint Staged

If you want to apply lint and auto-fix before every commit, you can add the following to your `package.json`:

```json
{
  "simple-git-hooks": {
    "pre-commit": "pnpm lint-staged"
  },
  "lint-staged": {
    "*": "eslint --fix"
  }
}
```

and then

```bash
pnpm i -D lint-staged simple-git-hooks
```

## Versioning Policy

This project follows [Semantic Versioning](https://semver.org/) for releases. However, since this is just a config and involves opinions and many moving parts, we don't treat rules changes as breaking changes.

### Changes Considered as Breaking Changes

- Node.js version requirement changes
- Huge refactors that might break the config
- Plugins made major changes that might break the config
- Changes that might affect most of the codebases

### Changes Considered as Non-breaking Changes

- Enable/disable rules and plugins (that might become stricter)
- Rules options changes
- Version bumps of dependencies

## Badge

If you enjoy this code style, and would like to mention it in your project, here is the badge you can use:

```md
[![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config)
```

[![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config)

## License

[MIT](./LICENSE) License &copy; 2019-PRESENT [Anthony Fu](https://github.com/antfu)
