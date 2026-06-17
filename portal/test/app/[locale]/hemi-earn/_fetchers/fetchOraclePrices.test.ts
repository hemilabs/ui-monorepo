import { getTreasury } from '@vetro-protocol/gateway/actions'
import {
  getTokenConfig,
  getWhitelistedTokens,
} from '@vetro-protocol/treasury/actions'
import { fetchOraclePrices } from 'app/[locale]/hemi-earn/_fetchers/fetchOraclePrices'
import { getUseTokenQueryKey } from 'hooks/useToken'
import { mainnet } from 'networks/mainnet'
import { type EvmToken } from 'types/token'
import { type Address, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '../../../../createTestQueryClient'

// The reader only needs a client handle to pass to the mocked actions; the
// reads themselves are mocked, so a stub client is enough.
vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: vi.fn(() => ({})),
}))
vi.mock('@vetro-protocol/gateway/actions', () => ({ getTreasury: vi.fn() }))
vi.mock('@vetro-protocol/treasury/actions', () => ({
  getTokenConfig: vi.fn(),
  getWhitelistedTokens: vi.fn(),
}))
vi.mock('viem/actions', () => ({ readContract: vi.fn() }))

const GATEWAY = '0xCBA2Ffa0AC52d7871a4221a871793Eb788013faB' as Address
const TREASURY = '0x1111111111111111111111111111111111111111' as Address
const ORACLE = '0x2222222222222222222222222222222222222222' as Address
const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' as Address

// Each whitelisted token's oracle reports its price in the gateway's peg unit.
// `latestRoundData` returns the price as the `answer` field of the round tuple;
// an 8-decimal answer of 0.998 → "0.998".
const mockOracleRead = (answer: bigint, decimals: number) =>
  vi
    .mocked(readContract)
    .mockImplementation((_client, { functionName }: { functionName: string }) =>
      Promise.resolve(
        functionName === 'decimals'
          ? decimals
          : [BigInt(0), answer, BigInt(0), BigInt(0), BigInt(0)],
      ),
    )

const seedToken = (
  queryClient: ReturnType<typeof createTestQueryClient>,
  address: Address,
  symbol: string,
) =>
  queryClient.setQueryData(getUseTokenQueryKey(address, mainnet.id), {
    address,
    chainId: mainnet.id,
    decimals: 8,
    name: symbol,
    symbol,
  } satisfies EvmToken)

describe('app/[locale]/hemi-earn/_fetchers/fetchOraclePrices', function () {
  beforeEach(function () {
    vi.clearAllMocks()
    vi.mocked(getTreasury).mockResolvedValue(TREASURY)
    vi.mocked(getTokenConfig).mockResolvedValue([
      zeroAddress,
      ORACLE,
      BigInt(0),
      true,
      true,
      8,
    ])
  })

  it("keys each whitelisted token's oracle price by its uppercased symbol", async function () {
    const queryClient = createTestQueryClient()
    seedToken(queryClient, WBTC, 'WBTC')
    vi.mocked(getWhitelistedTokens).mockResolvedValue([WBTC])
    // 0.998 WBTC/BTC at 8 decimals.
    mockOracleRead(BigInt(99800000), 8)

    const result = await fetchOraclePrices(queryClient, GATEWAY)

    expect(result).toEqual({ WBTC: '0.998' })
  })

  it('uppercases mixed-case token symbols so the alias lookup matches', async function () {
    const queryClient = createTestQueryClient()
    seedToken(queryClient, WBTC, 'wBTC')
    vi.mocked(getWhitelistedTokens).mockResolvedValue([WBTC])
    mockOracleRead(BigInt(100000000), 8)

    const result = await fetchOraclePrices(queryClient, GATEWAY)

    expect(result).toEqual({ WBTC: '1' })
  })

  it('returns an empty dict when the gateway has no whitelisted tokens', async function () {
    const queryClient = createTestQueryClient()
    vi.mocked(getWhitelistedTokens).mockResolvedValue([])

    const result = await fetchOraclePrices(queryClient, GATEWAY)

    expect(result).toEqual({})
  })
})
