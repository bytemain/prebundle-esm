import { build, Plugin } from "esbuild";
import { ParsedTask } from "./types.js";
import { DEFAULT_ESBUILD_EXTERNALS } from "./constant.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { dirname: __dirname } = import.meta;

// https://github.com/evanw/esbuild/issues/744
const cjs_to_esm_plugin: Plugin = {
    name: 'cjs-to-esm',
    setup(build) {
        build.onResolve({ filter: /.*/ }, args => {
            if (args.importer === '') return { path: args.path, namespace: 'c2e' }
        })
        build.onLoad({ filter: /.*/, namespace: 'c2e' }, args => {
            const keys = Object.keys(require(args.path)).join(', ')
            const path = JSON.stringify(args.path)
            const resolveDir = __dirname
            return { contents: `export { ${keys} } from ${path}`, resolveDir }
        })
    },
}

export async function esbuild(task: ParsedTask) {
    const buildResult = await build({
        entryPoints: [task.depEntry],
        minify: task.minify,
        target: task.target,
        alias: task.esbuildAlias,
        format: task.format,
        platform: task.esbuildPlatform,
        write: false,
        bundle: true,
        external: [...DEFAULT_ESBUILD_EXTERNALS, ...(task.esbuildExternal || [])],
        plugins: [cjs_to_esm_plugin],
    });

    return buildResult;
}