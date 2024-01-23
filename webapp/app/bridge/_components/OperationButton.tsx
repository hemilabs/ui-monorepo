'use client'

import { useAccount } from 'wagmi'

type Props = {
  disabled: boolean
  operation: 'deposit' | 'withdraw'
  operationStatus: string
}

export const OperationButton = function ({
  disabled,
  operation,
  operationStatus,
}: Props) {
  const { isConnected } = useAccount()
  const shouldDisable = !isConnected || disabled

  const isDepositOperation = operation === 'deposit'

  const getOperationButtonText = function () {
    if (operationStatus === 'loading') {
      return isDepositOperation ? 'Depositing...' : 'Withdrawing...'
    }
    return isDepositOperation ? 'Deposit' : 'Withdraw'
  }

  return (
    <button
      className={`h-14 w-full cursor-pointer rounded-xl bg-black text-base text-white ${
        shouldDisable
          ? 'cursor-not-allowed bg-opacity-60'
          : 'cursor-pointer hover:bg-opacity-80'
      }`}
      disabled={shouldDisable}
      type="submit"
    >
      {getOperationButtonText()}
    </button>
  )
}
