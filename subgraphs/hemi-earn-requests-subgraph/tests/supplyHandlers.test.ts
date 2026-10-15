import { indexer } from 'envio'
import { base, bsc, hemi, mainnet } from 'viem/chains'
import { describe, expect, it } from 'vitest'

import {
  endOfDay,
  toDate,
  toRpcUrls,
  toSnapshot,
} from '../src/mappings/supplyHandlers.ts'

const toOpValues = (
  chainId: typeof base.id | typeof bsc.id | typeof hemi.id | typeof mainnet.id,
) =>
  indexer.chains[chainId].OpAddresses.addresses.map((_, index) =>
    BigInt(index + 1),
  )

const sum = (values: bigint[]) => values.reduce((a, b) => a + b, 0n)

describe('endOfDay', function () {
  it('returns the midnight UTC that closes the day', function () {
    expect(endOfDay('2026-09-04')).toBe(
      Date.parse('2026-09-05T00:00:00Z') / 1000,
    )
  })
})

describe('toDate', function () {
  it('names the UTC day of a block timestamp', function () {
    expect(toDate(Date.parse('2026-09-11T23:59:59Z') / 1000)).toBe('2026-09-11')
    expect(toDate(Date.parse('2026-09-12T00:00:00Z') / 1000)).toBe('2026-09-12')
  })
})

describe('toSnapshot', function () {
  it('names the values each chain reads, in order', function () {
    const ethOpValues = toOpValues(mainnet.id)
    const bnbOpValues = toOpValues(bsc.id)
    const baseOpValues = toOpValues(base.id)

    expect(toSnapshot(mainnet.id, [100n, 4n, 2n, 6n, ...ethOpValues])).toEqual({
      burned: 2n,
      ethInvestorAllocation: 6n,
      ethOpBalances: sum(ethOpValues),
      ethSafe: 4n,
      totalSupply: 100n,
    })
    expect(toSnapshot(bsc.id, [3n, 8n, ...bnbOpValues])).toEqual({
      bnbInvestorAllocation: 8n,
      bnbOpBalances: sum(bnbOpValues),
      bnbSafe: 3n,
    })
    expect(toSnapshot(base.id, baseOpValues)).toEqual({
      baseOpBalances: sum(baseOpValues),
    })
  })

  it('adds every op address into a single value', function () {
    const opValues = toOpValues(hemi.id)

    expect(toSnapshot(hemi.id, [1n, 5n, 10n, ...opValues, 9n, 11n])).toEqual({
      hemiFoundationFinance: 11n,
      hemiInvestorAllocation: 9n,
      hemiSafe: 1n,
      locked: 5n,
      merkle: 10n,
      opBalances: sum(opValues),
    })
  })
})

describe('toRpcUrls', function () {
  it('splits the URLs joined with "+"', function () {
    expect(toRpcUrls('https://a.example+https://b.example')).toEqual([
      'https://a.example',
      'https://b.example',
    ])
  })

  it('drops the values that are not URLs', function () {
    expect(toRpcUrls('https://a.example+not-a-url')).toEqual([
      'https://a.example',
    ])
    expect(toRpcUrls()).toEqual([])
  })
})
