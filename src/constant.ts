import { builtinModules } from 'node:module';

export const DIST_DIR = 'compiled';

export const DEFAULT_EXTERNALS = {
  // ncc bundled wrong package.json, using external to avoid this problem
  './package.json': './package.json',
  '../package.json': './package.json',
  '../../package.json': './package.json',
};

export const DEFAULT_ESBUILD_EXTERNALS = ['electron'];

export const NODE_BUILTINS = [
  ...builtinModules
];

builtinModules.forEach((builtin) => {
  NODE_BUILTINS.push(`node:${builtin}`);
});

export const cwd = process.cwd();
