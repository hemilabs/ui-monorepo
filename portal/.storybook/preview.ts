import type { Preview } from '@storybook/react-vite'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { createElement } from 'react'
import { SkeletonTheme } from 'react-loading-skeleton'

import 'react-loading-skeleton/dist/skeleton.css'
import 'styles/globals.css'

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
    (Story, { parameters }) =>
      createElement(
        NuqsTestingAdapter,
        { searchParams: parameters.searchParams },
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
