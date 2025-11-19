import { zeroAddress, type Address, type Client } from 'viem'
import { readContract } from 'viem/actions'
import { hemiSepolia } from 'viem/chains'
import { describe, expect, it, vi } from 'vitest'

import { yieldVaultAbi } from '../../../src/abi'
import { getStrategyConfig } from '../../../src/actions/public/getStrategyConfig'
import { getBtcStakingVaultContractAddress } from '../../../src/constants'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

describe('getStrategyConfig', function () {
  const mockClient = { chain: hemiSepolia } as Client
  const validStrategyAddress = zeroAddress

  it('should throw error when client chain is not defined', async function () {
    const clientWithoutChain = {} as Client

    await expect(
      getStrategyConfig(clientWithoutChain, {
        address: validStrategyAddress,
      }),
    ).rejects.toThrow('Client chain is not defined')
  })

  it('should throw error when the address is invalid', async function () {
    await expect(
      getStrategyConfig(mockClient, {
        address: 'invalid-address' as Address,
      }),
    ).rejects.toThrow('Strategy address is not a valid address')

    await expect(
      getStrategyConfig(mockClient, {
        address: '' as Address,
      }),
    ).rejects.toThrow('Strategy address is not a valid address')

    await expect(
      getStrategyConfig(mockClient, {
        address: null as unknown as Address,
      }),
    ).rejects.toThrow('Strategy address is not a valid address')
  })

  it('should call readContract with correct parameters', async function () {
    const expectedVaultAddress = getBtcStakingVaultContractAddress(
      hemiSepolia.id,
    )

    await getStrategyConfig(mockClient, {
      address: validStrategyAddress,
    })

    expect(vi.mocked(readContract)).toHaveBeenCalledWith(mockClient, {
      abi: yieldVaultAbi,
      address: expectedVaultAddress,
      args: [validStrategyAddress],
      functionName: 'getStrategyConfig',
    })
  })
})
