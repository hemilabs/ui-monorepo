import { type Address, type Client, getAddress, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { getAgentAddress } from '../../../src/actions/public/getAgentAddress'
import { getHemiEarnRouterAddress } from '../../../src/constants'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

// The real Router address is still a TBD placeholder (zeroAddress) in
// constants, which would trip the zero-address guard on the default-router
// path. Mock a non-zero default until the deployed address lands.
const { defaultRouterAddress } = vi.hoisted(() => ({
  defaultRouterAddress: '0x000000000000000000000000000000000000cAFe',
}))

vi.mock('../../../src/constants', () => ({
  getHemiEarnRouterAddress: () => defaultRouterAddress,
}))

const client = {} as Client
const routerAddress = '0x000000000000000000000000000000000000bEEf' as Address
// A full 20-byte agent address left-padded into a bytes32, so the test
// exercises the slicing across the whole address (not just trailing zeros).
const agentAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
const peer = `0x000000000000000000000000${agentAddress.slice(2)}`
const expectedAgent = getAddress(agentAddress)

describe('getAgentAddress', function () {
  it('reads `peerAddress` from the Router and decodes it into an address', async function () {
    vi.mocked(readContract).mockResolvedValue(peer)

    const result = await getAgentAddress(client, { routerAddress })

    expect(result).toBe(expectedAgent)
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: routerAddress,
        functionName: 'peerAddress',
      }),
    )
  })

  it('falls back to the default router address', async function () {
    vi.mocked(readContract).mockResolvedValue(peer)

    await getAgentAddress(client)

    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: getHemiEarnRouterAddress(),
        functionName: 'peerAddress',
      }),
    )
  })

  it('rejects a missing `client`', async function () {
    await expect(
      getAgentAddress(undefined as unknown as Client, { routerAddress }),
    ).rejects.toThrow(/`client` is not defined/)
  })

  it('rejects a zero `routerAddress`', async function () {
    await expect(
      getAgentAddress(client, { routerAddress: zeroAddress }),
    ).rejects.toThrow(/`routerAddress` cannot be the zero address/)
  })

  it('rejects an invalid `routerAddress`', async function () {
    await expect(
      getAgentAddress(client, { routerAddress: '0xnotanaddress' as Address }),
    ).rejects.toThrow(/`routerAddress` is not a valid address/)
  })
})
