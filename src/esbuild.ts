import { build, Plugin } from "esbuild";
import { ParsedTask } from "./types.js";
import { DEFAULT_ESBUILD_EXTERNALS, NODE_BUILTINS } from "./constant.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { dirname: __dirname } = import.meta;

function createCjsToEsmPlugin(task: ParsedTask): Plugin {
    // https://github.com/evanw/esbuild/issues/744
    // https://github.com/evanw/esbuild/issues/442
    const cjs_to_esm_plugin: Plugin = {
        name: 'cjs-to-esm',
        setup(build) {
            build.onResolve({ filter: /.*/ }, args => {
                // importer 为空时，表示入口文件
                if (args.importer === '') return { path: args.path, namespace: 'c2e' }
            })
            build.onLoad({ filter: /.*/, namespace: 'c2e' }, args => {
                const keys = Object.keys(require(args.path)).join(', ')
                const path = JSON.stringify(args.path)
                const resolveDir = __dirname
                return {
                    contents: `
export { ${keys} } from ${path};
${task.esbuildExportStarAsDefault ? `
import * as _default from ${path};
export default _default;
` : ''}
`, resolveDir
                }
            })
        },
    }
    return cjs_to_esm_plugin
}

export async function esbuild(task: ParsedTask) {
    const plugins: Plugin[] = [];
    if (task.esbuildExportCjsNamedExport) {
        plugins.push(createCjsToEsmPlugin(task));
    }

    const buildResult = await build({
        entryPoints: [task.depEntry],
        minify: task.minify,
        target: task.target,
        alias: task.esbuildAlias,
        format: task.esbuildFormat,
        platform: task.esbuildPlatform,
        write: false,
        bundle: true,
        external: [...DEFAULT_ESBUILD_EXTERNALS, ...NODE_BUILTINS, ...(task.esbuildExternal || [])],
        plugins,
    });

    return buildResult;
}