import { withoutVitePlugins } from '@storybook/builder-vite'
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  addons: ['storybook-addon-pseudo-states'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // globals.css is the only font source and points at /fonts, which Storybook
  // does not serve on its own. Scoped to `fonts` so nothing else under `public`
  // (the video, the favicon) gets published in the Storybook build.
  staticDirs: [{ from: '../public/fonts', to: '/fonts' }],
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  viteFinal: async viteConfig => ({
    ...viteConfig,
    // Storybook is not a release: with a DSN set, the plugin would upload
    // this bundle as the app's own, and delete the app's sourcemaps on its
    // way out.
    plugins: await withoutVitePlugins(viteConfig.plugins, [
      'sentry-vite-plugin',
    ]),
    // Vite would otherwise copy the whole of `public`, which is what makes
    // the promise above about `staticDirs` true rather than aspirational.
    publicDir: false,
  }),
}

export default config
