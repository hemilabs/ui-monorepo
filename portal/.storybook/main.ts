import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  addons: ['storybook-addon-pseudo-states'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  // `next/font/local` registers the @font-face rules but @storybook/nextjs does
  // not emit the font files, so serve the `inter` asset directory at the path
  // the generated rules reference (`/fonts/inter/...`) to keep the app
  // typography. Only `inter` is served so source files (e.g. `fonts/index.ts`)
  // are not published in the Storybook build.
  staticDirs: [{ from: '../fonts/inter', to: '/fonts/inter' }],
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
}

export default config
