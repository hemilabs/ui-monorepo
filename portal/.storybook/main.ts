import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  addons: ['storybook-addon-pseudo-states'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // globals.css is the only font source and points at /fonts, and ChainLogo
  // points at /hemi.svg; Storybook does not serve either on its own. Scoped to
  // `fonts` and `hemi.svg` so nothing else under `public` (the video, the
  // favicon) gets published in the Storybook build.
  staticDirs: [
    { from: '../public/fonts', to: '/fonts' },
    { from: '../public/hemi.svg', to: '/hemi.svg' },
  ],
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  viteFinal: viteConfig => ({
    ...viteConfig,
    // Vite would otherwise copy the whole of `public`, which is what makes
    // the promise above about `staticDirs` true rather than aspirational.
    publicDir: false,
  }),
}

export default config
