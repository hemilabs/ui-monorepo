import react from '@vitejs/plugin-react'
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
  resolve: { tsconfigPaths: true },
  worker: {
    // Worker bundles get their own plugin pipeline, the top-level `plugins`
    // above do not apply to them.
    format: 'es',
    plugins: () => [polyfills()],
  },
})
