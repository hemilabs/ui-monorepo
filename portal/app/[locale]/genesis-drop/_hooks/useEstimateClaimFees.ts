import { useEstimateFees } from '@hemilabs/react-hooks/useEstimateFees'
import {
  encodeClaimTokens,
  getMerkleBoxAddress,
  type EligibilityData,
  type LockupMonths,
} from 'genesis-drop-actions'
import { useHemi } from 'hooks/useHemi'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
import { Hex } from 'viem'
import { useAccount, useEstimateGas } from 'wagmi'

export const useEstimateClaimFees = function ({
  eligibility,
  lockupMonths,
  ratio,
  termsSignature,
}: {
  eligibility: EligibilityData
  lockupMonths: LockupMonths
  ratio: number
  termsSignature: Hex
}) {
  const { address } = useAccount()
  const hemi = useHemi()
  const contractAddress = getMerkleBoxAddress(hemi.id)

  const { data: gasUnits, isError } = useEstimateGas({
    data: encodeClaimTokens({
      // will be defined if the query is enabled
      address: address!,
      amount: eligibility.amount,
      claimGroupId: eligibility.claimGroupId,
      lockupMonths,
      proof: eligibility.proof,
      ratio,
      termsSignature,
    }),
    query: { enabled: !!address && eligibility.claimGroupId !== undefined },
    to: contractAddress,
  })

  const { fees, isError: isFeeError } = useEstimateFees({
    chainId: hemi.id,
    fallbackPriorityFee: getFallbackPriorityFeeForChain(hemi.id),
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })

  return { fees: fees ?? BigInt(0), isError: isFeeError }
}
