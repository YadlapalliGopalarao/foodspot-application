
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { parseEnv } from 'node:util';

import * as esbuild from 'esbuild-wasm';
import { parse, compileScript } from '@vue/compiler-sfc';

// Project configuration
const root = fileURLToPath(new URL('../', import.meta.url));
const mode = process.argv[2] ?? 'build';

if (!['build', 'dev'].includes(mode)) {
    throw new Error('Expected build or dev');
}

const dev = mode === 'dev';

// Environment variables
const env = {};

for (const name of [
    '.env',
    '.env.local',
    dev ? '.env.development' : '.env.production',
    dev ? '.env.development.local' : '.env.production.local'
]) {
    const file = resolve(root, name);

    if (existsSync(file)) {
        Object.assign(env, parseEnv(readFileSync(file, 'utf8')));
    }
}

Object.assign(env, process.env);

const exposed = {
    ...Object.fromEntries(
        Object.entries(env).filter(([key]) => key.startsWith('VITE_'))
    ),
    MODE: dev ? 'development' : 'production',
    DEV: dev,
    PROD: !dev,
    BASE_URL: '/'
};

// Create production directory
const dist = resolve(root, 'dist');

await mkdir(resolve(dist, 'assets'), {
    recursive: true
});

// Generate HTML
await writeFile(resolve(dist, 'index.html'), `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FoodSpot</title>
    <link rel="stylesheet" href="/assets/app.css">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/assets/app.js"></script>
</body>
</html>
`);

// Vue component compiler
const plugin = {
    name: 'vue-script-setup',

    setup(build) {
        build.onLoad({ filter: /\.vue$/ }, async (args) => {
            const source = await readFile(args.path, 'utf8');

            const { descriptor, errors } = parse(source, {
                filename: args.path
            });

            if (errors.length) {
                throw new Error(
                    errors.map(e =>
                        typeof e === 'string' ? e : e.message
                    ).join('\n')
                );
            }

            if (
                !descriptor.scriptSetup ||
                !descriptor.template ||
                descriptor.styles.length ||
                descriptor.customBlocks.length
            ) {
                throw new Error(
                    'Expected script-setup component with global CSS: '
                    + args.path
                );
            }

            const id = createHash('sha256')
                .update(args.path)
                .digest('hex')
                .slice(0, 8);

            const compiled = compileScript(descriptor, {
                id,
                inlineTemplate: true,
                isProd: !dev,
                templateOptions: {
                    isProd: !dev
                }
            });

            return {
                contents: compiled.content,
                loader: 'js',
                resolveDir: dirname(args.path),
                watchFiles: [args.path]
            };
        });
    }
};

// Build configuration
const options = {
    absWorkingDir: root,

    entryPoints: [
        {
            in: 'src/main.js',
            out: 'app'
        }
    ],

    outdir: resolve(dist, 'assets'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2022'],
    minify: !dev,
    sourcemap: dev,

    plugins: [plugin],

    define: {
        'import.meta.env': JSON.stringify(exposed),

        'process.env.NODE_ENV': JSON.stringify(
            dev ? 'development' : 'production'
        ),

        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
    },

    logLevel: 'info'
};

// Node.js development HTTP server
function createDevServer(dist) {

    const files = new Map([
        ['/', ['index.html', 'text/html; charset=utf-8']],
        ['/index.html', ['index.html', 'text/html; charset=utf-8']],
        ['/assets/app.js', ['assets/app.js', 'text/javascript; charset=utf-8']],
        ['/assets/app.css', ['assets/app.css', 'text/css; charset=utf-8']],
        ['/assets/app.js.map', ['assets/app.js.map', 'application/json']],
        ['/assets/app.css.map', ['assets/app.css.map', 'application/json']]
    ]);

    return createServer(async (req, res) => {

        if (!['GET', 'HEAD'].includes(req.method)) {
            res.writeHead(405, {
                Allow: 'GET, HEAD'
            }).end();

            return;
        }

        const file = files.get(
            (req.url ?? '/').split('?')[0]
        );

        if (!file) {
            res.writeHead(404).end('Not found');
            return;
        }

        try {
            const data = await readFile(resolve(dist, file[0]));

            res.writeHead(200, {
                'Content-Type': file[1],
                'Content-Length': data.length,
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'no-store'
            });

            res.end(
                req.method === 'HEAD' ? undefined : data
            );

        } catch (error) {

            res.writeHead(
                error.code === 'ENOENT' ? 404 : 500
            ).end('Unable to read build output');
        }
    });
}

// Development mode
if (dev) {

    const ctx = await esbuild.context(options);
    const server = createDevServer(dist);

    try {

        await ctx.rebuild();
        await ctx.watch();

        server.listen(5173, '127.0.0.1');

        await once(server, 'listening');

        console.log('');
        console.log('FoodSpot development server is running');
        console.log('http://127.0.0.1:5173');
        console.log('Manually refresh browser after saving changes');
        console.log('');

    } catch (error) {

        if (server.listening) {
            server.close();
        }

        await ctx.dispose();
        esbuild.stop();

        throw error;
    }

    let closing = false;

    const close = async () => {

        if (closing) return;

        closing = true;
        server.close();

        try {
            await ctx.dispose();
        } finally {
            esbuild.stop();
        }
    };

    process.once('SIGINT', close);
    process.once('SIGTERM', close);

// Production mode
} else {

    try {

        await esbuild.build(options);

        console.log('Production build completed.');
        console.log('Static production files are in dist/');

    } finally {
        esbuild.stop();
    }
}
