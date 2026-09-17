import { cloudflare } from '@cloudflare/vite-plugin'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type PluginOption } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

import { devnetPositions } from './plugins/devnetPositions'
import { sitemap } from './plugins/sitemap'

const polyfills = () => nodePolyfills({ include: ['http', 'https', 'util'] })

// `run_worker_first` puts workerd in front of the dev proxy, and it stamps its
// own Cloudflare metadata on the request. Forwarded upstream, the real edge
// rejects them as spoofed cf-* headers with a 403, so they are dropped.
const workerdHeaders = [
  'cf-connecting-ip',
  'mf-cf-blob',
  'mf-custom-node-service',
  'x-forwarded-host',
]

const onlyClient = (environment: { name: string }) =>
  environment.name === 'client'

const getLocalBuildInfo = function () {
  try {
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
    }).trim()
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim()
    const dirty = execFileSync('git', ['status', '--porcelain'], {
      encoding: 'utf8',
    }).trim()

    return { branch, version: `${commit}${dirty ? '-dirty' : ''}` }
  } catch {
    return { branch: 'dev', version: 'dev' }
  }
}

const getBuildInfo = function (env: Record<string, string>) {
  const localBuildInfo = getLocalBuildInfo()

  return {
    branch:
      env.VITE_BUILD_BRANCH ||
      process.env.WORKERS_CI_BRANCH ||
      localBuildInfo.branch,
    version:
      env.VITE_BUILD_VERSION ||
      process.env.WORKERS_CI_COMMIT_SHA ||
      localBuildInfo.version,
  }
}

export default defineConfig(function ({ mode }) {
  const env = loadEnv(mode, process.cwd(), '')
  const buildInfo = getBuildInfo(env)

  const instrumentForSentry = !!env.VITE_SENTRY_DSN && !process.env.STORYBOOK

  const plugins: PluginOption[] = [
    react(),
    cloudflare(),
    polyfills(),
    // Dev only, and inert unless a scenario devnet is configured. See the plugin for
    // why the positions cannot come from the subgraph in that mode.
    devnetPositions(env),
  ]

  if (env.PORTAL_SITE_URL) {
    plugins.push(
      sitemap({
        baseUrl: env.PORTAL_SITE_URL,
        includeHemiEarn: env.VITE_ENABLE_HEMI_EARN_PAGE === 'true',
      }),
    )
  }

  if (instrumentForSentry) {
    plugins.push(
      ...sentryVitePlugin({
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
      }).map(plugin => ({
        ...plugin,
        applyToEnvironment: onlyClient,
      })),
    )
  }

  return {
    build: {
      // Only Sentry consumes these, and the plugin above deletes them once it
      // is done, so nothing generates them when it is not running. "hidden"
      // also drops the sourceMappingURL, keeping them out of reach in the
      // window between writing and deleting.
      sourcemap: instrumentForSentry ? 'hidden' : false,
    },
    // stream-http and readable-stream, pulled in by the http/https polyfills,
    // read the bare `global`. The polyfill plugin shims it in the main bundle
    // but not in worker ones.
    define: {
      'global': 'globalThis',
      'import.meta.env.VITE_BUILD_BRANCH': JSON.stringify(buildInfo.branch),
      'import.meta.env.VITE_BUILD_VERSION': JSON.stringify(buildInfo.version),
    },
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
    // portal-api only sends CORS headers to the deployed origins, so a browser request
    // from a dev origin is blocked. Proxying keeps it same-origin and moves the hop to
    // the API server-side, where CORS does not apply. Dev only - the built worker talks
    // to the API directly.
    server: {
      proxy: {
        '/portal-api': {
          changeOrigin: true,
          configure: proxy =>
            proxy.on('proxyReq', proxyReq =>
              workerdHeaders.forEach(header => proxyReq.removeHeader(header)),
            ),
          rewrite: path => path.replace(/^\/portal-api/, ''),
          target: 'https://portal-api.hemi.xyz',
        },
      },
    },
    worker: {
      // Worker bundles get their own plugin pipeline, the top-level `plugins`
      // above do not apply to them.
      format: 'es',
      plugins: () => [polyfills()],
    },
  }
})
