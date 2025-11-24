import { describe, expect, it } from 'vitest'

import { getClaimable } from '../../../src/actions/public/getClaimable'

describe('getClaimable', function () {
  it('should throw error when client is not provided', function () {
    expect(() =>
      getClaimable(null, {
        account: '0x1234567890123456789012345678901234567890',
        vaultRewardsAddress: '0x1234567890123456789012345678901234567890',
      }),
    ).toThrow('Client is required')
  })

  it('should throw error when client chain is not defined', function () {
    expect(() =>
      getClaimable(
        {},
        {
          account: '0x1234567890123456789012345678901234567890',
          vaultRewardsAddress: '0x1234567890123456789012345678901234567890',
        },
      ),
    ).toThrow('Public client chain is not defined')
  })

  it('should throw error when contract address is invalid', function () {
    const mockClient = { chain: {} }
    expect(() =>
      getClaimable(mockClient, {
        account: '0x1234567890123456789012345678901234567890',
        vaultRewardsAddress: 'invalid-address',
      }),
    ).toThrow('Invalid contract address provided')
  })

  it('should throw error when account address is invalid', function () {
    const mockClient = { chain: {} }
    expect(() =>
      getClaimable(mockClient, {
        account: 'invalid-address',
        vaultRewardsAddress: '0x1234567890123456789012345678901234567890',
      }),
    ).toThrow('Invalid account address provided')
  })

  it('should throw error when pool rewards address is zero address', function () {
    const mockClient = { chain: {} }
    expect(() =>
      getClaimable(mockClient, {
        account: '0x1234567890123456789012345678901234567890',
        vaultRewardsAddress: '0x0000000000000000000000000000000000000000',
      }),
    ).toThrow('Contract address cannot be zero address')
  })

  it('should throw error when account address is zero address', function () {
    const mockClient = { chain: {} }
    expect(() =>
      getClaimable(mockClient, {
        account: '0x0000000000000000000000000000000000000000',
        vaultRewardsAddress: '0x1234567890123456789012345678901234567890',
      }),
    ).toThrow('Account address cannot be zero address')
  })
})
