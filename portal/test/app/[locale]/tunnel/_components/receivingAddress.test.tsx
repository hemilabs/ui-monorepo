import { ReceivingAddress } from 'app/[locale]/tunnel/_components/receivingAddress'
import en from 'messages/en.json'
import { type ReactNode, useState } from 'react'
import { IntlProvider } from 'use-intl'
import { describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'

const customAddressLabel = 'Custom address'
const invalidAddressText = 'Invalid address'
const receivingText = 'Receiving Bitcoin address'
const tooltipText = 'Withdrawn BTC is sent to this address'
const walletAddress = 'bc1qxy...0wlh'

const withIntl = (children: ReactNode) => (
  <IntlProvider locale="en" messages={en}>
    {children}
  </IntlProvider>
)

type ControlledProps = {
  disabled?: boolean
  initialCustomAddress?: string
  initialCustomAddressEnabled?: boolean
  isCustomAddressValid?: boolean
  onCustomAddressChange?: (customAddress: string) => void
  onCustomAddressEnabledChange?: (customAddressEnabled: boolean) => void
}

const ControlledReceivingAddress = function ({
  disabled = false,
  initialCustomAddress = '',
  initialCustomAddressEnabled = false,
  isCustomAddressValid,
  onCustomAddressChange = vi.fn(),
  onCustomAddressEnabledChange = vi.fn(),
}: ControlledProps) {
  const [customAddress, setCustomAddress] = useState(initialCustomAddress)
  const [customAddressEnabled, setCustomAddressEnabled] = useState(
    initialCustomAddressEnabled,
  )
  return (
    <ReceivingAddress
      address={walletAddress}
      customAddress={customAddress}
      customAddressEnabled={customAddressEnabled}
      disabled={disabled}
      editable
      isCheckingAddress={false}
      isCustomAddressValid={isCustomAddressValid}
      onCustomAddressChange={function (value) {
        onCustomAddressChange(value)
        setCustomAddress(value)
      }}
      onCustomAddressEnabledChange={function (value) {
        onCustomAddressEnabledChange(value)
        setCustomAddressEnabled(value)
      }}
      placeholder="Bitcoin address..."
      receivingText={receivingText}
      tooltipText={tooltipText}
    />
  )
}

const renderEditable = (props: ControlledProps = {}) =>
  render(withIntl(<ControlledReceivingAddress {...props} />))

const renderReadOnly = (address: string | undefined) =>
  render(
    withIntl(
      <ReceivingAddress
        address={address}
        editable={false}
        receivingText={receivingText}
        tooltipText={tooltipText}
      />,
    ),
  )

const getSwitch = (screen: RenderResult) =>
  screen.getByRole('switch', { name: customAddressLabel })

const getInput = (screen: RenderResult) =>
  screen.getByRole('textbox', { name: receivingText })

describe('ReceivingAddress', function () {
  describe('read only', function () {
    it('shows the label and the address without a switch', async function () {
      const screen = await renderReadOnly(walletAddress)

      await expect.element(screen.getByText(receivingText)).toBeVisible()
      await expect.element(screen.getByText(walletAddress)).toBeVisible()
      await expect.element(screen.getByRole('switch')).not.toBeInTheDocument()
    })

    it('shows a dash when there is no address', async function () {
      const screen = await renderReadOnly(undefined)

      await expect.element(screen.getByText('-', { exact: true })).toBeVisible()
    })
  })

  describe('editable', function () {
    it('shows the wallet address while the switch is off', async function () {
      const screen = await renderEditable()

      await expect.element(screen.getByText(receivingText)).toBeVisible()
      await expect.element(getSwitch(screen)).not.toBeChecked()
      await expect.element(screen.getByText(walletAddress)).toBeVisible()
      await expect.element(getInput(screen)).not.toBeInTheDocument()
    })

    it('shows the focused input when the switch is turned on', async function () {
      const onCustomAddressEnabledChange = vi.fn()
      const screen = await renderEditable({ onCustomAddressEnabledChange })

      await getSwitch(screen).click()

      expect(onCustomAddressEnabledChange).toHaveBeenCalledExactlyOnceWith(true)
      await expect.element(getInput(screen)).toHaveFocus()
      await expect
        .element(screen.getByText(walletAddress))
        .not.toBeInTheDocument()
    })

    it('turns the switch on when its label is clicked', async function () {
      const onCustomAddressEnabledChange = vi.fn()
      const screen = await renderEditable({ onCustomAddressEnabledChange })

      await screen.getByText(customAddressLabel, { exact: true }).click()

      expect(onCustomAddressEnabledChange).toHaveBeenCalledExactlyOnceWith(true)
      await expect.element(getSwitch(screen)).toBeChecked()
    })

    it('shows the wallet address again when the switch is turned off', async function () {
      const onCustomAddressEnabledChange = vi.fn()
      const screen = await renderEditable({
        initialCustomAddressEnabled: true,
        onCustomAddressEnabledChange,
      })

      await getSwitch(screen).click()

      expect(onCustomAddressEnabledChange).toHaveBeenCalledExactlyOnceWith(
        false,
      )
      await expect.element(getInput(screen)).not.toBeInTheDocument()
      await expect.element(screen.getByText(walletAddress)).toBeVisible()
    })

    it('trims the typed address', async function () {
      const onCustomAddressChange = vi.fn()
      const screen = await renderEditable({
        initialCustomAddressEnabled: true,
        onCustomAddressChange,
      })

      await getInput(screen).fill('  bc1qabc  ')

      expect(onCustomAddressChange).toHaveBeenLastCalledWith('bc1qabc')
    })

    it('links the error to the input when the address is invalid', async function () {
      const screen = await renderEditable({
        initialCustomAddress: 'not-an-address',
        initialCustomAddressEnabled: true,
        isCustomAddressValid: false,
      })
      const input = getInput(screen)

      await expect.element(input).toHaveAttribute('aria-invalid', 'true')
      await expect
        .element(input)
        .toHaveAccessibleDescription(invalidAddressText)
    })

    it('does not show the error while the address is empty', async function () {
      const screen = await renderEditable({
        initialCustomAddressEnabled: true,
        isCustomAddressValid: false,
      })
      const input = getInput(screen)

      await expect.element(input).toHaveAttribute('aria-invalid', 'false')
      await expect.element(input).not.toHaveAccessibleDescription()
      await expect
        .element(screen.getByText(invalidAddressText))
        .not.toBeInTheDocument()
    })

    it.for([true, undefined])(
      'does not show the error when the validity is %s',
      async function (isCustomAddressValid) {
        const screen = await renderEditable({
          initialCustomAddress: 'bc1qabc',
          initialCustomAddressEnabled: true,
          isCustomAddressValid,
        })
        const input = getInput(screen)

        await expect.element(input).toHaveAttribute('aria-invalid', 'false')
        await expect.element(input).not.toHaveAccessibleDescription()
        await expect
          .element(screen.getByText(invalidAddressText))
          .not.toBeInTheDocument()
      },
    )

    it('disables the switch and the input', async function () {
      const screen = await renderEditable({
        disabled: true,
        initialCustomAddressEnabled: true,
      })

      await expect.element(getSwitch(screen)).toBeDisabled()
      await expect.element(getInput(screen)).toBeDisabled()
    })
  })
})
