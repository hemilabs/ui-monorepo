import express from 'express'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getEarnCostBasis } from '../../src/hemi-earn/costBasis.ts'
import { createSubgraphsRouter } from '../../src/subgraphs/router.ts'
import { getTotalStaked } from '../../src/subgraphs/subgraph.ts'

vi.mock('../../src/subgraphs/subgraph.ts', () => ({
  getBtcDeposit: vi.fn(),
  getBtcWithdrawals: vi.fn(),
  getEarnRequests: vi.fn(),
  getEvmDeposits: vi.fn(),
  getEvmWithdrawals: vi.fn(),
  getLastIndexedBlock: vi.fn(),
  getLockedPositions: vi.fn(),
  getTotalStaked: vi.fn(),
  getWithdrawalProofAndClaim: vi.fn(),
}))
vi.mock('../../src/hemi-earn/costBasis.ts', () => ({
  getEarnCostBasis: vi.fn(),
}))

const checksummedAddress = '0xABABABABABABABABABABABABABABABABABABABAB'
const lowercasedAddress = '0xabababababababababababababababababababab'

// The router memoizes inside each createSubgraphsRouter() call, so a fresh
// server (and router) per test keeps cache entries from leaking across tests.
const ctx: { baseUrl: string; server: Server | undefined } = {
  baseUrl: '',
  server: undefined,
}

const get = (path: string) => fetch(`${ctx.baseUrl}${path}`)

describe('subgraphs router', function () {
  beforeEach(async function () {
    const app = express()
    app.use('/subgraphs', createSubgraphsRouter())
    await new Promise<void>(function (resolve) {
      ctx.server = app.listen(0, () => resolve())
    })
    const { port } = ctx.server!.address() as AddressInfo
    ctx.baseUrl = `http://127.0.0.1:${port}`
  })

  afterEach(async function () {
    await new Promise(resolve => ctx.server!.close(resolve))
  })

  describe('GET /:chainIdStr/staked', function () {
    it('shares one cache entry for chainIds with leading zeros', async function () {
      vi.mocked(getTotalStaked).mockResolvedValue('1000')

      const responses = []
      for (const chainIdStr of ['43111', '43111', '043111', '0043111']) {
        // Sequential on purpose: each request must see the previous entry.
        // eslint-disable-next-line no-await-in-loop
        const response = await get(`/subgraphs/${chainIdStr}/staked`)
        // eslint-disable-next-line no-await-in-loop
        responses.push({ body: await response.json(), status: response.status })
      }

      expect(responses).toEqual([
        { body: { staked: '1000' }, status: 200 },
        { body: { staked: '1000' }, status: 200 },
        { body: { staked: '1000' }, status: 200 },
        { body: { staked: '1000' }, status: 200 },
      ])
      expect(getTotalStaked).toHaveBeenCalledExactlyOnceWith(43111)
    })

    it('keeps separate cache entries for different chains', async function () {
      vi.mocked(getTotalStaked).mockImplementation(chainId =>
        Promise.resolve(chainId === 43111 ? '1000' : '2000'),
      )

      const mainnetResponse = await get('/subgraphs/43111/staked')
      const testnetResponse = await get('/subgraphs/743111/staked')

      expect(mainnetResponse.status).toBe(200)
      expect(await mainnetResponse.json()).toEqual({ staked: '1000' })
      expect(testnetResponse.status).toBe(200)
      expect(await testnetResponse.json()).toEqual({ staked: '2000' })
      expect(getTotalStaked).toHaveBeenCalledTimes(2)
      expect(getTotalStaked).toHaveBeenNthCalledWith(1, 43111)
      expect(getTotalStaked).toHaveBeenNthCalledWith(2, 743111)
    })
  })

  describe('GET /:chainIdStr/earn-cost-basis/:address', function () {
    it('shares one cache entry for chainIds with leading zeros and any address case', async function () {
      const costBasis = { assets: [], totalUsd: '12.5' }
      vi.mocked(getEarnCostBasis).mockResolvedValue(costBasis)

      const first = await get(
        `/subgraphs/43111/earn-cost-basis/${checksummedAddress}`,
      )
      const second = await get(
        `/subgraphs/043111/earn-cost-basis/${lowercasedAddress}`,
      )

      expect(first.status).toBe(200)
      expect(await first.json()).toEqual({ costBasis })
      expect(second.status).toBe(200)
      expect(await second.json()).toEqual({ costBasis })
      expect(getEarnCostBasis).toHaveBeenCalledExactlyOnceWith({
        address: checksummedAddress,
      })
    })
  })
})
