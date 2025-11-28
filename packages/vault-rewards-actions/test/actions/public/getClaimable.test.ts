import { describe, expect, it } from 'vitest'

import { getClaimable } from '../../../src/actions/public/getClaimable'

describe('getClaimable', function () {
  it('should throw error when client is not provided', async function () {
    await expect(
      getClaimable(null, {
        account: '0x1234567890123456789012345678901234567890',
        vaultRewardsAddress: '0x1234567890123456789012345678901234567890',
      }),
    ).rejects.toThrow('Client is required')
  })

  it('should throw error when client chain is not defined', async function () {
    await expect(
      getClaimable(
        {},
        {
          account: '0x1234567890123456789012345678901234567890',
          vaultRewardsAddress: '0x1234567890123456789012345678901234567890',
        },
      ),
    ).rejects.toThrow('Public client chain is not defined')
  })

  it('should throw error when contract address is invalid', async function () {
    const mockClient = { chain: {} }
    await expect(
      getClaimable(mockClient, {
        account: '0x1234567890123456789012345678901234567890',
        vaultRewardsAddress: 'invalid-address',
      }),
    ).rejects.toThrow('Invalid contract address provided')
  })

  it('should throw error when account address is invalid', async function () {
    const mockClient = { chain: {} }
    await expect(
      getClaimable(mockClient, {
        account: 'invalid-address',
        vaultRewardsAddress: '0x1234567890123456789012345678901234567890',
      }),
    ).rejects.toThrow('Invalid account address provided')
  })

  it('should throw error when pool rewards address is zero address', async function () {
    const mockClient = { chain: {} }
    await expect(
      getClaimable(mockClient, {
        account: '0x1234567890123456789012345678901234567890',
        vaultRewardsAddress: '0x0000000000000000000000000000000000000000',
      }),
    ).rejects.toThrow('Contract address cannot be zero address')
  })

  it('should throw error when account address is zero address', async function () {
    const mockClient = { chain: {} }
    await expect(
      getClaimable(mockClient, {
        account: '0x0000000000000000000000000000000000000000',
        vaultRewardsAddress: '0x1234567890123456789012345678901234567890',
      }),
    ).rejects.toThrow('Account address cannot be zero address')
  })
})
