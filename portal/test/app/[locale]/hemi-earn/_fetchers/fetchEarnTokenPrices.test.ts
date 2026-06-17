import { gateways } from '@vetro-protocol/gateway'
import { fetchEarnTokenPrices } from 'app/[locale]/hemi-earn/_fetchers/fetchEarnTokenPrices'
import { oraclePricesQueryOptions } from 'app/[locale]/hemi-earn/_fetchers/fetchOraclePrices'
import { tokenPricesQueryOptions } from 'hooks/useTokenPrices'
import { mainnet } from 'networks/mainnet'
import { type EvmToken } from 'types/token'
import { getTokenPrice } from 'utils/token'
import { describe, expect, it, vi } from 'vitest'

import { createTestQueryClient } from '../../../../createTestQueryClient'

// Avoid pulling `eth-rpc-cache` (broken ESM resolution under vitest) through
// the `fetchOraclePrices` → chainClients import chain. The oracle dicts are
// seeded into the cache, so the on-chain reader is never invoked here.
vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: vi.fn(),
  getPublicClient: vi.fn(),
}))

const usdGateway = gateways.find(gateway => gateway.pegBaseSymbol === 'USD')!
const btcGateway = gateways.find(gateway => gateway.pegBaseSymbol === 'BTC')!

// `fetchEarnTokenPrices` reads every gateway's oracle dict from the cache, so
// seed both even when a test only exercises one (an unseeded entry would hit
// the network). Defaults are empty so each test only declares what it needs.
const seed = function (
  queryClient: ReturnType<typeof createTestQueryClient>,
  {
    btcOracle = {},
    portal,
    usdOracle = {},
  }: {
    btcOracle?: Record<string, string>
    portal: Record<string, string>
    usdOracle?: Record<string, string>
  },
) {
  queryClient.setQueryData(tokenPricesQueryOptions().queryKey, portal)
  queryClient.setQueryData(
    oraclePricesQueryOptions(usdGateway.address).queryKey,
    usdOracle,
  )
  queryClient.setQueryData(
    oraclePricesQueryOptions(btcGateway.address).queryKey,
    btcOracle,
  )
}

describe('app/[locale]/hemi-earn/_fetchers/fetchEarnTokenPrices', function () {
  it('passes USD-pegged oracle entries through unchanged', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      portal: { USDC: '1', USDT: '1' },
      usdOracle: { USDC: '0.999', USDT: '1.001' },
    })

    const result = await fetchEarnTokenPrices(queryClient)

    expect(result.USDC).toBe('0.999')
    expect(result.USDT).toBe('1.001')
  })

  it("multiplies BTC-pegged oracle entries by portal['BTC']", async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      // 1 WBTC = 0.998 BTC, 1 cbBTC = 1.0001 BTC
      btcOracle: { CBBTC: '1.0001', WBTC: '0.998' },
      portal: { BTC: '76800', USDT: '1' },
    })

    const result = await fetchEarnTokenPrices(queryClient)

    // WBTC: 0.998 × 76800 = 76646.4
    expect(Number(result.WBTC)).toBeCloseTo(76646.4, 4)
    // cbBTC: 1.0001 × 76800 = 76807.68
    expect(Number(result.CBBTC)).toBeCloseTo(76807.68, 4)
    // Portal BTC entry survives untouched.
    expect(result.BTC).toBe('76800')
  })

  it('prices a BTC-pegged token through its WBTC oracle proxy', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      // The vetBTC gateway's WBTC oracle reports 0.998 BTC per WBTC.
      btcOracle: { WBTC: '0.998' },
      portal: { BTC: '76800' },
    })

    const prices = await fetchEarnTokenPrices(queryClient)

    // vetBTC has no oracle of its own; it aliases to its gateway's whitelisted
    // WBTC proxy via `priceSymbol`. So its USD price is the WBTC oracle rate
    // (0.998 BTC) converted to USD through the portal BTC price:
    // 0.998 × 76800 = 76646.4.
    const vetBtc = {
      address: '0xf196C68233464A16CFDa319a47c21f4cECa62001',
      chainId: mainnet.id,
      decimals: 18,
      extensions: { priceSymbol: 'WBTC' },
      name: 'Vetro BTC',
      symbol: 'vetBTC',
    } satisfies EvmToken

    expect(Number(getTokenPrice(vetBtc, prices))).toBeCloseTo(76646.4, 4)
  })

  it('lets oracle entries override portal entries on collision', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      btcOracle: { WBTC: '0.998' },
      // Portal disagrees on the WBTC USD price.
      portal: { BTC: '76800', WBTC: '99999' },
    })

    const result = await fetchEarnTokenPrices(queryClient)

    // Oracle wins: 0.998 × 76800 = 76646.4
    expect(Number(result.WBTC)).toBeCloseTo(76646.4, 4)
  })

  it("zeros a gateway's tokens when its peg base is missing from portal", async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, {
      btcOracle: { WBTC: '0.998' },
      // Degraded portal feed without a BTC entry.
      portal: { USDT: '1' },
    })

    const result = await fetchEarnTokenPrices(queryClient)

    expect(result.WBTC).toBe('0')
    // Other portal entries are unaffected.
    expect(result.USDT).toBe('1')
  })

  it('passes portal-only entries through when oracles are empty', async function () {
    const queryClient = createTestQueryClient()
    seed(queryClient, { portal: { BTC: '76800', HEMI: '0.0086' } })

    const result = await fetchEarnTokenPrices(queryClient)

    expect(result).toEqual({ BTC: '76800', HEMI: '0.0086' })
  })
})
