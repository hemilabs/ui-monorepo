import type { Meta, StoryObj } from '@storybook/react-vite'
import { PageTitle } from 'components/pageTitle'

const meta = {
  args: {
    subtitle: 'Learn and explore with Hemi developer demos',
    title: 'Demos',
  },
  argTypes: {
    subtitle: { control: 'text' },
    title: { control: 'text' },
  },
  component: PageTitle,
  title: 'Components/Page Title',
} satisfies Meta<typeof PageTitle>

export default meta

type Story = StoryObj<typeof PageTitle>

export const Default: Story = {}

export const WithoutSubtitle: Story = {
  args: {
    subtitle: undefined,
  },
}
