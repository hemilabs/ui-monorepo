import type { Preview } from '@storybook/nextjs'
import { interDisplay, interVariable } from 'fonts/index'
import { createElement } from 'react'
import { SkeletonTheme } from 'react-loading-skeleton'

import 'styles/globals.css'
import 'react-loading-skeleton/dist/skeleton.css'

const preview: Preview = {
  // Mirror the app root layout: expose the Inter font CSS variables (so
  // `globals.css` resolves `font-inter-variable`/`font-inter-display` instead
  // of falling back to a system font) and the SkeletonTheme (so skeleton-based
  // components like ButtonLoader render with the same colors).
  decorators: [
    Story =>
      createElement(
        'div',
        { className: `${interVariable.variable} ${interDisplay.variable}` },
        createElement(
          SkeletonTheme,
          { baseColor: '#E5E5E5', highlightColor: '#FAFAFA' },
          createElement(Story),
        ),
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
