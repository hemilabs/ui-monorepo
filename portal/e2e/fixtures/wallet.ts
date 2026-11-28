import { TEST_PRIVATE_KEY } from '@hemilabs/anvil-fork-setup/utils'
import { installMockWallet } from '@hemilabs/mock-wallet'
import { expect, type Route, test as base } from '@playwright/test'
import { hemi } from 'hemi-viem'
import { type StakingPositionApiResult } from 'utils/subgraph'
import { privateKeyToAccount } from 'viem/accounts'
import { revert, snapshot } from 'viem/actions'

import { createAnvilTestClient, walletTransport } from '../anvil'

export const portalApiUrl = 'http://localhost:5555'

const getStubs = (stakingPositions: StakingPositionApiResult[]) => [
  {
    json: { locksCount: 0, totalStaked: '0', walletsStaking: 0 },
    pattern: /^\/hemi-stake$/,
  },
  { json: { prices: {} }, pattern: /^\/prices$/ },
  {
    json: { number: 0 },
    pattern: /^\/subgraphs\/\d+\/(deposits|withdrawals)\/meta$/,
  },
  { json: { deposits: [] }, pattern: /^\/subgraphs\/\d+\/deposits\/0x\w+$/ },
  {
    json: { positions: stakingPositions },
    pattern: /^\/subgraphs\/43111\/locks\/0x\w+$/,
  },
  {
    json: { withdrawals: [] },
    pattern: /^\/subgraphs\/\d+\/withdrawals\/0x\w+\/(btc|evm)$/,
  },
  { json: { tvl: 0 }, pattern: /^\/tvl$/ },
]

type Fixtures = {
  stakingPositions: StakingPositionApiResult[]
}

export const test = base.extend<Fixtures>({
  async page({ page, stakingPositions }, use) {
    await installMockWallet({
      account: privateKeyToAccount(TEST_PRIVATE_KEY),
      chain: hemi,
      page,
      transports: { [hemi.id]: walletTransport },
    })

    const stubs = getStubs(stakingPositions)
    const unstubbedApiCalls: string[] = []
    await page.route(`${portalApiUrl}/**`, function (route: Route) {
      const { pathname } = new URL(route.request().url())
      const stub = stubs.find(({ pattern }) => pattern.test(pathname))
      if (stub) {
        return route.fulfill({ json: stub.json })
      }
      unstubbedApiCalls.push(pathname)
      return route.fulfill({ status: 404 })
    })

    // The fork is shared by every test, so each one starts from the funded
    // baseline. Otherwise an allowance from one test would skip the next
    // test's approval step.
    const testClient = createAnvilTestClient()
    const snapshotId = await snapshot(testClient)
    await use(page)
    await page.close()
    await revert(testClient, { id: snapshotId })

    expect(unstubbedApiCalls).toEqual([])
  },
  // eslint-disable-next-line no-empty-pattern
  async stakingPositions({}, use) {
    await use([])
  },
})
