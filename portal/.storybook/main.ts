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
  viteFinal: viteConfig => ({
    ...viteConfig,
    // Vite would otherwise copy the whole of `public`, which is what makes
    // the promise above about `staticDirs` true rather than aspirational.
    publicDir: false,
  }),
}

export default config
