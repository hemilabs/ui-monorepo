import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const polyfills = () => nodePolyfills({ include: ['http', 'https', 'util'] })

export default defineConfig({
  define: { global: 'globalThis' },
  plugins: [react(), polyfills()],
  resolve: { tsconfigPaths: true },
  worker: {
    format: 'es',
    plugins: () => [polyfills()],
  },
})
