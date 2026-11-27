import { getChainAddedStorageKey } from 'app/[locale]/get-started/_utils/getChainAddedStorageKey'
import { describe, expect, it } from 'vitest'

describe('app/[locale]/get-started/_utils/getChainAddedStorageKey', function () {
  it('differs by wallet app', function () {
    const base = {
      address: '0x1111111111111111111111111111111111111111',
      chainId: 43111,
    }

    expect(
      getChainAddedStorageKey({ ...base, connectorId: 'wallet-a' }),
    ).not.toBe(getChainAddedStorageKey({ ...base, connectorId: 'wallet-b' }))
  })

  it('differs by account', function () {
    expect(
      getChainAddedStorageKey({
        address: '0x1111111111111111111111111111111111111111',
        chainId: 43111,
        connectorId: 'wallet-a',
      }),
    ).not.toBe(
      getChainAddedStorageKey({
        address: '0x2222222222222222222222222222222222222222',
        chainId: 43111,
        connectorId: 'wallet-a',
      }),
    )
  })

  it('differs by chain', function () {
    const base = {
      address: '0x1111111111111111111111111111111111111111',
      connectorId: 'wallet-a',
    }

    expect(getChainAddedStorageKey({ ...base, chainId: 43111 })).not.toBe(
      getChainAddedStorageKey({ ...base, chainId: 43112 }),
    )
  })

  it('uses the same key for the same address regardless of casing', function () {
    expect(
      getChainAddedStorageKey({
        address: '0xAbCd',
        chainId: 43111,
        connectorId: 'wallet-a',
      }),
    ).toBe(
      getChainAddedStorageKey({
        address: '0xabcd',
        chainId: 43111,
        connectorId: 'wallet-a',
      }),
    )
  })
})
