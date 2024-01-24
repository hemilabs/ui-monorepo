import { useDelayedIdleStatus } from 'hooks/useDelayedIdleStatus'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useReloadBalances } from 'hooks/useReloadBalances'
import { FormEvent, useEffect } from 'react'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import { useWaitForTransaction } from 'wagmi'

import { useDepositNativeToken } from './useBridgeToken'

// Calculated from Testnet, may need to be reviewed/updated
const DepositGas = 150_000

type UseDeposit = {
  canDeposit: boolean
  fromInput: string
  fromToken: Token
  onSuccess?: () => void
  toToken: Token
}
export const useDeposit = function ({
  canDeposit,
  fromInput,
  fromToken,
  onSuccess,
  toToken,
}: UseDeposit) {
  const depositingNative = isNativeToken(fromToken)

  const depositFees = useEstimateFees(fromToken.chainId, DepositGas)

  const {
    depositNativeToken,
    depositNativeTokenTxHash,
    status: nativeTokenUserConfirmationStatus,
  } = useDepositNativeToken({
    amount: fromInput,
    enabled: depositingNative && canDeposit,
  })

  const { status: depositTxStatus } = useWaitForTransaction({
    hash: depositNativeTokenTxHash,
    onSuccess,
  })

  const [depositStatus, setDepositStatus] =
    useDelayedIdleStatus(depositTxStatus)

  useEffect(
    function clearDepositStatusAfterUserReject() {
      // When the user rejects a Tx, the deposit status hangs on "Loading"
      // so we need to set it to error manually
      if (nativeTokenUserConfirmationStatus === 'error') {
        setDepositStatus('error')
      }
    },
    [nativeTokenUserConfirmationStatus, setDepositStatus],
  )

  useReloadBalances({
    fromToken,
    status: depositStatus,
    toToken,
  })

  const deposit = function (e: FormEvent) {
    e.preventDefault()
    if (depositingNative) {
      setDepositStatus('loading')
      depositNativeToken()
    }
    // TODO Enable deposit token
    // else {
    //   depositToken()
    // }
  }

  return {
    deposit,
    depositFees,
    depositStatus,
    depositTxHash: depositNativeTokenTxHash,
  }
}
