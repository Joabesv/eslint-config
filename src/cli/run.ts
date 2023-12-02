/* eslint-disable no-console */
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import prompts, { type Answers } from 'prompts';
import c from 'picocolors';

// @ts-expect-error missing types
import parse from 'parse-gitignore';

import {
  ARROW,
  CHECK,
  WARN,
  eslintVersion,
  version,
  vscodeSettingsString,
} from './constants';
import { isGitClean } from './utils';

export interface RuleOptions {
  /**
   * Skip prompts and use default values
   */
  yes?: boolean;
}

export async function run(options: RuleOptions = {}) {
  const SKIP_PROMPT = !!process.env.SKIP_PROMPT || options.yes;
  const SKIP_GIT_CHECK = !!process.env.SKIP_GIT_CHECK;

  const cwd = process.cwd();

  const pathFlatConfig = join(cwd, 'eslint.config.js');
  const pathPackageJSON = join(cwd, 'package.json');
  const pathESLintIgnore = join(cwd, '.eslintignore');

  if (existsSync(pathFlatConfig)) {
    console.log(
      c.yellow(
        `${WARN} eslint.config.js already exists, migration wizard exited.`,
      ),
    );
    return;
  }

  if (!SKIP_GIT_CHECK && !isGitClean())
    throw new Error(
      'There are uncommitted changes in the current repository, please commit them and try again',
    );

  // Update package.json
  console.log(c.cyan(`${ARROW} bumping @joabesv/eslint-config to v${version}`));
  const pkgContent = await readFile(pathPackageJSON, 'utf-8');
  const pkg = JSON.parse(pkgContent);

  pkg.devDependencies ??= {};
  pkg.devDependencies['@joabesv/eslint-config'] = `^${version}`;

  if (!pkg.devDependencies.eslint) pkg.devDependencies.eslint = eslintVersion;

  await writeFile(pathPackageJSON, JSON.stringify(pkg, null, 2));
  console.log(c.green(`${CHECK} changes wrote to package.json`));

  // End update package.json
  // Update eslint files
  const eslintIgnores: string[] = [];
  if (existsSync(pathESLintIgnore)) {
    console.log(c.cyan(`${ARROW} migrating existing .eslintignore`));
    const content = await readFile(pathESLintIgnore, 'utf-8');
    const parsed = parse(content);
    const globs = parsed.globs();

    for (const glob of globs) {
      if (glob.type === 'ignore') eslintIgnores.push(...glob.patterns);
      else if (glob.type === 'unignore')
        eslintIgnores.push(
          ...glob.patterns.map((pattern: string) => `!${pattern}`),
        );
    }
  }

  let eslintConfigContent: string = '';

  const joabesvConfig = `${
    eslintIgnores.length ? `ignores: ${JSON.stringify(eslintIgnores)}` : ''
  }`;
  if (pkg.type === 'module') {
    eslintConfigContent = `
import { jsvEslintConfig } from '@joabesv/eslint-config'

export default jsvEslintConfig({\n${joabesvConfig}\n})
`.trimStart();
  } else {
    eslintConfigContent = `
const jsvEslintConfig = require('@joabesv/eslint-config').default

module.exports = jsvEslintConfig({\n${joabesvConfig}\n})
`.trimStart();
  }

  await writeFile(pathFlatConfig, eslintConfigContent);
  console.log(c.green(`${CHECK} created eslint.config.js`));

  const files = readdirSync(cwd);
  const legacyConfig: string[] = [];
  files.forEach((file) => {
    if (file.includes('eslint') || file.includes('prettier'))
      legacyConfig.push(file);
  });
  if (legacyConfig.length) {
    console.log(`${WARN} you can now remove those files manually:`);
    console.log(`   ${c.dim(legacyConfig.join(', '))}`);
  }

  // End update eslint files
  // Update .vscode/settings.json
  let promptResult: Answers<'updateVscodeSettings'> = {
    updateVscodeSettings: true,
  };

  if (!SKIP_PROMPT) {
    try {
      promptResult = await prompts(
        {
          initial: true,
          message:
            'Update .vscode/settings.json for better VS Code experience?',
          name: 'updateVscodeSettings',
          type: 'confirm',
        },
        {
          onCancel: () => {
            throw new Error(`Cancelled`);
          },
        },
      );
    } catch (cancelled: any) {
      console.log(cancelled.message);
      return;
    }
  }

  if (promptResult?.updateVscodeSettings ?? true) {
    const dotVscodePath = join(cwd, '.vscode');
    const settingsPath = join(dotVscodePath, 'settings.json');

    if (!existsSync(dotVscodePath))
      await mkdir(dotVscodePath, { recursive: true });

    if (!existsSync(settingsPath)) {
      await writeFile(settingsPath, `{${vscodeSettingsString}}\n`, 'utf-8');
      console.log(c.green(`${CHECK} created .vscode/settings.json`));
    } else {
      let settingsContent = await readFile(settingsPath, 'utf8');

      settingsContent = settingsContent.trim().replace(/\s*}$/, '');
      settingsContent +=
        settingsContent.endsWith(',') || settingsContent.endsWith('{')
          ? ''
          : ',';
      settingsContent += `${vscodeSettingsString}}\n`;

      await writeFile(settingsPath, settingsContent, 'utf-8');
      console.log(c.green(`${CHECK} updated .vscode/settings.json`));
    }
  }

  // End update .vscode/settings.json
  console.log(c.green(`${CHECK} migration completed`));
  console.log(
    `Now you can update the dependencies and run ${c.blue('eslint . --fix')}\n`,
  );
}
