import {
  encodeClaimTokens,
  getMerkleBoxAddress,
  type EligibilityData,
  type LockupMonths,
} from 'genesis-drop-actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { Hash } from 'viem'
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
  termsSignature: Hash
}) {
  const { address } = useAccount()
  const hemi = useHemi()
  const contractAddress = getMerkleBoxAddress(hemi.id)

  const {
    data: gasUnits,
    isError,
    isSuccess,
  } = useEstimateGas({
    data: encodeClaimTokens({
      address,
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

  return useEstimateFees({
    chainId: hemi.id,
    enabled: isSuccess,
    gasUnits,
    isGasUnitsError: isError,
    overEstimation: 1.5,
  })
}
