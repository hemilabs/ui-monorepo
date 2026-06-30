import type { Meta, StoryObj } from '@storybook/nextjs'
import { Link } from 'components/link'
import { NextIntlClientProvider } from 'next-intl'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'

const meta = {
  argTypes: {
    children: { control: 'text' },
    href: { control: 'text' },
  },
  component: Link,
  decorators: [
    Story => (
      <NextIntlClientProvider locale="en" messages={{}}>
        <NuqsTestingAdapter>
          <Story />
        </NuqsTestingAdapter>
      </NextIntlClientProvider>
    ),
  ],
  title: 'Components/Link',
} satisfies Meta<typeof Link>

export default meta

type Story = StoryObj<typeof Link>

export const Default: Story = {
  args: {
    children: 'Go to Tunnel',
    className: 'hoverable-text',
    href: '/tunnel',
  },
}
