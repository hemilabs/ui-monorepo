import type { Preview } from '@storybook/nextjs'
import { createElement } from 'react'
import { SkeletonTheme } from 'react-loading-skeleton'

import 'react-loading-skeleton/dist/skeleton.css'
import 'styles/globals.css'

const preview: Preview = {
  // Mirror the SkeletonTheme set on the app root layout so skeleton-based
  // components (e.g. ButtonLoader) render with the same colors in Storybook.
  decorators: [
    Story =>
      createElement(
        SkeletonTheme,
        { baseColor: '#E5E5E5', highlightColor: '#FAFAFA' },
        createElement(Story),
      ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
