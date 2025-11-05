import { Token } from 'types/token'
import { getTokenBalance } from 'utils/getTokenBalance'
import { type PublicClient, zeroAddress } from 'viem'
import { getBalance } from 'viem/actions'
import { balanceOf } from 'viem-erc20/actions'
import { describe, expect, it, vi } from 'vitest'

vi.mock('viem/actions', () => ({
  getBalance: vi.fn(),
}))

vi.mock('viem-erc20/actions', () => ({
  balanceOf: vi.fn(),
}))

const mockNativeToken: Token = {
  address: zeroAddress,
  chainId: 1,
  decimals: 18,
  extensions: {
    priceSymbol: 'ETH',
  },
  logoURI: '',
  name: 'Ether',
  symbol: 'ETH',
}

const mockErc20Token: Token = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: 1,
  decimals: 18,
  extensions: {
    priceSymbol: 'DAI',
  },
  logoURI: '',
  name: 'DAI Stablecoin',
  symbol: 'DAI',
}

describe('getTokenBalance', function () {
  const account = '0xabc1230000000000000000000000000000000000'

  it('should return 0 if not connected', async function () {
    const result = await getTokenBalance({
      account: undefined,
      client: {} as PublicClient,
      token: mockNativeToken,
    })

    expect(result).toBe(BigInt(0))
  })

  it('should return balance for native token', async function () {
    vi.mocked(getBalance).mockResolvedValue(BigInt(1000))

    const result = await getTokenBalance({
      account,
      client: {} as PublicClient,
      token: mockNativeToken,
    })

    expect(result).toBe(BigInt(1000))
  })

  it('should return balance for ERC20 token', async function () {
    const client = {} as PublicClient
    vi.mocked(balanceOf).mockResolvedValue(BigInt(2000))

    const result = await getTokenBalance({
      account,
      client,
      token: mockErc20Token,
    })

    expect(result).toBe(BigInt(2000))
  })

  it('should return 0 on error for native token', async function () {
    vi.mocked(getBalance).mockRejectedValue(new Error('fail'))

    const result = await getTokenBalance({
      account,
      client: {} as PublicClient,
      token: mockNativeToken,
    })

    expect(result).toBe(BigInt(0))
  })

  it('should return 0 on error for ERC20 token', async function () {
    const client = {} as PublicClient
    vi.mocked(balanceOf).mockRejectedValue(new Error('fail'))

    const result = await getTokenBalance({
      account,
      client,
      token: mockErc20Token,
    })

    expect(result).toBe(BigInt(0))
  })
})
