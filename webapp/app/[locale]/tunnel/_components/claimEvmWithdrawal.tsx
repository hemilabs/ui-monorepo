import { Button } from 'components/button'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext, useEffect } from 'react'
import { ToEvmWithdrawOperation } from 'types/tunnel'

import { ToEvmWithdrawalContext } from '../_context/toEvmWithdrawalContext'
import { useClaimTransaction } from '../_hooks/useClaimTransaction'

import { SubmitWhenConnectedToChain } from './submitWhenConnectedToChain'

type Props = {
  withdrawal: ToEvmWithdrawOperation
}

export const ClaimEvmWithdrawal = function ({ withdrawal }: Props) {
  const { claimWithdrawal, claimWithdrawalReceipt, isReadyToClaim } =
    useClaimTransaction(withdrawal)
  const [operationStatus, setOperationStatus] = useContext(
    ToEvmWithdrawalContext,
  )
  const t = useTranslations()

  useEffect(
    function clearAfterSuccessfulClaim() {
      if (
        claimWithdrawalReceipt?.status !== 'success' ||
        operationStatus !== 'claiming'
      ) {
        return
      }
      setOperationStatus('idle')
    },
    [claimWithdrawalReceipt, operationStatus, setOperationStatus],
  )

  const handleClaim = function (e: FormEvent) {
    e.preventDefault()
    setOperationStatus('claiming')
    claimWithdrawal()
  }

  const isClaiming = operationStatus === 'claiming'

  return (
    <form className="flex [&>button]:w-full" onSubmit={handleClaim}>
      <SubmitWhenConnectedToChain
        chainId={withdrawal.l1ChainId}
        submitButton={
          <Button disabled={!isReadyToClaim || isClaiming} type="submit">
            {t(
              `tunnel-page.submit-button.${
                isClaiming ? 'claiming-withdrawal' : 'claim-withdrawal'
              }`,
            )}
          </Button>
        }
      />
    </form>
  )
}
