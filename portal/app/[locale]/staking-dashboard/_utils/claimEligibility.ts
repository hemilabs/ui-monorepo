export type ClaimIneligibility =
  | 'not-connected'
  | 'not-holder'
  | 'nothing-claimable'
  | 'paused'
  | 'registry-too-large'
  | 'rewards-loading'
  | 'rewards-unavailable'
  | 'wrong-chain'

type EligibilityInput = {
  address: string | undefined
  connectedChainId: number | undefined
  generation: 'continuous' | 'epoch'
  // `undefined` where the read has not resolved. Never collapse it into `false`.
  hasRewards: boolean | undefined
  isRewardsUnavailable: boolean
  hemiChainId: number
  owner: string
  // Structural rather than the Lens return type, so the rule stays testable.
  systemState:
    | {
        maxTokensPerClaim: bigint
        paused: boolean
        tokens: readonly unknown[]
      }
    | undefined
}

import { isPositionOwner } from './positionOwnership'

/**
 * Why this position's rewards cannot be collected right now, or undefined if they can.
 *
 * Ordered most-structural first: the wrong chain matters whether or not the contract is
 * also paused, and neither is worth saying to someone who doesn't hold the position.
 */
export const claimIneligibility = function ({
  address,
  connectedChainId,
  generation,
  hasRewards,
  hemiChainId,
  isRewardsUnavailable,
  owner,
  systemState,
}: EligibilityInput): ClaimIneligibility | undefined {
  // Only a resolved, empty read earns "nothing to claim". The other two answers are
  // about the read, not about the money.
  const claimableReason = (): ClaimIneligibility | undefined =>
    hasRewards === undefined
      ? isRewardsUnavailable
        ? 'rewards-unavailable'
        : 'rewards-loading'
      : hasRewards
        ? undefined
        : 'nothing-claimable'

  if (generation === 'continuous') {
    // The original contract pays the current owner only - `collectAllRewards` reverts
    // for anyone else - so a sold position would be offered a Claim that can only fail.
    // The epoch branch below is the opposite case.
    if (!isPositionOwner({ address, owner })) {
      return 'not-holder'
    }
    return claimableReason()
  }

  // Deliberately not gated on current ownership. Epoch rewards are owed to whoever held
  // the position at each epoch, and `claim` only requires the caller to be the holder it
  // names, so a wallet that sold a position can still collect what it earned. Verified on
  // the devnet, where position 8 is held by one wallet while a previous owner is owed
  // 59.57 HEMI and claims successfully.
  //
  // Nothing extra is needed: the Lens read behind `hasRewards` is holder-scoped, so a
  // past owner owed nothing falls through to 'nothing-claimable' on its own.
  if (address === undefined) {
    return 'not-connected'
  }
  if (connectedChainId !== undefined && connectedChainId !== hemiChainId) {
    return 'wrong-chain'
  }
  // `preview` quotes while paused on purpose, so only the button goes away.
  if (systemState?.paused) {
    return 'paused'
  }
  // A claim has to settle the whole registry in one token page (see the claim action for
  // why the cursor is out of reach). Past that size no epoch span makes the call fit.
  if (
    systemState !== undefined &&
    systemState.tokens.length > Number(systemState.maxTokensPerClaim)
  ) {
    return 'registry-too-large'
  }
  return claimableReason()
}
