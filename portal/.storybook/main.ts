import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  addons: ['storybook-addon-pseudo-states'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  // `next/font/local` registers the @font-face rules but @storybook/nextjs does
  // not emit the font files, so serve the whole `fonts` directory at the path
  // the generated rules reference (`/fonts/...`) to keep the app typography.
  staticDirs: [{ from: '../fonts', to: '/fonts' }],
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
}

export default config
