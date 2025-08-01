import { Address, WalletClient } from 'viem'
import { readContract } from 'viem/actions'

import { tgeClaimAbi, getTgeClaimAddress } from '../../contracts/claimContract'
import { EligibilityData } from '../../types/claim'

// Check if the claim is valid on-chain
export const checkIsClaimable = async function ({
  account,
  amount,
  chainId,
  eligibility,
  walletClient,
}: {
  account: Address
  amount: bigint
  chainId: number
  eligibility: EligibilityData
  walletClient: WalletClient
}): Promise<{ canClaim: true } | { canClaim: false; reason: string }> {
  try {
    const contractAddress = getTgeClaimAddress(chainId)
    const { claimGroupId, proof } = eligibility

    // Check if the claim is valid and claimable using isClaimable with user-provided amount
    // Using @ts-expect-error fails to compile so I need to use @ts-ignore
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
    const isClaimable = await readContract(walletClient, {
      abi: tgeClaimAbi,
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
