import { evmRemoteNetworks } from 'app/networks'
import { useGetClaimWithdrawalTxHash } from 'hooks/useL2Bridge'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Button } from 'ui-common/components/button'
import { Hash } from 'viem'
import { useChains } from 'wagmi'

import { useTunnelOperation } from '../_hooks/useTunnelOperation'
import { useTunnelState } from '../_hooks/useTunnelState'

import { ReviewEvmWithdrawal } from './reviewOperation/reviewEvmWithdrawal'

type Props = {
  state: ReturnType<typeof useTunnelState>
}

export const View = function ({ state }: Props) {
  const { partialWithdrawal, resetStateAfterOperation } = state

  // If coming from the Claim form, show the prove transaction briefly
  // but if entering from the history, there's no need to show it
  const [showClaimWithdrawalTx, setShowClaimWithdrawalTx] = useState(
    !!partialWithdrawal?.claimWithdrawalTxHash,
  )

  // https://github.com/BVM-priv/ui-monorepo/issues/158
  const l1ChainId = evmRemoteNetworks[0].id

  const chains = useChains()
  const t = useTranslations()
  const txHash = useTunnelOperation().txHash as Hash

  const { claimTxHash } = useGetClaimWithdrawalTxHash(l1ChainId, txHash)
  const chain = chains.find(c => c.id === l1ChainId)

  const hasTxHash = !!partialWithdrawal?.claimWithdrawalTxHash || !!claimTxHash

  useEffect(
    function hideClaimTxFromTransactionList() {
      const timeoutId = setTimeout(function () {
        if (showClaimWithdrawalTx) {
          setShowClaimWithdrawalTx(false)
        }
      }, 7000)
      return () => clearTimeout(timeoutId)
    },
    [setShowClaimWithdrawalTx, showClaimWithdrawalTx],
  )

  return (
    <ReviewEvmWithdrawal
      isRunningOperation={false}
      onClose={resetStateAfterOperation}
      submitButton={
        hasTxHash ? (
          <a
            href={`${chain.blockExplorers.default.url}/tx/${claimTxHash}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Button type="button">{t('common.view')}</Button>
          </a>
        ) : (
          <Skeleton className="h-14 w-full" />
        )
      }
      transactionsList={
        showClaimWithdrawalTx && partialWithdrawal?.claimWithdrawalTxHash
          ? [
              {
                id: 'claim',
                status: 'success',
                text: t('tunnel-page.transaction-status.withdrawal-claimed'),
                txHash: partialWithdrawal.claimWithdrawalTxHash,
              },
            ]
          : []
      }
    />
  )
}
