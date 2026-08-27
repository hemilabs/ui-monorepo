import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type PluginOption } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const polyfills = () => nodePolyfills({ include: ['http', 'https', 'util'] })

export default defineConfig(function ({ mode }) {
  // `process.env` never sees the `.env` files here, unlike under Next, and the
  // filter key only lives there: no CI job passes it.
  const env = loadEnv(mode, process.cwd(), '')

  const plugins: PluginOption[] = [react(), polyfills()]

  if (env.VITE_SENTRY_DSN) {
    plugins.push(
      sentryVitePlugin({
        applicationKey: env.VITE_SENTRY_FILTER_KEY_ID,
        authToken: env.SENTRY_AUTH_TOKEN,
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
        reactComponentAnnotation: { enabled: true },
        release:
          env.SENTRY_ENVIRONMENT && env.VITE_SENTRY_RELEASE
            ? {
                deploy: { env: env.SENTRY_ENVIRONMENT },
                name: env.VITE_SENTRY_RELEASE,
              }
            : undefined,
        // The maps exist only long enough to be uploaded, so the bundle never
        // ships the sources. The plugin deletes them even when no upload
        // happened, which is why this is unconditional. Anchored to this file
        // rather than the cwd, since the glob is resolved against wherever the
        // build was started from.
        sourcemaps: {
          filesToDeleteAfterUpload: [
            fileURLToPath(new URL('dist/**/*.map', import.meta.url)),
          ],
        },
        telemetry: false,
      }),
    )
  }

  return {
    build: {
      // Only Sentry consumes these, and the plugin above deletes them once it
      // is done, so nothing generates them when it is not running. "hidden"
      // also drops the sourceMappingURL, keeping them out of reach in the
      // window between writing and deleting.
      sourcemap: env.VITE_SENTRY_DSN ? 'hidden' : false,
    },
    // Not for our code: stream-http and readable-stream, which the http/https
    // polyfills pull in, read the bare `global` at module scope. The plugin
    // injects its shim into the main bundle but not into worker ones, so without
    // this the workers throw ReferenceError as soon as they hit the network.
    define: { global: 'globalThis' },
    plugins,
    resolve: {
      // The plugin injects its shims into whichever file touches `Buffer`,
      // `global` or `process`, including files under packages/, where the plugin
      // is not installed and the import cannot resolve. Mapping all three keeps
      // the next one from failing the build the same way.
      alias: ['buffer', 'global', 'process'].map(shim => ({
        find: `vite-plugin-node-polyfills/shims/${shim}`,
        replacement: fileURLToPath(
          import.meta.resolve(`vite-plugin-node-polyfills/shims/${shim}`),
        ),
      })),
      tsconfigPaths: true,
    },
    worker: {
      // Worker bundles get their own plugin pipeline, the top-level `plugins`
      // above do not apply to them.
      format: 'es',
      plugins: () => [polyfills()],
    },
  }
})
