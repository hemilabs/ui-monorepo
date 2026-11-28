import { type HemiEarnVault, hemiEarnVaults } from '@vetro-protocol/hemi-earn'
import { type Address, isAddressEqual } from 'viem'

import {
  type EarnPosition,
  type EarnTransaction,
  type EarnVault,
} from '../types'

import { computeCooldownRemaining } from './cooldown'
import { isCooldownMature, needsManualClaim } from './transactionPredicates'

export const findVaultByAsset = (vaults: EarnVault[], asset: Address) =>
  vaults.find(vault => vault.assets.some(a => isAddressEqual(a.address, asset)))

export const findVaultByShare = (vaults: EarnVault[], shareAddress: Address) =>
  vaults.find(vault => isAddressEqual(vault.shareAddress, shareAddress))

export const findVaultMetadata = (stakingVault: Address) =>
  hemiEarnVaults.find(vault => isAddressEqual(vault.address, stakingVault))

export const isVaultListed = (stakingVault: Address) =>
  findVaultMetadata(stakingVault)?.delisted === false

// Only the vaults Vetro still offers, in the order Vetro lists them.
export const getListedVaults = (vaults: EarnVault[]) =>
  hemiEarnVaults
    .filter(metadata => !metadata.delisted)
    .map(metadata =>
      vaults.find(vault =>
        isAddressEqual(vault.stakingVault, metadata.address),
      ),
    )
    .filter((vault): vault is EarnVault => vault !== undefined)

export const getVaultDetails = ({
  curators = [],
  operator,
}: Pick<HemiEarnVault, 'curators' | 'operator'>) => ({
  curators:
    curators.length > 0
      ? { count: curators.length, names: curators.join(', ') }
      : undefined,
  operator,
})

const isClaimableWithdrawal = (tx: EarnTransaction, nowSec: number) =>
  tx.kind === 'REDEEM' &&
  (needsManualClaim(tx) ||
    isCooldownMature(
      tx,
      computeCooldownRemaining(
        tx.claimableAt ? BigInt(tx.claimableAt) : undefined,
        nowSec,
      ),
    ))

// A delisted vault stays reachable only while the wallet still has something to
// withdraw or claim from it.
export const canAccessVault = ({
  inTransitByShare,
  nowSec,
  positions,
  transactions,
  vault,
}: {
  inTransitByShare: Record<string, bigint>
  nowSec: number
  positions: EarnPosition[]
  transactions: EarnTransaction[]
  vault: EarnVault
}) =>
  vault.isListed ||
  positions.some(
    position =>
      isAddressEqual(position.shareAddress, vault.shareAddress) &&
      position.yourDeposit > BigInt(0),
  ) ||
  Object.entries(inTransitByShare).some(
    ([shareAddress, shares]) =>
      isAddressEqual(shareAddress as Address, vault.shareAddress) &&
      shares > BigInt(0),
  ) ||
  transactions.some(
    tx =>
      vault.assets.some(asset => isAddressEqual(asset.address, tx.asset)) &&
      isClaimableWithdrawal(tx, nowSec),
  )
