import { type Client } from 'viem'
import { describe, expect, it } from 'vitest'

import { getVaultRewardsAddress } from '../../../src/actions/public/getVaultRewardsAddress'

describe('getVaultRewardsAddress', function () {
  it('should throw error when client is not provided', async function () {
    await expect(
      getVaultRewardsAddress(null as unknown as Client),
    ).rejects.toThrow('Client is required')

    await expect(
      getVaultRewardsAddress(undefined as unknown as Client),
    ).rejects.toThrow('Client is required')
  })

  it('should throw error when client chain is not defined', async function () {
    const clientWithoutChain = {} as unknown as Client

    await expect(getVaultRewardsAddress(clientWithoutChain)).rejects.toThrow(
      'Client chain is not defined',
    )
  })
})
