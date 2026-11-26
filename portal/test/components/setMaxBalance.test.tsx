import { SetMaxBtcBalance, SetMaxEvmBalance } from 'components/setMaxBalance'
import en from 'messages/en.json'
import { type ReactNode } from 'react'
import { type BtcToken, type EvmToken } from 'types/token'
import { IntlProvider } from 'use-intl'
import { parseUnits } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'

const {
  useBitcoinBalance,
  useBtcAccount,
  useEstimateBtcFees,
  useNativeBalance,
  useTokenBalance,
} = vi.hoisted(() => ({
  useBitcoinBalance: vi.fn(),
  useBtcAccount: vi.fn(),
  useEstimateBtcFees: vi.fn(),
  useNativeBalance: vi.fn(),
  useTokenBalance: vi.fn(),
}))

vi.mock('@hemilabs/react-hooks/useNativeBalance', () => ({ useNativeBalance }))
vi.mock('btc-wallet/hooks/useAccount', () => ({ useAccount: useBtcAccount }))
vi.mock('hooks/useBalance', () => ({ useTokenBalance }))
vi.mock('hooks/useBitcoinBalance', () => ({ useBitcoinBalance }))
vi.mock('hooks/useEstimateBtcFees', () => ({ useEstimateBtcFees }))

const btcToken: BtcToken = {
  address: 'BTC',
  chainId: 'testnet',
  decimals: 8,
  name: 'Testnet Bitcoin',
  symbol: 'tBTC',
}

const erc20Token: EvmToken = {
  address: '0x1234567890123456789012345678901234567890',
  chainId: 1,
  decimals: 6,
  name: 'USD Coin',
  symbol: 'USDC',
}

const nativeToken: EvmToken = {
  address: 'ETH',
  chainId: 1,
  decimals: 18,
  name: 'Ether',
  symbol: 'ETH',
}

const withIntl = (children: ReactNode) => (
  <IntlProvider locale="en" messages={en}>
    {children}
  </IntlProvider>
)

const getMaxButton = (screen: RenderResult) =>
  screen.getByRole('button', { name: 'max' })

type EvmState = {
  disabled?: boolean
  gas?: bigint
  isLoadingNativeBalance?: boolean
  nativeBalance?: bigint
  token?: EvmToken
  tokenBalance?: bigint
}

const renderEvm = async function ({
  disabled = false,
  gas = BigInt(0),
  isLoadingNativeBalance = false,
  nativeBalance,
  token = nativeToken,
  tokenBalance,
}: EvmState) {
  useNativeBalance.mockReturnValue({
    data: nativeBalance === undefined ? undefined : { value: nativeBalance },
    isLoading: isLoadingNativeBalance,
  })
  useTokenBalance.mockReturnValue({ data: tokenBalance })
  const onSetMaxBalance = vi.fn()
  return {
    onSetMaxBalance,
    screen: await render(
      withIntl(
        <SetMaxEvmBalance
          disabled={disabled}
          gas={gas}
          onSetMaxBalance={onSetMaxBalance}
          token={token}
        />,
      ),
    ),
  }
}

type BtcState = {
  balance?: { confirmed: number; unconfirmed: number }
  disabled?: boolean
  fees?: number
  isLoadingBalance?: boolean
  isLoadingFees?: boolean
}

const renderBtc = async function (state: BtcState) {
  const {
    disabled = false,
    isLoadingBalance = false,
    isLoadingFees = false,
  } = state
  const balance =
    'balance' in state ? state.balance : { confirmed: 150_000, unconfirmed: 0 }
  const fees = 'fees' in state ? state.fees : 50_000
  useBtcAccount.mockReturnValue({ address: 'tb1qxy2kgdygjrsqtzq2n0yrf2493' })
  useBitcoinBalance.mockReturnValue({
    balance,
    isLoading: isLoadingBalance,
  })
  useEstimateBtcFees.mockReturnValue({ fees, isLoading: isLoadingFees })
  const onSetMaxBalance = vi.fn()
  return {
    onSetMaxBalance,
    screen: await render(
      withIntl(
        <SetMaxBtcBalance
          disabled={disabled}
          onSetMaxBalance={onSetMaxBalance}
          token={btcToken}
        />,
      ),
    ),
  }
}

describe('SetMaxEvmBalance', function () {
  it('deducts the gas from the balance of the native token', async function () {
    const { onSetMaxBalance, screen } = await renderEvm({
      gas: parseUnits('0.5', 18),
      nativeBalance: parseUnits('1.5', 18),
    })
    await getMaxButton(screen).click()

    expect(onSetMaxBalance).toHaveBeenCalledExactlyOnceWith('1')
  })

  it('does not deduct the gas from the balance of an erc20 token', async function () {
    const { onSetMaxBalance, screen } = await renderEvm({
      gas: parseUnits('1', 18),
      nativeBalance: parseUnits('3', 18),
      token: erc20Token,
      tokenBalance: parseUnits('2.5', 6),
    })
    await getMaxButton(screen).click()

    expect(onSetMaxBalance).toHaveBeenCalledExactlyOnceWith('2.5')
  })

  it.for<[string, EvmState]>([
    ['disabled', { disabled: true, nativeBalance: parseUnits('1', 18) }],
    [
      'loading the native balance',
      { isLoadingNativeBalance: true, nativeBalance: parseUnits('1', 18) },
    ],
    ['without a balance', {}],
    [
      'the gas equals the balance',
      { gas: parseUnits('1', 18), nativeBalance: parseUnits('1', 18) },
    ],
    [
      'the gas is more than the balance',
      { gas: parseUnits('2', 18), nativeBalance: parseUnits('1', 18) },
    ],
    [
      'the erc20 balance is zero',
      {
        nativeBalance: parseUnits('1', 18),
        token: erc20Token,
        tokenBalance: BigInt(0),
      },
    ],
    [
      'the erc20 balance is not loaded',
      { nativeBalance: parseUnits('1', 18), token: erc20Token },
    ],
  ])('is disabled when %s', async function ([, state]) {
    const { screen } = await renderEvm(state)
    await expect.element(getMaxButton(screen)).toBeDisabled()
  })
})

describe('SetMaxBtcBalance', function () {
  it('deducts the fees from the confirmed balance', async function () {
    const { onSetMaxBalance, screen } = await renderBtc({
      balance: { confirmed: 150_000, unconfirmed: 900_000 },
      fees: 50_000,
    })
    await getMaxButton(screen).click()

    expect(onSetMaxBalance).toHaveBeenCalledExactlyOnceWith('0.001')
  })

  it.for<[string, BtcState]>([
    ['disabled', { disabled: true }],
    ['loading the balance', { isLoadingBalance: true }],
    ['loading the fees', { isLoadingFees: true }],
    ['there is no balance', { balance: undefined }],
    ['the fees are unknown', { fees: undefined }],
    [
      'the fees equal the balance',
      { balance: { confirmed: 50_000, unconfirmed: 0 }, fees: 50_000 },
    ],
  ])('is disabled when %s', async function ([, state]) {
    const { screen } = await renderBtc(state)
    await expect.element(getMaxButton(screen)).toBeDisabled()
  })
})
