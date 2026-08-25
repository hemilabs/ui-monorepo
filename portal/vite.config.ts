import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const polyfills = () => nodePolyfills({ include: ['http', 'https', 'util'] })

export default defineConfig({
  // Not for our code: stream-http and readable-stream, which the http/https
  // polyfills pull in, read the bare `global` at module scope. The plugin
  // injects its shim into the main bundle but not into worker ones, so without
  // this the workers throw ReferenceError as soon as they hit the network.
  define: { global: 'globalThis' },
  plugins: [react(), polyfills()],
  resolve: {
    // packages/btc-wallet reaches for the `Buffer` global, and the plugin
    // injects its shim into that file. The shim only resolves from here,
    // where the plugin is installed, so point at it explicitly.
    alias: {
      'vite-plugin-node-polyfills/shims/buffer': fileURLToPath(
        import.meta.resolve('vite-plugin-node-polyfills/shims/buffer'),
      ),
    },
    tsconfigPaths: true,
  },
  worker: {
    // Worker bundles get their own plugin pipeline, the top-level `plugins`
    // above do not apply to them.
    format: 'es',
    plugins: () => [polyfills()],
  },
})
