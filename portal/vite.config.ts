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
})
