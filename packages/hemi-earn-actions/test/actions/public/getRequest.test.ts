import { type Address, type Client, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { getRequest } from '../../../src/actions/public/getRequest'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

const client = {} as Client

const someAddress = '0x000000000000000000000000000000000000dEaD' as Address

describe('getRequest', function () {
  it('maps the on-chain struct into a typed Request', async function () {
    vi.mocked(readContract).mockResolvedValue({
      asset: someAddress,
      assets: BigInt(100),
      automatic: true,
      kind: 0,
      receiver: someAddress,
      shares: BigInt(50),
      status: 1,
    })

    const result = await getRequest({
      client,
      requestId: BigInt(1),
      routerAddress: zeroAddress,
    })

    expect(result).toEqual({
      asset: someAddress,
      assets: BigInt(100),
      automatic: true,
      kind: 0,
      receiver: someAddress,
      shares: BigInt(50),
      status: 1,
    })
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: zeroAddress,
        args: [BigInt(1)],
        functionName: 'requests',
      }),
    )
  })

  it('preserves narrow kind/status values across the cast', async function () {
    // REDEEM (kind=1) + FINALIZED (status=3)
    vi.mocked(readContract).mockResolvedValue({
      asset: someAddress,
      assets: BigInt(0),
      automatic: false,
      kind: 1,
      receiver: someAddress,
      shares: BigInt(99),
      status: 3,
    })

    const result = await getRequest({
      client,
      requestId: BigInt(7),
    })

    expect(result.kind).toBe(1)
    expect(result.status).toBe(3)
  })
})
