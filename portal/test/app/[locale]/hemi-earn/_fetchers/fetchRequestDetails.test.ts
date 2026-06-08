import { getRequestDetails } from '@vetro-protocol/earn/actions'
import { fetchRequestDetails } from 'app/[locale]/hemi-earn/_fetchers/fetchRequestDetails'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { type Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Avoid pulling `eth-rpc-cache` (and its broken ESM resolution under
// vitest) through the chainClients → transport import chain. The
// returned client is opaque to `fetchRequestDetails` — it just hands it
// to the Vetro action which we're mocking as well.
vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: vi.fn(() => ({}) as never),
  getPublicClient: vi.fn(),
}))

vi.mock('@vetro-protocol/earn/actions', () => ({
  getRequestDetails: vi.fn(),
}))

vi.mock('hemi-earn-actions', async function (importOriginal) {
  const actual = await importOriginal<typeof import('hemi-earn-actions')>()
  return {
    ...actual,
    getStakingVaultForShare: vi.fn(),
  }
})

const shareAddress = '0x1111111111111111111111111111111111111111' as Address
const vaultAddress = '0x2222222222222222222222222222222222222222' as Address
const ownerAddress = '0x3333333333333333333333333333333333333333' as Address

const sampleResult = {
  assets: BigInt('1000000000000000000'),
  claimableAt: BigInt(1781534321),
  owner: ownerAddress,
}

describe('app/[locale]/hemi-earn/_fetchers/fetchRequestDetails', function () {
  beforeEach(function () {
    vi.mocked(getStakingVaultForShare).mockReturnValue(vaultAddress)
    vi.mocked(getRequestDetails).mockResolvedValue(sampleResult)
  })

  it('resolves the Vetro vault address for the share + forwards bigint requestId', async function () {
    const requestId = BigInt(42)
    const result = await fetchRequestDetails({ requestId, shareAddress })

    expect(getStakingVaultForShare).toHaveBeenCalledWith(shareAddress)
    expect(getRequestDetails).toHaveBeenCalledWith(expect.anything(), {
      address: vaultAddress,
      requestId,
    })
    expect(result).toEqual(sampleResult)
  })

  it('coerces a string requestId to bigint before calling the action', async function () {
    await fetchRequestDetails({ requestId: '42', shareAddress })

    expect(getRequestDetails).toHaveBeenCalledWith(expect.anything(), {
      address: vaultAddress,
      requestId: BigInt(42),
    })
  })

  it('propagates the action result unchanged', async function () {
    const result = await fetchRequestDetails({
      requestId: BigInt(7),
      shareAddress,
    })

    expect(result.owner).toBe(ownerAddress)
    expect(result.assets).toBe(sampleResult.assets)
    expect(result.claimableAt).toBe(sampleResult.claimableAt)
  })

  it('propagates action errors', async function () {
    vi.mocked(getRequestDetails).mockRejectedValueOnce(
      new Error('reverted: unknown request'),
    )

    await expect(
      fetchRequestDetails({ requestId: BigInt(99), shareAddress }),
    ).rejects.toThrow('reverted: unknown request')
  })
})
