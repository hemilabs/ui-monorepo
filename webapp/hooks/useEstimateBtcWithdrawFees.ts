import { Chain } from 'viem'
import { useAccount } from 'wagmi'

import { useEstimateFees } from './useEstimateFees'

const WithdrawBtcGasUnits = BigInt(300_000)

export const useEstimateBtcWithdrawFees = function (chainId: Chain['id']) {
  const { status } = useAccount()
  return useEstimateFees({
    chainId,
    enabled: status === 'connected',
    gasUnits: WithdrawBtcGasUnits,
    overEstimation: 1.5,
  })
}
