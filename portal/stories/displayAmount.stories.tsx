import type { Meta, StoryObj } from '@storybook/react-vite'
import { DisplayAmount } from 'components/displayAmount'
import { hemiMainnet } from 'networks/hemiMainnet'
import { type ReactNode } from 'react'
import { expect, screen, waitFor } from 'storybook/test'
import { sanitizeAmount } from 'utils/form'
import { getTokenBySymbol } from 'utils/token'

const hemiToken = getTokenBySymbol('HEMI', hemiMainnet.id)

if (!hemiToken) {
  throw new Error('HEMI is missing from the token list')
}

const meta = {
  args: {
    amount: '1234.567891234',
    logoVersion: 'default',
    showSymbol: true,
    showTokenLogo: true,
    showTooltip: true,
    token: hemiToken,
  },
  argTypes: {
    amount: { control: 'text' },
    amountContainer: { control: false },
    container: { control: false },
    logoVersion: {
      control: 'inline-radio',
      options: ['default', 'L1'],
    },
    symbolContainer: { control: false },
    token: { control: false },
  },
  component: DisplayAmount,
  parameters: {
    layout: 'centered',
  },
  render: function Render(args) {
    const result = sanitizeAmount(args.amount)
    if ('error' in result) {
      return <span>{result.error}</span>
    }
    return <DisplayAmount {...args} amount={result.value} />
  },
  title: 'Components/Display Amount',
} satisfies Meta<typeof DisplayAmount>

export default meta

type Story = StoryObj<typeof DisplayAmount>

const openTooltip: Story['play'] = ({ canvas, userEvent }) =>
  waitFor(async function () {
    await userEvent.hover(canvas.getByText(hemiToken.symbol))
    await expect(screen.getByRole('tooltip')).toBeVisible()
  })

export const Default: Story = {}

export const LargeAmount: Story = {
  args: { amount: '82400000.123456789' },
}

export const AmountBelowOne: Story = {
  args: { amount: '0.123456789012345678' },
}

export const BelowPrecision: Story = {
  args: { amount: '0.0000001' },
}

export const Zero: Story = {
  args: { amount: '0' },
}

export const WithoutSymbol: Story = {
  args: { showSymbol: false },
}

export const WithoutTooltip: Story = {
  args: { showTooltip: false },
}

export const TooltipWithoutTokenLogo: Story = {
  args: { showTokenLogo: false },
  play: openTooltip,
}

export const L1LogoVersion: Story = {
  args: { logoVersion: 'L1' },
  play: openTooltip,
}

export const CustomContainers: Story = {
  args: {
    amountContainer: ({ children }: { children?: ReactNode }) => (
      <span className="text-2xl font-semibold text-neutral-950">
        {children}
      </span>
    ),
    container: ({ children }: { children?: ReactNode }) => (
      <div className="flex items-baseline gap-x-1">{children}</div>
    ),
    symbolContainer: ({ children }: { children?: ReactNode }) => (
      <span className="text-sm text-neutral-500">{children}</span>
    ),
  },
}
