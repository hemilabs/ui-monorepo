import { useCanDepositForTransaction } from 'app/[locale]/hemi-earn/_hooks/useCanDeposit'
import { useEarnVaults } from 'app/[locale]/hemi-earn/_hooks/useEarnVaults'
import { featureFlags } from 'app/featureFlags'
import { type Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { baseTx } from '../_utils/fixtures'

vi.mock('app/featureFlags', () => ({
  featureFlags: { disableHemiEarnDeposits: false },
}))
vi.mock('app/[locale]/hemi-earn/_hooks/useEarnVaults', () => ({
  useEarnVaults: vi.fn(),
}))

const asset = '0x1111111111111111111111111111111111111111' as Address
const otherAsset = '0x2222222222222222222222222222222222222222' as Address

const vaultFor = (address: Address, isListed: boolean) => ({
  assets: [{ address }],
  isListed,
})

const deposit = { ...baseTx, asset, kind: 'DEPOSIT' as const }
const redeem = { ...baseTx, asset, kind: 'REDEEM' as const }

const mockVaults = (data: unknown, isPending = false) =>
  vi.mocked(useEarnVaults).mockReturnValue({ data, isPending })

describe('useCanDepositForTransaction', function () {
  beforeEach(function () {
    featureFlags.disableHemiEarnDeposits = false
  })

  it('allows a deposit whose vault is listed', function () {
    mockVaults([vaultFor(asset, true)])

    expect(useCanDepositForTransaction(deposit)).toStrictEqual({
      canDeposit: true,
      isPending: false,
      reason: undefined,
    })
  })

  it('blocks a deposit whose vault is delisted', function () {
    mockVaults([vaultFor(asset, false)])

    expect(useCanDepositForTransaction(deposit)).toStrictEqual({
      canDeposit: false,
      isPending: false,
      reason: 'vault-delisted',
    })
  })

  // A failed query and a list without the vault are the same thing here:
  // neither can say whether the vault still takes deposits.
  it.each([
    ['the query failed', undefined],
    ['the list omits it', [vaultFor(otherAsset, true)]],
  ])('blocks a deposit when %s', function (_name, vaults) {
    mockVaults(vaults)

    expect(useCanDepositForTransaction(deposit)).toStrictEqual({
      canDeposit: false,
      isPending: false,
      reason: undefined,
    })
  })

  it('still reports the pause when the vault is unresolved', function () {
    featureFlags.disableHemiEarnDeposits = true
    mockVaults(undefined)

    expect(useCanDepositForTransaction(deposit)).toStrictEqual({
      canDeposit: false,
      isPending: false,
      reason: 'deposits-paused',
    })
  })

  it('leaves a redeem alone when its vault is unresolved', function () {
    mockVaults(undefined)

    expect(useCanDepositForTransaction(redeem)).toStrictEqual({
      canDeposit: true,
      isPending: false,
      reason: undefined,
    })
  })

  it.each([
    ['holds a deposit', deposit, true],
    ['does not hold a redeem', redeem, false],
  ])('%s while the vaults load', function (_name, transaction, isPending) {
    mockVaults(undefined, true)

    expect(useCanDepositForTransaction(transaction).isPending).toBe(isPending)
  })
})
