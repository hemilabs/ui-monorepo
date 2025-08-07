import { Address, Chain, PublicClient, WalletClient } from 'viem'
import { readContract } from 'viem/actions'

import { merkleBoxAbi, getMerkleBoxAddress } from '../../contracts/merkleBox'
import { EligibilityData, LockupMonths } from '../../types/claim'

// Check if the claim is valid on-chain
export const checkIsClaimable = async function ({
  account,
  amount,
  chainId,
  client,
  eligibility,
}: {
  account: Address
  amount: bigint
  chainId: Chain['id']
  client: PublicClient | WalletClient
  eligibility: EligibilityData
}): Promise<{ canClaim: true } | { canClaim: false; reason: string }> {
  try {
    const contractAddress = getMerkleBoxAddress(chainId)
    const { claimGroupId, proof } = eligibility

    // Check if the claim is valid and claimable using isClaimable with user-provided amount
    // Using @ts-expect-error fails to compile so I need to use @ts-ignore
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
    const isClaimable = await readContract(client, {
      abi: merkleBoxAbi,
      address: contractAddress,
      args: [BigInt(claimGroupId), account, amount, proof],
      functionName: 'isClaimable',
    })

    if (!isClaimable) {
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
  // Using @ts-expect-error fails to compile so I need to use @ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
  const [, bonus, lockupRatio] = await readContract(publicClient, {
    abi: merkleBoxAbi,
    address: getMerkleBoxAddress(chainId),
    args: [BigInt(claimGroupId), lockupMonths],
    functionName: 'holdingToBonusSchedule',
  })

  return { bonus, lockupRatio }
}
