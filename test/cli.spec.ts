import { join } from 'node:path';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { execa } from 'execa';
import { ensureDir } from 'fs-extra';
import { afterAll, beforeEach, expect, it } from 'vitest';

const CLI_PATH = join(__dirname, '../bin/index.js');
const genPath = join(__dirname, '..', '.temp');

async function run(
  env = {
    SKIP_PROMPT: '1',
    SKIP_GIT_CHECK: '1',
  },
) {
  return execa(`node`, [CLI_PATH, 'migrate'], {
    cwd: genPath,
    env: {
      ...process.env,
      NO_COLOR: '1',
      ...env,
    },
  });
}

async function createMockDir() {
  await rm(genPath, { recursive: true, force: true });
  await ensureDir(genPath);

  await Promise.all([
    writeFile(join(genPath, 'package.json'), JSON.stringify({}, null, 2)),
    writeFile(join(genPath, '.eslintrc.yml'), ''),
    writeFile(join(genPath, '.eslintignore'), 'some-path\nsome-file'),
    writeFile(join(genPath, '.prettierc'), ''),
    writeFile(join(genPath, '.prettierignore'), 'some-path\nsome-file'),
  ]);
}

beforeEach(async () => await createMockDir());
afterAll(async () => await rm(genPath, { recursive: true, force: true }));

it('package.json updated', async () => {
  const { stdout } = await run();
  const path = join(genPath, 'package.json');
  const pkgContent = JSON.parse(await readFile(path, 'utf8'));

  expect(JSON.stringify(pkgContent.devDependencies)).toContain(
    '@joabesv/eslint-config',
  );
  expect(stdout).toContain('changes wrote to package.json');
});

it('esm eslint.config.js', async () => {
  const pkgContent = await readFile('package.json', 'utf-8');
  await writeFile(
    join(genPath, 'package.json'),
    JSON.stringify({ ...JSON.parse(pkgContent), type: 'module' }, null, 2),
  );

  const { stdout } = await run();

  const eslintConfigContent = await readFile(
    join(genPath, 'eslint.config.js'),
    'utf-8',
  );
  expect(eslintConfigContent.includes('export default')).toBeTruthy();
  expect(stdout).toContain('created eslint.config.js');
});

it('cjs eslint.config.js', async () => {
  const { stdout } = await run();

  const eslintConfigContent = await readFile(
    join(genPath, 'eslint.config.js'),
    'utf-8',
  );
  expect(eslintConfigContent.includes('module.exports')).toBeTruthy();
  expect(stdout).toContain('created eslint.config.js');
});

it('ignores files added in eslint.config.js', async () => {
  const { stdout } = await run();

  const eslintConfigContent = (
    await readFile(join(genPath, 'eslint.config.js'), 'utf-8')
  ).replace(/\\/g, '/');

  expect(stdout).toContain('created eslint.config.js');
  expect(eslintConfigContent).toMatchInlineSnapshot(`
      "const jsvEslintConfig = require('@joabesv/eslint-config').default

      module.exports = jsvEslintConfig({
      ignores: [\\"some-path\\",\\"**/some-path/**\\",\\"some-file\\",\\"**/some-file/**\\"]
      })
      "
    `);
});

it('suggest remove unnecessary files', async () => {
  const { stdout } = await run();

  expect(stdout).toContain('you can now remove those files manually');
  expect(stdout).toContain(
    '.eslintignore, .eslintrc.yml, .prettierc, .prettierignore, eslint.config.js',
  );
});
