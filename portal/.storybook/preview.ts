import type { Preview } from '@storybook/nextjs'
import { createElement } from 'react'
import { SkeletonTheme } from 'react-loading-skeleton'

// Import skeleton.css before globals.css so Tailwind utilities (e.g. w-16) win
// over `.react-loading-skeleton { width: 100% }`. layout.tsx imports them the
// other way, but Next reorders the compiled bundle to this effective order;
// Storybook keeps the literal order, so we replicate the app's cascade here.
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
