import { Chain, PublicClient, WalletClient } from 'viem'
import { readContract } from 'viem/actions'

import { merkleBoxAbi, getMerkleBoxAddress } from '../../contracts/merkleBox'
import { EligibilityData, LockupMonths } from '../../types/claim'

export const isClaimable = ({
  address,
  amount,
  chainId,
  claimGroupId,
  client,
  proof,
}: EligibilityData & {
  chainId: Chain['id']
  client: PublicClient | WalletClient
}) =>
  // Check if the claim is valid and claimable using isClaimable with user-provided amount
  readContract(client, {
    abi: merkleBoxAbi,
    address: getMerkleBoxAddress(chainId),
    args: [BigInt(claimGroupId), address, amount, proof],
    functionName: 'isClaimable',
  })

// Check if the claim is valid on-chain
export const checkIsClaimable = async function ({
  address,
  amount,
  chainId,
  claimGroupId,
  client,
  proof,
}: EligibilityData & {
  chainId: Chain['id']
  client: PublicClient | WalletClient
}): Promise<{ canClaim: true } | { canClaim: false; reason: string }> {
  try {
    const canClaim = await isClaimable({
      address,
      amount,
      chainId,
      claimGroupId,
      client,
      proof,
    })

    if (!canClaim) {
      return {
        canClaim: false,
        reason:
          'Tokens not claimable - may be already claimed or invalid proof',
      }
    }

    return { canClaim: true }
  } catch {
    return {
      canClaim: false,
      reason: 'Failed to validate claim eligibility',
    }
  }
}

export const getClaimGroupConfiguration = async function ({
  chainId,
  claimGroupId,
  lockupMonths,
  publicClient,
}: {
  chainId: Chain['id']
  claimGroupId: number
  lockupMonths: LockupMonths
  publicClient: PublicClient
}) {
  const [, bonus, lockupRatio] = await readContract(publicClient, {
    abi: merkleBoxAbi,
    address: getMerkleBoxAddress(chainId),
    args: [BigInt(claimGroupId), lockupMonths],
    functionName: 'holdingToBonusSchedule',
  })

  return { bonus, lockupRatio }
}
