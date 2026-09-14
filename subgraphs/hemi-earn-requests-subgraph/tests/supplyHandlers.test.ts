import { indexer } from 'envio'
import { bsc, hemi, mainnet } from 'viem/chains'
import { describe, expect, it } from 'vitest'

import { endOfDay, toDate, toSnapshot } from '../src/mappings/supplyHandlers.ts'

const opAddresses = indexer.chains[hemi.id].OpAddresses.addresses

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
    expect(toSnapshot(mainnet.id, [100n, 4n, 2n])).toEqual({
      burned: 2n,
      ethSafe: 4n,
      totalSupply: 100n,
    })
    expect(toSnapshot(bsc.id, [3n])).toEqual({ bnbSafe: 3n })
  })

  it('adds every op address into a single value', function () {
    const opValues = opAddresses.map((_, index) => BigInt(index + 1))

    expect(toSnapshot(hemi.id, [1n, 5n, 10n, ...opValues])).toEqual({
      hemiSafe: 1n,
      locked: 5n,
      merkle: 10n,
      opBalances: opValues.reduce((sum, value) => sum + value, 0n),
    })
  })
})
