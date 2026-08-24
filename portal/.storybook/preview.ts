import type { Preview } from '@storybook/nextjs'
import { createElement } from 'react'
import { SkeletonTheme } from 'react-loading-skeleton'

import 'styles/globals.css'
import 'react-loading-skeleton/dist/skeleton.css'

const preview: Preview = {
  // Mirrors the SkeletonTheme in app/[locale]/layout.tsx, so skeleton-based
  // components like ButtonLoader render with the same colors.
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
