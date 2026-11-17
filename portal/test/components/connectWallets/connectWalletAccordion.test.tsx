import { ConnectWalletAccordion } from 'components/connectWallets/connectWalletAccordion'
import en from 'messages/en.json'
import { type ComponentProps } from 'react'
import { IntlProvider } from 'use-intl'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'

const { track } = vi.hoisted(() => ({ track: vi.fn() }))

vi.mock('hooks/useUmami', () => ({ useUmami: () => ({ track }) }))

type Wallet = {
  id: string
  installed: boolean
  name: string
}

const headerText = 'EVM Wallets'

const wallets: Wallet[] = [
  { id: 'rabby', installed: false, name: 'Rabby' },
  { id: 'metamask', installed: true, name: 'MetaMask' },
  { id: 'rainbow', installed: false, name: 'Rainbow' },
  { id: 'okx', installed: true, name: 'OKX' },
]

const renderDetailView = (wallet: Wallet, onBack: VoidFunction) => (
  <div>
    <p>{`Scan with ${wallet.name}`}</p>
    <button onClick={onBack}>Back</button>
  </div>
)

const renderAccordion = (
  props: Partial<ComponentProps<typeof ConnectWalletAccordion<Wallet>>> = {},
) =>
  render(
    <IntlProvider locale="en" messages={en}>
      <ConnectWalletAccordion<Wallet>
        event="evm connect"
        getWalletState={wallet => ({
          showCheck: wallet.installed,
          showInstall: false,
        })}
        icon={null}
        onConnect={vi.fn()}
        renderLogo={() => null}
        text={headerText}
        wallets={wallets}
        {...props}
      />
    </IntlProvider>,
  )

const settle = () => new Promise(resolve => setTimeout(resolve, 50))

const getWalletNames = (container: HTMLElement) =>
  [...container.querySelectorAll('button')]
    .map(button => button.textContent)
    .filter(text => wallets.some(({ name }) => name === text))

describe('ConnectWalletAccordion', function () {
  it('starts expanded and toggles from the header', async function () {
    const screen = await renderAccordion()
    const header = screen.getByRole('button', { name: headerText })

    await expect.element(header).toHaveAttribute('aria-expanded', 'true')

    await header.click()
    await expect.element(header).toHaveAttribute('aria-expanded', 'false')

    await header.click()
    await expect.element(header).toHaveAttribute('aria-expanded', 'true')
  })

  it('takes the wallets out of the tab order while collapsed', async function () {
    const screen = await renderAccordion()
    const header = screen.getByRole('button', { name: headerText })
    const firstWallet = screen.getByRole('button', { name: 'MetaMask' })

    header.element().focus()
    await userEvent.tab()
    await expect.element(firstWallet).toHaveFocus()

    await header.click()
    header.element().focus()
    await userEvent.tab()
    await expect.element(firstWallet).not.toHaveFocus()
  })

  it('tracks the event on every header click', async function () {
    const screen = await renderAccordion()
    const header = screen.getByRole('button', { name: headerText })

    await header.click()
    await header.click()

    expect(track).toHaveBeenCalledTimes(2)
    expect(track).toHaveBeenNthCalledWith(1, 'evm connect')
    expect(track).toHaveBeenNthCalledWith(2, 'evm connect')
  })

  it('lists the installed wallets first and keeps the given order otherwise', async function () {
    const screen = await renderAccordion()

    expect(getWalletNames(screen.container)).toEqual([
      'MetaMask',
      'OKX',
      'Rabby',
      'Rainbow',
    ])
  })

  it('calls onConnect with the clicked wallet', async function () {
    const onConnect = vi.fn()
    const screen = await renderAccordion({ onConnect })

    await screen.getByRole('button', { name: 'Rainbow' }).click()

    expect(onConnect).toHaveBeenCalledExactlyOnceWith(wallets[2])
  })

  it('shows the detail view when onConnect returns true', async function () {
    const screen = await renderAccordion({
      onConnect: () => true,
      renderDetailView,
    })

    await screen.getByRole('button', { name: 'MetaMask' }).click()

    await expect
      .element(screen.getByText('Scan with MetaMask'))
      .toBeInTheDocument()
  })

  it('shows the detail view when onConnect returns nothing', async function () {
    const screen = await renderAccordion({
      onConnect: vi.fn(),
      renderDetailView,
    })

    await screen.getByRole('button', { name: 'OKX' }).click()

    await expect.element(screen.getByText('Scan with OKX')).toBeInTheDocument()
  })

  it('does not show the detail view when onConnect returns false', async function () {
    const onConnect = vi.fn(() => false)
    const screen = await renderAccordion({ onConnect, renderDetailView })

    await screen.getByRole('button', { name: 'MetaMask' }).click()

    await expect.poll(() => onConnect).toHaveBeenCalledOnce()
    await settle()
    expect(screen.container.textContent).not.toContain('Scan with')
  })

  it('waits for an async onConnect before showing the detail view', async function () {
    const { promise, resolve } = Promise.withResolvers<boolean>()
    const screen = await renderAccordion({
      onConnect: () => promise,
      renderDetailView,
    })

    await screen.getByRole('button', { name: 'Rabby' }).click()

    expect(screen.container.textContent).not.toContain('Scan with')

    resolve(true)

    await expect
      .element(screen.getByText('Scan with Rabby'))
      .toBeInTheDocument()
  })

  it('goes back to the list through the detail view', async function () {
    const screen = await renderAccordion({
      onConnect: () => true,
      renderDetailView,
    })

    await screen.getByRole('button', { name: 'MetaMask' }).click()
    await screen.getByRole('button', { name: 'Back' }).click()

    await expect
      .element(screen.getByText('Scan with MetaMask'))
      .not.toBeInTheDocument()
  })
})
