import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  addons: ['storybook-addon-pseudo-states'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  // globals.css is the only font source and points at /fonts, which Storybook
  // does not serve on its own. Scoped to `fonts` so nothing else under `public`
  // (the video, the favicon) gets published in the Storybook build.
  staticDirs: [{ from: '../public/fonts', to: '/fonts' }],
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
}

export default config
