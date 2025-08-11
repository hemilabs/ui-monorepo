import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import {
  encodeClaimTokens,
  getMerkleBoxAddress,
  type EligibilityData,
  type LockupMonths,
} from 'tge-claim'
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
  const { address: account } = useAccount()
  const hemi = useHemi()
  const contractAddress = getMerkleBoxAddress(hemi.id)

  const {
    data: gasUnits,
    isError,
    isSuccess,
  } = useEstimateGas({
    data: encodeClaimTokens({
      account: account!,
      amount: BigInt(eligibility.amount),
      eligibility,
      lockupMonths,
      ratio,
      termsSignature,
    }),
    query: { enabled: !!account },
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
