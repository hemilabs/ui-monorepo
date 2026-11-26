import { TEST_PRIVATE_KEY } from '@hemilabs/anvil-fork-setup/utils'
import { installMockWallet } from '@hemilabs/mock-wallet'
import { expect, type Route, test as base } from '@playwright/test'
import { hemi } from 'hemi-viem'
import { createTestClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { revert, snapshot } from 'viem/actions'

import { anvilUrl } from '../anvil'

export const portalApiUrl = 'http://localhost:5555'

const stubs: { json: unknown; pattern: RegExp }[] = [
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
  { json: { positions: [] }, pattern: /^\/subgraphs\/43111\/locks\/0x\w+$/ },
  {
    json: { withdrawals: [] },
    pattern: /^\/subgraphs\/\d+\/withdrawals\/0x\w+\/(btc|evm)$/,
  },
  { json: { tvl: 0 }, pattern: /^\/tvl$/ },
]

export const test = base.extend({
  async page({ page }, use) {
    await installMockWallet({
      account: privateKeyToAccount(TEST_PRIVATE_KEY),
      chain: hemi,
      page,
      transports: { [hemi.id]: http(anvilUrl) },
    })

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
    const testClient = createTestClient({
      chain: hemi,
      mode: 'anvil',
      transport: http(anvilUrl),
    })
    const snapshotId = await snapshot(testClient)
    await use(page)
    await revert(testClient, { id: snapshotId })

    expect(unstubbedApiCalls).toEqual([])
  },
})
