import c from 'picocolors';
import { devDependencies, version } from '../../package.json';

export const ARROW = c.cyan('→');
export const CHECK = c.green('✔');
export const CROSS = c.red('✘');
export const WARN = c.yellow('ℹ');

export const eslintVersion = devDependencies.eslint;
export { version };

export const vscodeSettingsString = `
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
`;
