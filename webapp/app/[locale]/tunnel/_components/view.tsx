import { Button } from 'components/button'
import { ExternalLink } from 'components/externalLink'
import { useBitcoin } from 'hooks/useBitcoin'
import { useBtcDeposits } from 'hooks/useBtcDeposits'
import { useHemi } from 'hooks/useHemi'
import { useGetClaimWithdrawalTxHash } from 'hooks/useL2Bridge'
import { useNetworks } from 'hooks/useNetworks'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { getTokenByAddress } from 'utils/token'
import { Hash, isHash } from 'viem'
import { useChains } from 'wagmi'

import { useShowTransactionFromPreviousStep } from '../_hooks/useShowTransactionFromPreviousStep'
import { useTunnelOperation } from '../_hooks/useTunnelOperation'
import {
  BtcToHemiTunneling,
  EvmTunneling,
  TypedTunnelState,
  useTunnelState,
} from '../_hooks/useTunnelState'

import { ReviewBtcDeposit } from './reviewOperation/reviewBtcDeposit'
import { ReviewEvmWithdrawal } from './reviewOperation/reviewEvmWithdrawal'

const BtcViewDeposit = function ({
  state,
}: {
  state: TypedTunnelState<BtcToHemiTunneling>
}) {
  const { partialDeposit } = state

  const bitcoin = useBitcoin()
  const deposits = useBtcDeposits()
  const hemi = useHemi()
  const t = useTranslations()
  const { txHash } = useTunnelOperation()

  const deposit = deposits.find(d => d.transactionHash === txHash)

  // If coming from the Claim form, show the Claim transaction briefly
  // but if entering from the history, there's no need to show it
  const showClaimDepositTx = useShowTransactionFromPreviousStep(
    partialDeposit?.claimDepositTxHash,
  )

  return (
    <ReviewBtcDeposit
      chain={hemi}
      isRunningOperation={false}
      submitButton={
        <ExternalLink
          href={`${bitcoin.blockExplorers.default.url}/tx/${txHash}`}
        >
          <Button type="button">{t('common.view')}</Button>
        </ExternalLink>
      }
      token={getTokenByAddress(deposit.l1Token, deposit.l1ChainId)}
      transactionsList={
        showClaimDepositTx && partialDeposit?.claimDepositTxHash
          ? [
              {
                id: 'claim',
                status: 'success',
                text: t('tunnel-page.transaction-status.deposit-claimed'),
                txHash: partialDeposit.claimDepositTxHash,
              },
            ]
          : []
      }
    />
  )
}

type EvmViewWithdrawal = {
  state: ReturnType<typeof useTunnelState>
}

const EvmViewWithdrawal = function ({ state }: EvmViewWithdrawal) {
  const { partialWithdrawal, resetStateAfterOperation } = state

  const chains = useChains()
  const { evmRemoteNetworks } = useNetworks()
  const t = useTranslations()
  const txHash = useTunnelOperation().txHash as Hash

  // https://github.com/hemilabs/ui-monorepo/issues/158
  const l1ChainId = evmRemoteNetworks[0].id

  const { claimTxHash } = useGetClaimWithdrawalTxHash(l1ChainId, txHash)
  const chain = chains.find(c => c.id === l1ChainId)

  const hasTxHash = !!partialWithdrawal?.claimWithdrawalTxHash || !!claimTxHash

  // If coming from the Claim form, show the prove transaction briefly
  // but if entering from the history, there's no need to show it
  const showClaimWithdrawalTx = useShowTransactionFromPreviousStep(
    partialWithdrawal?.claimWithdrawalTxHash,
  )

  return (
    <ReviewEvmWithdrawal
      isRunningOperation={false}
      onClose={resetStateAfterOperation}
      submitButton={
        hasTxHash ? (
          <ExternalLink
            href={`${chain.blockExplorers.default.url}/tx/${claimTxHash}`}
          >
            <Button type="button">{t('common.view')}</Button>
          </ExternalLink>
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

export const View = function ({
  state,
}: {
  state: ReturnType<typeof useTunnelState>
}) {
  const { txHash } = useTunnelOperation()

  // Typescript can't infer it, but we can cast these safely
  if (isHash(txHash)) {
    return <EvmViewWithdrawal state={state as TypedTunnelState<EvmTunneling>} />
  }
  return (
    <BtcViewDeposit state={state as TypedTunnelState<BtcToHemiTunneling>} />
  )
}
