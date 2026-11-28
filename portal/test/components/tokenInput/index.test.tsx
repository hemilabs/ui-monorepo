import { TokenInput } from 'components/tokenInput'
import { TokenInputError } from 'components/tokenInput/error'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

const token = {
  address: '0x0000000000000000000000000000000000000001',
  chainId: 1,
  decimals: 18,
  name: 'Test',
  symbol: 'TEST',
}

const defaultProps = {
  errorKey: undefined,
  label: 'Amount',
  onChange: vi.fn(),
  showFiatBalance: false,
  token,
  tokenSelector: null,
  value: '',
}

describe('TokenInput', function () {
  it('names the input with the label', async function () {
    const screen = await render(<TokenInput {...defaultProps} />)

    await expect
      .element(screen.getByRole('textbox'))
      .toHaveAccessibleName('Amount')
  })

  it('describes the input with the error message', async function () {
    const screen = await render(
      <TokenInput
        {...defaultProps}
        bottomRight={<TokenInputError id="error-id" message="Too low" />}
        errorId="error-id"
      />,
    )

    await expect
      .element(screen.getByRole('textbox', { name: 'Amount' }))
      .toHaveAccessibleDescription('Too low')
  })

  it('renders the bottom right node without a description', async function () {
    const screen = await render(
      <TokenInput {...defaultProps} bottomRight={<span>Balance</span>} />,
    )

    await expect.element(screen.getByText('Balance')).toBeInTheDocument()
    await expect
      .element(screen.getByRole('textbox', { name: 'Amount' }))
      .not.toHaveAttribute('aria-describedby')
  })

  it('keeps the live region mounted when the message changes', async function () {
    const screen = await render(
      <TokenInput
        {...defaultProps}
        bottomRight={<TokenInputError id="error-id" />}
        errorId="error-id"
      />,
    )
    const liveRegion = screen.container.querySelector('#error-id')

    expect(liveRegion).not.toBeNull()
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    expect(liveRegion).toBeEmptyDOMElement()

    await screen.rerender(
      <TokenInput
        {...defaultProps}
        bottomRight={<TokenInputError id="error-id" message="Too low" />}
        errorId="error-id"
      />,
    )

    expect(screen.container.querySelector('#error-id')).toBe(liveRegion)
    expect(liveRegion).toHaveTextContent('Too low')
  })

  it('marks the input as invalid only when there is an input error', async function () {
    const screen = await render(
      <TokenInput {...defaultProps} errorKey="less-than-min-value" value="1" />,
    )
    const input = screen.getByRole('textbox', { name: 'Amount' })

    await expect.element(input).toHaveAttribute('aria-invalid', 'true')

    await screen.rerender(<TokenInput {...defaultProps} value="1" />)

    await expect.element(input).toHaveAttribute('aria-invalid', 'false')
  })

  it('calls onChange when the user types', async function () {
    const onChange = vi.fn()
    const screen = await render(
      <TokenInput {...defaultProps} onChange={onChange} />,
    )

    await screen.getByRole('textbox', { name: 'Amount' }).fill('5')

    expect(onChange).toHaveBeenCalledWith('5')
  })
})
