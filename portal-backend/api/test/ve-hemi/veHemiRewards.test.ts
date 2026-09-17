import { getTotalVeHemiSupplyAt } from 've-hemi-actions/actions'
import { getRewardPeriod, getRewardTokens } from 've-hemi-rewards/actions'
// Same false positive `src/ve-hemi/index.ts` disables: eslint-plugin-node does not
// understand package.json#exports, which is how TypeScript resolves this.
// See https://github.com/bloq/eslint-config-bloq/issues/64
/* eslint-disable-next-line node/no-missing-import */
import { decimals, symbol } from 'viem-erc20/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getHemiClient } from '../../src/hemiClient.ts'
import { createVeHemi } from '../../src/ve-hemi/index.ts'

vi.mock('../../src/hemiClient.ts', () => ({ getHemiClient: vi.fn() }))
vi.mock('ve-hemi-actions/actions', () => ({
  getTotalVeHemiSupplyAt: vi.fn(),
}))
vi.mock('ve-hemi-rewards/actions', () => ({
  getRewardPeriod: vi.fn(),
  getRewardTokens: vi.fn(),
}))
vi.mock('viem-erc20/actions', () => ({ decimals: vi.fn(), symbol: vi.fn() }))

const oneToken = BigInt(10) ** BigInt(18)

const cache = {
  getTokenPrices: vi.fn().mockResolvedValue({ prices: { HEMI: '1' } }),
}

// @ts-expect-error a partial cache is all these paths touch
const { getVeHemiRewards } = createVeHemi({ cache })

describe('getVeHemiRewards', function () {
  beforeEach(function () {
    vi.mocked(getHemiClient).mockReturnValue({ chain: { id: 1 } })
    vi.mocked(getRewardTokens).mockResolvedValue([
      '0x00000000000000000000000000000000000000a1',
    ])
    vi.mocked(decimals).mockResolvedValue(18)
    vi.mocked(symbol).mockResolvedValue('HEMI')
    vi.mocked(getRewardPeriod).mockResolvedValue(oneToken)
    vi.mocked(getTotalVeHemiSupplyAt).mockResolvedValue(oneToken)
    cache.getTokenPrices.mockResolvedValue({ prices: { HEMI: '1' } })
  })

  // The regression this guards: the client used to be built once from Hemi mainnet, so
  // every request read mainnet state no matter which chain was asked for.
  it('reads the chain it was asked for', async function () {
    await getVeHemiRewards('743111')

    expect(getHemiClient).toHaveBeenCalledWith(743111)
  })

  it('still reads mainnet when mainnet is asked for', async function () {
    await getVeHemiRewards('43111')

    expect(getHemiClient).toHaveBeenCalledWith(43111)
  })

  // Testnet used to short-circuit to an array of zeros, which renders as a 0% APR
  // indistinguishable from real data. It now computes from the chain like any other.
  it('computes testnet rewards rather than answering zeros', async function () {
    const rewards = await getVeHemiRewards('743111')

    // 60 days of one token each, averaged to a day and scaled to a six-day epoch,
    // over a total weight of one token.
    expect(rewards.every((reward: number) => reward === 6)).toBe(true)
    expect(rewards).toHaveLength(61)
  })

  it('reports zero for an epoch with no staked weight', async function () {
    vi.mocked(getTotalVeHemiSupplyAt).mockResolvedValue(BigInt(0))

    const rewards = await getVeHemiRewards('743111')

    expect(rewards.every((reward: number) => reward === 0)).toBe(true)
  })
})
