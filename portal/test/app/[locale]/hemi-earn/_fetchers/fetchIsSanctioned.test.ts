import {
  fetchIsSanctioned,
  isSanctionedQueryOptions,
} from 'app/[locale]/hemi-earn/_fetchers/fetchIsSanctioned'
import { type Address } from 'viem'
import { isSanctioned } from 'viem-sanctions-oracle/actions'
import { describe, expect, it, vi } from 'vitest'

vi.mock('utils/chainClients', () => ({
  getPublicClient: vi.fn(() => ({})),
}))
vi.mock('viem-sanctions-oracle/actions', () => ({ isSanctioned: vi.fn() }))

const account = '0x098B716B8Aaf21512996dC57EB0615e2383E2f96' as Address
const otherAccount = '0x1111111111111111111111111111111111111111' as Address

describe('app/[locale]/hemi-earn/_fetchers/fetchIsSanctioned', function () {
  it('asks the oracle about the account', async function () {
    vi.mocked(isSanctioned).mockResolvedValue(true)

    await expect(fetchIsSanctioned(account)).resolves.toBe(true)
    expect(isSanctioned).toHaveBeenCalledWith(expect.anything(), { account })
  })

  it('reports a clean account', async function () {
    vi.mocked(isSanctioned).mockResolvedValue(false)

    await expect(fetchIsSanctioned(account)).resolves.toBe(false)
  })

  it('does not read without an account', async function () {
    await expect(fetchIsSanctioned(undefined)).resolves.toBe(false)
    expect(isSanctioned).not.toHaveBeenCalled()
  })

  // The gate blocks on a failed screening, so the rejection has to surface
  // instead of resolving to "not sanctioned".
  it('surfaces a failed read', async function () {
    vi.mocked(isSanctioned).mockRejectedValue(new Error('rpc is down'))

    await expect(fetchIsSanctioned(account)).rejects.toThrow('rpc is down')
  })

  it('keys the verdict by account so a wallet switch refetches', function () {
    expect(isSanctionedQueryOptions(account).queryKey).not.toStrictEqual(
      isSanctionedQueryOptions(otherAccount).queryKey,
    )
  })

  it('stays disabled until a wallet is connected', function () {
    expect(isSanctionedQueryOptions(undefined).enabled).toBe(false)
    expect(isSanctionedQueryOptions(account).enabled).toBe(true)
  })
})
