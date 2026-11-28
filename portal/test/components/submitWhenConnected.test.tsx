import { LazyConnectEvmWallet } from 'components/lazyConnectEvmWallet'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { ConnectWalletDrawerContext } from 'context/connectWalletDrawerContext'
import en from 'messages/en.json'
import { IntlProvider } from 'use-intl'
import { describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type UseAccountReturnType } from 'wagmi'

const { track, useAccount } = vi.hoisted(() => ({
  track: vi.fn(),
  useAccount: vi.fn(),
}))

vi.mock('hooks/useUmami', () => ({ useUmami: () => ({ track }) }))
vi.mock('wagmi', () => ({ useAccount }))

const defaultConnectText = 'Connect your EVM Wallet'
const submitText = 'Submit'

type RenderProps = {
  connectWalletText?: string
  status: UseAccountReturnType['status']
}

const renderSubmit = async function ({
  connectWalletText,
  status,
}: RenderProps) {
  useAccount.mockReturnValue({ status })
  const openDrawer = vi.fn()
  return {
    openDrawer,
    screen: await render(
      <IntlProvider locale="en" messages={en}>
        <ConnectWalletDrawerContext.Provider
          value={{ closeDrawer: vi.fn(), isDrawerOpen: false, openDrawer }}
        >
          <SubmitWhenConnected
            connectWalletText={connectWalletText}
            submitButton={<button type="submit">{submitText}</button>}
          />
        </ConnectWalletDrawerContext.Provider>
      </IntlProvider>,
    ),
  }
}

const getConnectButton = (screen: RenderResult, name = defaultConnectText) =>
  screen.getByRole('button', { name })

const getSubmitButton = (screen: RenderResult) =>
  screen.getByRole('button', { name: submitText })

const loadConnectButton = async function () {
  const screen = await render(
    <IntlProvider locale="en" messages={en}>
      <LazyConnectEvmWallet />
    </IntlProvider>,
  )
  await expect.element(getConnectButton(screen)).toBeVisible()
  await screen.unmount()
}

describe('SubmitWhenConnected', function () {
  it.for<UseAccountReturnType['status']>(['connected', 'reconnecting'])(
    'shows the submit button when the wallet is %s',
    async function (status) {
      await loadConnectButton()
      const { screen } = await renderSubmit({ status })

      await expect.element(getSubmitButton(screen)).toBeVisible()
      await expect.element(getConnectButton(screen)).not.toBeInTheDocument()
    },
  )

  it.for<UseAccountReturnType['status']>(['connecting', 'disconnected'])(
    'shows the connect wallet button when the wallet is %s',
    async function (status) {
      const { screen } = await renderSubmit({ status })

      await expect.element(getConnectButton(screen)).toBeVisible()
      await expect.element(getSubmitButton(screen)).not.toBeInTheDocument()
    },
  )

  it('shows the custom connect wallet text', async function () {
    const { screen } = await renderSubmit({
      connectWalletText: 'Connect to deposit',
      status: 'disconnected',
    })

    await expect
      .element(getConnectButton(screen, 'Connect to deposit'))
      .toBeVisible()
    await expect.element(getConnectButton(screen)).not.toBeInTheDocument()
  })

  it('opens the connect wallet drawer when the button is clicked', async function () {
    const { openDrawer, screen } = await renderSubmit({
      status: 'disconnected',
    })

    await getConnectButton(screen).click()

    expect(openDrawer).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledExactlyOnceWith('evm connect')
  })
})
