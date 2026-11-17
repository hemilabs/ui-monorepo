import type { Preview } from '@storybook/react-vite'
import messages from 'messages/en.json'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { createElement } from 'react'
import { SkeletonTheme } from 'react-loading-skeleton'
import { IntlProvider } from 'use-intl'

import 'react-loading-skeleton/dist/skeleton.css'
import 'styles/globals.css'

const preview: Preview = {
  decorators: [
    Story =>
      createElement(
        IntlProvider,
        { locale: 'en', messages },
        createElement(Story),
      ),
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
