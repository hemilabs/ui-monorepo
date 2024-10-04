import { Button } from 'components/button'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext, useEffect } from 'react'
import { ToEvmWithdrawOperation } from 'types/tunnel'

import { ToEvmWithdrawalContext } from '../_context/toEvmWithdrawalContext'
import { useProveTransaction } from '../_hooks/useProveTransaction'

import { SubmitWhenConnectedToChain } from './submitWhenConnectedToChain'

type Props = {
  withdrawal: ToEvmWithdrawOperation
}

export const ProveWithdrawal = function ({ withdrawal }: Props) {
  const [operationRunning, setOperationRunning] = useContext(
    ToEvmWithdrawalContext,
  )
  const { isReadyToProve, proveWithdrawal, withdrawalProofReceipt } =
    useProveTransaction(withdrawal)
  const t = useTranslations()

  useEffect(
    function clearAfterSuccessfulProve() {
      if (
        withdrawalProofReceipt?.status !== 'success' ||
        operationRunning !== 'prove'
      ) {
        return
      }
      setOperationRunning('idle')
    },
    [operationRunning, setOperationRunning, withdrawalProofReceipt],
  )

  const isProving = operationRunning === 'prove'

  const handleProve = function (e: FormEvent) {
    e.preventDefault()
    setOperationRunning('prove')
    proveWithdrawal()
  }

  return (
    <form className="flex [&>button]:w-full" onSubmit={handleProve}>
      <SubmitWhenConnectedToChain
        chainId={withdrawal.l1ChainId}
        submitButton={
          <Button disabled={!isReadyToProve || isProving} type="submit">
            {t(
              `tunnel-page.submit-button.${
                isProving ? 'proving-withdrawal' : 'prove-withdrawal'
              }`,
            )}
          </Button>
        }
      />
    </form>
  )
}
