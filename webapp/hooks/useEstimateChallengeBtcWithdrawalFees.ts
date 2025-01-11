import { Chain } from 'viem'
import { useAccount } from 'wagmi'

import { useEstimateFees } from './useEstimateFees'

const ChallengeWithdrawBtcGasUnits = BigInt(300_000)

export const useEstimateChallengeBtcWithdrawalFees = function (
  chainId: Chain['id'],
) {
  const { status } = useAccount()
  return useEstimateFees({
    chainId,
    enabled: status === 'connected',
    gasUnits: ChallengeWithdrawBtcGasUnits,
    overEstimation: 1.5,
  })
}
