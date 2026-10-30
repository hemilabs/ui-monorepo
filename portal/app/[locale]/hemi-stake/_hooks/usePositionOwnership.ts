import { type StakingPosition } from 'types/stakingDashboard'
import { Address, isAddressEqual } from 'viem'
import { useAccount } from 'wagmi'

export const usePositionOwnership = function ({
  owner,
  pastOwners,
}: Pick<StakingPosition, 'owner' | 'pastOwners'>) {
  const { address } = useAccount()

  const isWalletOwner = !!address && isAddressEqual(owner as Address, address)
  const isWalletPastOwner =
    !!address &&
    pastOwners.some(pastOwner => isAddressEqual(pastOwner as Address, address))

  return {
    isTransferredPosition: !isWalletOwner && isWalletPastOwner,
    isWalletOwner,
  }
}
